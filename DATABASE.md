# Veritabanı Dokümantasyonu — Supabase / PostgreSQL

## Genel Bakış

Tüm tablolar Supabase'in `public` şemasında yer alır. UUID'ler `gen_random_uuid()` ile üretilir. RLS (Row Level Security) tüm tablolarda aktiftir.

---

## Tablolar

### 1. `employees`

Onboarding sürecine davet edilen çalışanların temel kaydı. HR tarafından oluşturulur.

```sql
CREATE TABLE employees (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  token         UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_by    UUID REFERENCES hr_users(id) ON DELETE SET NULL,
  token_used    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Açıklamalar:**
- `token`: Çalışana gönderilen URL'deki benzersiz kimlik (`/onboarding/:token`)
- `token_used`: Form gönderildiğinde `true` yapılır, token tekrar kullanılamaz
- `invited_by`: Daveti oluşturan HR kullanıcısı

---

### 2. `onboarding_submissions`

Çalışanın doldurduğu formun tüm içeriğini tutan ana tablo.

```sql
CREATE TABLE onboarding_submissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),

  -- Adım 1: Kişisel Bilgiler
  personal_info     JSONB DEFAULT '{}',

  -- Adım 2: İletişim & Adres
  contact_info      JSONB DEFAULT '{}',

  -- Adım 3: Acil İletişim
  emergency_contact JSONB DEFAULT '{}',

  -- Adım 4: Banka Bilgileri
  bank_info         JSONB DEFAULT '{}',

  -- Meta
  current_step      INTEGER NOT NULL DEFAULT 1,
  digital_consent   BOOLEAN NOT NULL DEFAULT false,
  submitted_at      TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**JSONB Alan Şemaları:**

`personal_info`:
```json
{
  "tc_no": "12345678901",
  "birth_date": "1990-01-15",
  "birth_place": "İstanbul",
  "gender": "male",
  "marital_status": "single",
  "education_level": "university",
  "department": "Yazılım",
  "job_title": "Yazılım Geliştirici",
  "start_date": "2024-02-01"
}
```

`contact_info`:
```json
{
  "phone": "05551234567",
  "address": "Bağcılar Mah. Örnek Sok. No:5",
  "city": "İstanbul",
  "district": "Bağcılar",
  "postal_code": "34200"
}
```

`emergency_contact`:
```json
{
  "name": "Ayşe Yılmaz",
  "relationship": "Eş",
  "phone": "05559876543"
}
```

`bank_info`:
```json
{
  "bank_name": "Ziraat Bankası",
  "iban": "TR330006100519786457841326",
  "account_holder": "Ahmet Yılmaz"
}
```

---

### 3. `documents`

Çalışanın yüklediği belgeler (Supabase Storage referansları).

```sql
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES onboarding_submissions(id) ON DELETE CASCADE,
  doc_type        TEXT NOT NULL
                  CHECK (doc_type IN (
                    'kimlik',
                    'ikametgah',
                    'saglik_raporu',
                    'diploma',
                    'referans_mektubu',
                    'diger'
                  )),
  storage_path    TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_size       BIGINT,
  mime_type       TEXT,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Açıklamalar:**
- `storage_path`: Supabase Storage'daki tam yol (`employee-documents/submission_id/dosya.pdf`)
- `doc_type`: Belge kategorisi — UI'da Türkçe etiketle gösterilir

---

### 4. `approval_logs`

Her onay/red işleminin geçmişi. Immutable log — satır güncellenmez, sadece eklenir.

```sql
CREATE TABLE approval_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES onboarding_submissions(id) ON DELETE CASCADE,
  hr_user_id      UUID NOT NULL REFERENCES hr_users(id),
  action          TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'note_added')),
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

### 5. `hr_users`

HR admin kullanıcıları. Supabase Auth ile entegre çalışır.

