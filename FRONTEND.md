# Frontend Dokümantasyonu

## Genel Kurallar

- Her sayfa TypeScript ile yazılır
- Tailwind CSS ile stillenir, custom CSS yazılmaz
- Form yönetimi: React Hook Form + Zod validasyon
- Global state: Zustand
- Supabase işlemleri custom hook'lara alınır, sayfalarda doğrudan `supabase.*` çağrısı yapılmaz
- Yükleme durumları her async işlemde skeleton veya spinner ile gösterilir
- Hata durumları toast notification ile bildirilir (react-hot-toast)

---

## Renk Paleti ve Tasarım

Tailwind config'de şu renkler tanımlanır:

```js
// tailwind.config.ts
colors: {
  brand: {
    50: '#f0f4ff',
    100: '#e0e9ff',
    500: '#4F6EF7',
    600: '#3B5BDB',
    700: '#2F4AC2',
  }
}
```

- Primary buton: `bg-brand-600 hover:bg-brand-700 text-white`
- Secondary buton: `border border-gray-300 bg-white hover:bg-gray-50`
- Danger buton: `bg-red-600 hover:bg-red-700 text-white`
- Status badge'leri:
  - `draft`: `bg-gray-100 text-gray-700`
  - `submitted`: `bg-blue-100 text-blue-700`
  - `approved`: `bg-green-100 text-green-700`
  - `rejected`: `bg-red-100 text-red-700`

---

## Supabase Client (src/lib/supabase.ts)

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

---

## Zustand Store'ları

### `src/store/onboardingStore.ts`

Çalışan form akışının tüm state'ini tutar.

```typescript
interface OnboardingStore {
  // State
  employee: Employee | null;
  submission: OnboardingSubmission | null;
  currentStep: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  setEmployee: (employee: Employee) => void;
  setSubmission: (submission: OnboardingSubmission) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}
```

### `src/store/adminStore.ts`

Admin panelinin state'ini tutar.

```typescript
interface AdminStore {
  // State
  hrUser: HrUser | null;
  submissions: OnboardingSubmission[];
  selectedSubmission: OnboardingSubmission | null;
  filters: {
    status: SubmissionStatus | 'all';
    search: string;
  };
  isLoading: boolean;

  // Actions
  setHrUser: (user: HrUser) => void;
  setSubmissions: (submissions: OnboardingSubmission[]) => void;
  setSelectedSubmission: (submission: OnboardingSubmission | null) => void;
  setFilter: (key: string, value: string) => void;
  updateSubmissionStatus: (id: string, status: SubmissionStatus) => void;
}
```

---

## Custom Hooks

### `src/hooks/useOnboarding.ts`
- `verifyToken(token: string)`: Token doğrular, employee ve submission bilgisini getirir
- `saveStep(step: number, data: object)`: Adım verisini Supabase'e kaydeder
- `submitForm()`: Formu tamamlar, status'u `submitted` yapar

### `src/hooks/useAdmin.ts`
- `fetchSubmissions(filters)`: Başvuruları filtreli getirir
- `fetchSubmissionDetail(id: string)`: Belgeleri ve logları dahil getirir
- `approveSubmission(id: string, note?: string)`: Onaylar + log düşer + PDF üretir
- `rejectSubmission(id: string, note: string)`: Reddeder + log düşer

### `src/hooks/useDocuments.ts`
- `uploadDocument(file: File, submissionId: string, docType: DocType)`: Supabase Storage'a yükler
- `getDocumentUrl(storagePath: string)`: Signed URL üretir (geçici, 60 dk)

---

## SAYFA: Onboarding Form (`/onboarding/:token`)

### Bileşen: `src/pages/onboarding/OnboardingPage.tsx`

**Sayfa yüklendiğinde:**
1. URL'den `token` alınır
2. `verifyToken(token)` çağrılır
3. Loading skeleton gösterilir
4. Token geçersizse hata sayfası render edilir
5. Token geçerliyse mevcut `current_step` adımına atlanır

