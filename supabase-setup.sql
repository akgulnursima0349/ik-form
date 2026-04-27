-- =============================================
-- HR Onboarding Platform — Tam Kurulum Scripti
-- Supabase SQL Editor'da tek seferde çalıştır
-- =============================================

-- 1. TABLOLAR
-- =============================================

CREATE TABLE IF NOT EXISTS hr_users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'hr' CHECK (role IN ('hr', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employees (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  phone         TEXT,
  token         UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_by    UUID REFERENCES hr_users(id) ON DELETE SET NULL,
  token_used    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS onboarding_submissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  personal_info     JSONB DEFAULT '{}',
  contact_info      JSONB DEFAULT '{}',
  emergency_contact JSONB DEFAULT '{}',
  bank_info         JSONB DEFAULT '{}',
  current_step      INTEGER NOT NULL DEFAULT 1,
  digital_consent   BOOLEAN NOT NULL DEFAULT false,
  submitted_at      TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES onboarding_submissions(id) ON DELETE CASCADE,
  doc_type        TEXT NOT NULL
                  CHECK (doc_type IN ('kimlik','ikametgah','saglik_raporu','diploma','referans_mektubu','diger')),
  storage_path    TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_size       BIGINT,
  mime_type       TEXT,
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approval_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   UUID NOT NULL REFERENCES onboarding_submissions(id) ON DELETE CASCADE,
  hr_user_id      UUID NOT NULL REFERENCES hr_users(id),
  action          TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'note_added')),
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON onboarding_submissions;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON onboarding_submissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. RPC FONKSİYONU
-- =============================================

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

-- 4. RLS POLİTİKALARI
-- =============================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_users ENABLE ROW LEVEL SECURITY;

-- employees
CREATE POLICY "HR tüm çalışanları görebilir"
ON employees FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid()));

CREATE POLICY "Anon token ile çalışan kaydını görebilir"
ON employees FOR SELECT TO anon
USING (true);

CREATE POLICY "Anon token kullanımını güncelleyebilir"
ON employees FOR UPDATE TO anon
USING (true);

-- onboarding_submissions
CREATE POLICY "Herkes insert yapabilir"
ON onboarding_submissions FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Draft submission güncellenebilir"
ON onboarding_submissions FOR UPDATE TO anon
USING (status = 'draft');

CREATE POLICY "Anon kendi submission'ını okuyabilir"
ON onboarding_submissions FOR SELECT TO anon
USING (true);

CREATE POLICY "HR tüm submission'ları yönetebilir"
ON onboarding_submissions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid()));

-- documents
CREATE POLICY "Herkes belge ekleyebilir"
ON documents FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Anon belgeleri okuyabilir"
ON documents FOR SELECT TO anon
USING (true);

CREATE POLICY "HR belgeleri yönetebilir"
ON documents FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid()));

-- approval_logs
CREATE POLICY "HR log ekleyebilir"
ON approval_logs FOR INSERT TO authenticated
WITH CHECK (
  hr_user_id = auth.uid() AND
  EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid())
);

CREATE POLICY "HR logları okuyabilir"
ON approval_logs FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid()));

-- hr_users
CREATE POLICY "HR kendi profilini görebilir"
ON hr_users FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "HR tüm HR kullanıcılarını görebilir"
ON hr_users FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid()));

-- 5. STORAGE BUCKET'LARI
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-documents', 'employee-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-pdfs', 'generated-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage politikaları
CREATE POLICY "Anonim belge yükleyebilir"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'employee-documents');

CREATE POLICY "Anonim belge okuyabilir"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'employee-documents');

CREATE POLICY "HR belge okuyabilir"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'employee-documents' AND
  EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid())
);

CREATE POLICY "HR PDF yükleyebilir"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'generated-pdfs' AND
  EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid())
);

CREATE POLICY "HR PDF okuyabilir"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'generated-pdfs' AND
  EXISTS (SELECT 1 FROM hr_users WHERE id = auth.uid())
);