```sql
CREATE TABLE hr_users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'hr' CHECK (role IN ('hr', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Açıklamalar:**
- `id`, Supabase Auth'taki `auth.users.id` ile birebir eşleşir
- Yeni HR kullanıcısı oluşturulurken önce `auth.users`'a Supabase dashboard'dan kayıt açılır, sonra bu tabloya eklenir
- `role: 'admin'` ileride ek yetkiler için ayrılmış

---

## İlişkiler

```
hr_users (1) ──────────────────── (N) employees [invited_by]
employees (1) ─────────────────── (1) onboarding_submissions
onboarding_submissions (1) ──── (N) documents
onboarding_submissions (1) ──── (N) approval_logs
hr_users (1) ─────────────────── (N) approval_logs
```

---

## Trigger: `updated_at` Otomatik Güncelleme

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON onboarding_submissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Row Level Security (RLS) Politikaları

### Genel Kural
- Çalışanlar (anonim token kullanıcıları): yalnızca kendi submission'larını okuyup güncelleyebilir
- HR kullanıcıları (Supabase Auth ile giriş yapmış): tüm kayıtları okuyabilir, `approval_logs` ekleyebilir

### `employees` tablosu

```sql
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Anonim kullanıcı yalnızca token ile eşleşen kaydı okuyabilir
CREATE POLICY "Token ile kendi kaydını oku"
ON employees FOR SELECT
TO anon
USING (token = current_setting('request.jwt.claims', true)::jsonb->>'token');

-- HR kullanıcıları tümünü görebilir
CREATE POLICY "HR tüm çalışanları görebilir"
ON employees FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM hr_users WHERE id = auth.uid()
));
```

> **Not:** Token doğrulaması için daha pratik yaklaşım: Supabase'in `service_role` key'i sadece backend'de kullanılır. Çünkü client-side JWT claim manipülasyonu karmaşık olabilir. Bunun yerine token doğrulamasını Supabase'in `rpc` (stored procedure) üzerinden yap:

```sql
-- Token doğrulama fonksiyonu (RPC)
CREATE OR REPLACE FUNCTION verify_onboarding_token(p_token UUID)
RETURNS TABLE (
  employee_id UUID,
  employee_email TEXT,
  employee_name TEXT,
  submission_id UUID,
  current_step INTEGER,
  status TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.email,
    e.full_name,
    s.id,
    s.current_step,
    s.status
  FROM employees e
  LEFT JOIN onboarding_submissions s ON s.employee_id = e.id
  WHERE e.token = p_token
    AND e.token_used = false;
END;
$$;
```

Frontend'de kullanımı:
```typescript
const { data, error } = await supabase.rpc('verify_onboarding_token', {
  p_token: token
});
```

### `onboarding_submissions` tablosu

```sql
ALTER TABLE onboarding_submissions ENABLE ROW LEVEL SECURITY;

-- Anonim INSERT (yeni submission oluşturma) — token kontrolü RPC'de yapılır
-- Bu yüzden INSERT için service_role üzerinden işlem yapılır (Supabase Edge Function veya RPC)
-- Alternatif: anon key ile insert'e izin ver ama SELECT'i kısıtla

CREATE POLICY "Herkes insert yapabilir"
ON onboarding_submissions FOR INSERT
TO anon
WITH CHECK (true);

-- Kendi submission'ını güncelleyebilir (submitted değilse)
-- employee_id eşleşmesi dışarıdan kontrol edilemeyeceği için burada sadece submitted olmayanları açıyoruz
CREATE POLICY "Draft submission güncellenebilir"
ON onboarding_submissions FOR UPDATE
TO anon
USING (status = 'draft');

-- HR tümünü görebilir ve güncelleyebilir
CREATE POLICY "HR tüm submission'ları yönetebilir"
ON onboarding_submissions FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM hr_users WHERE id = auth.uid()
));
```

### `documents` tablosu

```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Anonim yükleme (dosya yükleme sırasında)
CREATE POLICY "Herkes belge ekleyebilir"
ON documents FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "HR belgeleri yönetebilir"
ON documents FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM hr_users WHERE id = auth.uid()
));
```

### `approval_logs` tablosu

```sql
ALTER TABLE approval_logs ENABLE ROW LEVEL SECURITY;

-- Yalnızca HR yazabilir
CREATE POLICY "HR log ekleyebilir"
ON approval_logs FOR INSERT
TO authenticated
WITH CHECK (
  hr_user_id = auth.uid() AND
  EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid())
);