**Layout:**
```
┌─────────────────────────────────────────────┐
│  [Logo]              İşe Giriş Formu        │
├─────────────────────────────────────────────┤
│  ● ─── ● ─── ○ ─── ○ ─── ○ ─── ○          │  ← İlerleme çubuğu
│  Kişisel  İletişim  Acil  Banka  Belgeler  Onay │
├─────────────────────────────────────────────┤
│                                             │
│         Aktif adım bileşeni                 │
│                                             │
├─────────────────────────────────────────────┤
│  [← Geri]                    [İleri →]      │
└─────────────────────────────────────────────┘
```

**İlerleme çubuğu:**
- Tamamlanan adımlar: dolu daire + yeşil renk
- Aktif adım: dolu daire + mavi renk  
- Bekleyen adımlar: boş daire + gri renk
- Mobilde sadece "Adım 2 / 6" yazısı gösterilir

**Adım bileşenleri:**

#### `src/components/form/Step1PersonalInfo.tsx`

Form alanları (hepsi zorunlu aksi belirtilmedikçe):
- Ad Soyad (text)
- TC Kimlik No (text, 11 hane, Luhn algoritmasıyla doğrulama)
- Doğum Tarihi (date picker, 18+ yaş kontrolü)
- Doğum Yeri (text)
- Cinsiyet (select: Erkek / Kadın / Belirtmek İstemiyorum)
- Medeni Durum (select: Bekar / Evli / Boşanmış / Dul)
- Öğrenim Durumu (select: İlkokul / Ortaokul / Lise / Ön Lisans / Lisans / Yüksek Lisans / Doktora)
- Departman (text)
- Görev Unvanı (text)
- İşe Başlama Tarihi (date picker)

Kayıt: "İleri" butonuna basıldığında `saveStep(1, data)` çağrılır, başarılıysa `nextStep()`.

#### `src/components/form/Step2Contact.tsx`

Form alanları:
- Cep Telefonu (text, Türkiye formatı: 05xx xxx xx xx)
- Açık Adres (textarea)
- İl (select — Türkiye il listesi)
- İlçe (text)
- Posta Kodu (text, 5 hane)

#### `src/components/form/Step3Emergency.tsx`

Form alanları:
- Kişi Adı Soyadı (text)
- Yakınlık Derecesi (text: Eş, Anne, Baba, Kardeş vb.)
- Telefon Numarası (text)

#### `src/components/form/Step4Bank.tsx`