CREATE POLICY "HR logları okuyabilir"
ON approval_logs FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM hr_users WHERE id = auth.uid()
));
```

### `hr_users` tablosu

```sql
ALTER TABLE hr_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR kendi profilini görebilir"
ON hr_users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Tüm HR listesini görmek için (admin panelinde kullanıcı yönetimi)
CREATE POLICY "HR tüm HR kullanıcılarını görebilir"
ON hr_users FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM hr_users WHERE id = auth.uid()
));
```

---

## Supabase Storage Yapılandırması

### Bucket 1: `employee-documents`

```sql
-- Supabase dashboard'dan veya SQL ile:
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-documents', 'employee-documents', false);
```

Dosya yolu formatı: `{submission_id}/{doc_type}_{timestamp}.{ext}`

Örnek: `a1b2c3d4-e5f6.../kimlik_1706789012345.pdf`

```sql
-- Storage politikası: anonim yükleme
CREATE POLICY "Anonim belge yükleyebilir"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'employee-documents');

-- HR indirme/görüntüleme
CREATE POLICY "HR belge okuyabilir"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid())
);
```

### Bucket 2: `generated-pdfs`

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-pdfs', 'generated-pdfs', false);
```

Dosya yolu formatı: `{submission_id}/onboarding_{tarih}.pdf`

```sql
CREATE POLICY "HR PDF yükleyebilir"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'generated-pdfs' AND
  EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid())
);

CREATE POLICY "HR PDF okuyabilir"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated-pdfs' AND
  EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid())
);
```

---

## Başlangıç SQL (Kurulum Sırası)

Supabase SQL Editor'da şu sırayla çalıştır:

1. `hr_users` tablosu (auth.users'a bağımlı)
2. `employees` tablosu
3. `onboarding_submissions` tablosu
4. `documents` tablosu
5. `approval_logs` tablosu
6. Trigger
7. `verify_onboarding_token` fonksiyonu
8. RLS politikaları
9. Storage bucket'ları ve politikaları

---

## TypeScript Tipleri (src/types/database.ts)

```typescript
export type SubmissionStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type DocType = 'kimlik' | 'ikametgah' | 'saglik_raporu' | 'diploma' | 'referans_mektubu' | 'diger';
export type HrRole = 'hr' | 'admin';
export type ApprovalAction = 'approved' | 'rejected' | 'note_added';

export interface PersonalInfo {
  tc_no: string;
  birth_date: string;
  birth_place: string;
  gender: 'male' | 'female' | 'other';
  marital_status: 'single' | 'married' | 'divorced' | 'widowed';
  education_level: 'ilkokul' | 'ortaokul' | 'lise' | 'onlisans' | 'lisans' | 'yukseklisans' | 'doktora';
  department: string;
  job_title: string;
  start_date: string;
}

export interface ContactInfo {
  phone: string;
  address: string;
  city: string;
  district: string;
  postal_code: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface BankInfo {
  bank_name: string;
  iban: string;
  account_holder: string;
}

export interface Employee {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  token: string;
  invited_by: string | null;
  token_used: boolean;
  created_at: string;
}

export interface OnboardingSubmission {
  id: string;
  employee_id: string;
  status: SubmissionStatus;
  personal_info: PersonalInfo | null;
  contact_info: ContactInfo | null;
  emergency_contact: EmergencyContact | null;
  bank_info: BankInfo | null;
  current_step: number;
  digital_consent: boolean;
  submitted_at: string | null;
  updated_at: string;
  // Join'ler
  employees?: Employee;
  documents?: Document[];
  approval_logs?: ApprovalLog[];
}

export interface Document {
  id: string;
  submission_id: string;
  doc_type: DocType;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
}

export interface ApprovalLog {
  id: string;
  submission_id: string;
  hr_user_id: string;
  action: ApprovalAction;
  note: string | null;
  created_at: string;
  hr_users?: HrUser;
}

export interface HrUser {
  id: string;
  email: string;
  full_name: string;
  role: HrRole;
  created_at: string;
}
```