Form alanları:
- Banka Adı (select — Türkiye'deki başlıca bankalar listesi)
- IBAN (text, TR + 24 hane, IBAN format doğrulama)
- Hesap Sahibi Adı (text)

IBAN otomatik formatlama: her 4 karakterde boşluk eklenir (görsel), kaydedilirken boşluklar temizlenir.

#### `src/components/form/Step5Documents.tsx`

Yüklenecek belge tipleri:

| Belge | Zorunlu | Format |
|-------|---------|--------|
| Kimlik Fotokopisi | Evet | PDF, JPG, PNG |
| İkametgah Belgesi | Evet | PDF, JPG, PNG |
| Sağlık Raporu | Hayır | PDF |
| Diploma | Hayır | PDF, JPG |
| Referans Mektubu | Hayır | PDF |

Her belge için:
- Sürükle-bırak alanı (veya tıkla-yükle)
- Dosya boyutu limiti: 10 MB
- Yükleme başarılıysa yeşil checkmark + dosya adı gösterilir
- Yüklenen dosya silinebilir (Supabase'den de silinir)
- Yükleme progress bar gösterilir

Yükleme akışı:
1. Dosya seçilir
2. `uploadDocument(file, submissionId, docType)` çağrılır
3. Supabase Storage'a yüklenir
4. `documents` tablosuna kayıt düşülür
5. UI güncellenir

#### `src/components/form/Step6Consent.tsx`

İçerik:
- Doldurduğu bilgilerin özeti (salt okunur, tüm adımların verisi gösterilir)
- Checkbox: "Yukarıdaki bilgilerin doğru ve eksiksiz olduğunu beyan ederim. Bu form gönderiminin dijital imza yerine geçtiğini kabul ediyorum."
- Checkbox işaretlenmeden "Gönder" butonu disabled

"Gönder" butonuna basıldığında:
1. `submitForm()` çağrılır
2. `digital_consent: true`, `status: 'submitted'`, `submitted_at: now()` güncellenir
3. `token_used: true` yapılır
4. `/onboarding/success` sayfasına yönlendirilir

---

## SAYFA: Form Tamamlandı (`/onboarding/success`)

Basit teşekkür sayfası:
- Büyük yeşil checkmark ikonu (SVG)
- "Formunuz başarıyla gönderildi!" başlığı
- "HR ekibimiz belgelerinizi inceleyerek en kısa sürede sizinle iletişime geçecektir." açıklaması
- Sayfa yenilenirse form tekrar açılmaz (token_used = true)

---

## SAYFA: Admin Giriş (`/admin/login`)

**Bileşen:** `src/pages/admin/LoginPage.tsx`

Layout: Ekran ortasında kart
- E-posta input
- Şifre input (göster/gizle toggle)
- "Giriş Yap" butonu
- Hata mesajı (yanlış şifre vb.)

Giriş akışı:
```typescript
const { error } = await supabase.auth.signInWithPassword({ email, password });
if (!error) navigate('/admin');
```

Başarılı girişte `hr_users` tablosundan kullanıcı bilgisi çekilir, store'a kaydedilir.

---

## SAYFA: Admin Dashboard (`/admin`)

**Bileşen:** `src/pages/admin/DashboardPage.tsx`

### Layout

```
┌─────────────────────────────────────────────────┐
│ [Logo]  HR Paneli           [Kullanıcı Adı] [Çıkış] │
├─────────────────────────────────────────────────┤
│ [Çalışan Davet Et]  [Arama...]  [Durum Filtresi ▼] │
├─────────────────────────────────────────────────┤
│ Özet Kartları:                                  │
│ [Toplam: 24] [Bekleyen: 8] [Onaylı: 14] [Red: 2] │
├─────────────────────────────────────────────────┤
│ Başvuru Tablosu                                 │
│ Ad ─── E-posta ─── Durum ─── Tarih ─── İşlemler │
│ ...                                             │
└─────────────────────────────────────────────────┘
```

### Özet Kartları (`src/components/admin/StatCards.tsx`)

4 kart, her biri tıklanabilir (ilgili filteyi uygular):
- Toplam Başvuru (gri)
- Bekleyen İnceleme — `submitted` (mavi)
- Onaylanan — `approved` (yeşil)
- Reddedilen — `rejected` (kırmızı)

### Başvuru Tablosu (`src/components/admin/SubmissionsTable.tsx`)

Kolonlar:
| Kolon | Açıklama |
|-------|----------|
| Ad Soyad | `employees.full_name` |
| E-posta | `employees.email` |
| Departman | `personal_info.department` |
| Durum | Badge bileşeni |
| Gönderim Tarihi | `submitted_at` formatlanmış |
| İşlemler | "İncele" butonu |

Özellikler:
- Arama: ad, e-posta, departmana göre client-side filtreleme
- Durum filtresi: All / submitted / approved / rejected
- Sıralama: gönderim tarihine göre (en yeni üstte)
- Sayfalama: 20 kayıt / sayfa

Realtime güncelleme: Supabase Realtime ile `onboarding_submissions` tablosundaki değişiklikler anlık yansır.

---

## SAYFA: Başvuru Detay (`/admin/submissions/:id`)

**Bileşen:** `src/pages/admin/SubmissionDetailPage.tsx`

### Layout

```
┌─────────────────────────────────────────────────┐
│ [← Geri]  Ahmet Yılmaz  [submitted badge]       │
├──────────────────┬──────────────────────────────┤
│ Sol Kolon (2/3)  │  Sağ Kolon (1/3)             │
│                  │                              │
│ [Sekme Menüsü]   │  Onay Paneli                 │
│ Kişisel │ Banka  │  ─────────────               │
│ Belgeler │ Geçmiş│  [✓ Onayla]                  │
│                  │  [✗ Reddet]                  │
│ Sekme içeriği    │                              │
│                  │  Not ekle (textarea)         │
│                  │  ─────────────               │
│                  │  Onay Geçmişi                │
│                  │  • 12 Ara - HR Adı - Onaylandı│
└──────────────────┴──────────────────────────────┘
```

### Sekmeler

**Kişisel Bilgiler Sekmesi:**
Grid görünümde tüm `personal_info` ve `contact_info` alanları:
- Her alan: etiket (gri, küçük) + değer (siyah)
- TC Kimlik No sadece son 4 hanesi görünür (••••••• 1234)

**Banka Bilgileri Sekmesi:**
- IBAN: ortası gizlenir (TR12 •••• •••• •••• •••• 26)
- Banka Adı, Hesap Sahibi görünür

**Belgeler Sekmesi (`src/components/admin/DocumentList.tsx`):**
Her belge için:
- İkon (PDF/resim)
- Belge tipi etiketi
- Dosya adı + boyutu
- "Görüntüle" butonu → signed URL ile yeni sekmede açılır
- "İndir" butonu → direkt indir

**Geçmiş Sekmesi:**
`approval_logs` tablosundan kronolojik liste:
- Tarih + saat
- HR kullanıcı adı
- İşlem (Onaylandı / Reddedildi / Not eklendi)
- Not varsa italik olarak gösterilir

### Onay Paneli (`src/components/admin/ApprovalPanel.tsx`)

**Başvuru `submitted` ise:**
- "Onayla" butonu (yeşil): Modal açar → "Bu başvuruyu onaylamak istediğinize emin misiniz?" → Onayla
- "Reddet" butonu (kırmızı): Not girilmesi zorunlu bir modal açar → Reddet

**Başvuru `approved` ise:**
- "Onaylandı" yeşil badge
- "PDF İndir" butonu → Supabase Storage'dan signed URL ile indir
- Onaylayan HR adı + tarih

**Başvuru `rejected` ise:**
- "Reddedildi" kırmızı badge
- Red gerekçesi gösterilir
- "Yeniden İncele" butonu: status'u `submitted`'a çeker (ikinci şans)

**Onaylama akışı:**
```typescript
async function approveSubmission(id: string, note?: string) {
  // 1. Status güncelle
  await supabase
    .from('onboarding_submissions')
    .update({ status: 'approved' })
    .eq('id', id);

  // 2. Log düş
  await supabase
    .from('approval_logs')
    .insert({ submission_id: id, hr_user_id: hrUserId, action: 'approved', note });

  // 3. PDF üret ve kaydet
  const pdfBlob = await generatePdf(submission);
  const fileName = `onboarding_${Date.now()}.pdf`;
  await supabase.storage
    .from('generated-pdfs')
    .upload(`${id}/${fileName}`, pdfBlob);
}
```

---

## SAYFA: Çalışan Davet (`/admin/invite`)

**Bileşen:** `src/pages/admin/InvitePage.tsx`

### Layout

```
┌─────────────────────────────────────────────────┐
│ Yeni Çalışan Davet Et                           │
├─────────────────────────────────────────────────┤
│ Ad Soyad: [____________]                        │
│ E-posta:  [____________]                        │
│ Telefon:  [____________] (opsiyonel)            │
│                                                 │
│                      [Davet Oluştur]            │
├─────────────────────────────────────────────────┤
│ Oluşturulan Link:                               │
│ https://site.com/onboarding/abc-123-def         │
│ [Kopyala]                                       │
├─────────────────────────────────────────────────┤
│ Son Davetler                                    │
│ Ahmet Y. — 2 gün önce — [Bekliyor]             │
│ Ayşe K.  — 5 gün önce — [Tamamlandı]           │
└─────────────────────────────────────────────────┘
```

**Davet oluşturma akışı:**
1. Form doldurulur
2. `employees` tablosuna kayıt eklenir (token otomatik oluşur)
3. Link ekranda gösterilir ve panoya kopyalanabilir
4. "Son Davetler" listesi güncellenir

---

## PDF Üretimi (`src/lib/pdf.ts`)

jsPDF kullanılır. Türkçe karakter desteği için jsPDF'e custom font yüklenmeli (Roboto veya Noto Sans latin extended).

### PDF Yapısı

```
[Şirket Adı]                    [Logo placeholder]
─────────────────────────────────────────────
          İŞE GİRİŞ FORMU
─────────────────────────────────────────────

KİŞİSEL BİLGİLER
Ad Soyad:        Ahmet Yılmaz
TC Kimlik No:    ••••••••123
Doğum Tarihi:    15.01.1990
...

İLETİŞİM BİLGİLERİ
...

BANKA BİLGİLERİ
IBAN:            TR12 •••• •••• 1234
...

YÜKLENEN BELGELER
✓ Kimlik Fotokopisi (kimlik_123456.pdf)
✓ İkametgah Belgesi (ikametgah_123456.pdf)

─────────────────────────────────────────────
Onay Tarihi:     12.12.2024 14:32
Onaylayan HR:    Fatma Kaya
─────────────────────────────────────────────
Bu form dijital onay ile gönderilmiştir.
```

### `generatePdf(submission: OnboardingSubmission): Promise<Blob>`

```typescript
import jsPDF from 'jspdf';

export async function generatePdf(submission: OnboardingSubmission): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  // Font yükle (Türkçe karakter desteği)
  // İçerik ekle
  // Blob olarak döndür
  return doc.output('blob');
}
```

---

## Genel UI Bileşenleri (`src/components/ui/`)

### `Button.tsx`
Props: `variant: 'primary' | 'secondary' | 'danger' | 'ghost'`, `size: 'sm' | 'md' | 'lg'`, `isLoading: boolean`, `disabled: boolean`

### `Input.tsx`
Props: `label: string`, `error: string`, `hint: string`
React Hook Form ile uyumlu (`forwardRef`)

### `Badge.tsx`
Props: `status: SubmissionStatus`
Otomatik renk ve metin atar

### `Modal.tsx`
Props: `isOpen: boolean`, `onClose: () => void`, `title: string`
`Escape` tuşu ile kapanır, backdrop'a tıklanınca kapanır

### `Skeleton.tsx`
Yükleme durumları için animated placeholder

### `Toast` (react-hot-toast)
Başarı: `toast.success('...')`
Hata: `toast.error('...')`
Kullanım: tüm async işlem tamamlandığında

---

## Auth Guard (`src/components/AuthGuard.tsx`)

```typescript
export function AuthGuard({ children }: { children: ReactNode }) {
  const session = supabase.auth.getSession();
  if (!session) return <Navigate to="/admin/login" />;
  return <>{children}</>;
}
```

Router yapısı:
```tsx
<Route path="/admin" element={<AuthGuard><AdminLayout /></AuthGuard>}>
  <Route index element={<DashboardPage />} />
  <Route path="submissions/:id" element={<SubmissionDetailPage />} />
  <Route path="invite" element={<InvitePage />} />
</Route>
```

---

## Hata Senaryoları

| Durum | UI Davranışı |
|-------|-------------|
| Token geçersiz / süresi dolmuş | "Bu link artık geçerli değil" hata sayfası |
| Token kullanılmış (form gönderilmiş) | "Formunuz zaten gönderildi" bilgi sayfası |
| Supabase bağlantı hatası | Toast: "Sunucuya ulaşılamıyor, lütfen tekrar deneyin" |
| Dosya 10 MB'ı aşıyor | Input altında satır içi hata: "Dosya boyutu 10 MB'ı geçemez" |
| Geçersiz IBAN formatı | Input altında satır içi hata |
| Admin oturumu süresi dolmuş | Otomatik `/admin/login`'e yönlendir |
| Onay sırasında hata | Modal kapanmaz, toast hata gösterir, tekrar denenebilir |

---

## GitHub Pages Deploy

`vite.config.ts`:
```typescript
export default defineConfig({
  base: '/repo-adı/',    // GitHub repo adıyla değiştir
  plugins: [react()],
})
```

`package.json` scripts:
```json
{
  "scripts": {
    "build": "tsc && vite build",
    "deploy": "gh-pages -d dist"
  }
}
```

GitHub Actions (`.github/workflows/deploy.yml`):
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

React Router için `dist/404.html` → `dist/index.html` kopyalama gerekir (SPA routing için).
