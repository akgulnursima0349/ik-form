# HR Onboarding Platform — Proje Dokümanı

## Proje Özeti

Yeni işe giren çalışanların tüm işe giriş bilgilerini (kişisel bilgiler, belgeler, banka bilgileri, acil iletişim vb.) doldurabileceği çok adımlı bir onboarding formu ve HR yöneticilerin bu başvuruları inceleyip onaylayabileceği bir admin panelinden oluşan full-stack web uygulaması.

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v3 |
| State | Zustand |
| Form | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| PDF üretimi | jsPDF + html2canvas |
| Deploy | GitHub Pages (frontend) |
| Router | React Router v6 |
| HTTP | Supabase JS Client (supabase-js v2) |

**Ayrı backend kurma. Supabase her şeyi karşılıyor.**

---

## Klasör Yapısı

```
hr-onboarding/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/              # Genel UI bileşenleri (Button, Input, Badge, Modal vb.)
│   │   ├── form/            # Onboarding form bileşenleri
│   │   └── admin/           # Admin panel bileşenleri
│   ├── pages/
│   │   ├── onboarding/      # Çalışan formu sayfaları
│   │   └── admin/           # Admin panel sayfaları
│   ├── hooks/               # Custom React hooks
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client + tipler
│   │   ├── pdf.ts           # PDF üretim fonksiyonları
│   │   └── validations.ts   # Zod şemaları
│   ├── store/               # Zustand store'ları
│   ├── types/               # TypeScript tipleri
│   └── utils/               # Yardımcı fonksiyonlar
├── .env.example
├── vite.config.ts
└── tailwind.config.ts
```

---

## Ortam Değişkenleri (.env)

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxx
```

---

## Rotalar (React Router)

| Path | Sayfa | Erişim |
|------|-------|--------|
| `/onboarding/:token` | Çalışan onboarding formu | Public (token-based) |
| `/onboarding/success` | Form tamamlandı sayfası | Public |
| `/admin/login` | HR giriş sayfası | Public |
| `/admin` | Dashboard (başvuru listesi) | Auth gerekli |
| `/admin/submissions/:id` | Başvuru detay sayfası | Auth gerekli |
| `/admin/invite` | Çalışan davet sayfası | Auth gerekli |
| `*` | 404 sayfası | Public |

---

## Kimlik Doğrulama Mantığı

### Çalışan (token-based)
- HR admin, `/admin/invite` sayfasından çalışanın e-posta adresini girer
- Sistem `employees` tablosuna kayıt açar ve benzersiz bir UUID token üretir
- Çalışana `https://site.com/onboarding/:token` linki gönderilir (e-posta gönderimi opsiyonel, link kopyalanabilir)
- Çalışan bu linke gittiğinde token doğrulanır, form açılır
- **Supabase Auth kullanılmaz çalışan için** — sadece token kontrolü yapılır

### HR Admin (Supabase Auth)
- Supabase Email/Password Auth kullanılır
- `hr_users` tablosunda kaydı olan e-postalar admin sayılır
- Admin girişi yapıldıktan sonra tüm `/admin/*` rotaları erişilebilir
- `AuthGuard` bileşeni korumalı rotaları sarar

---

## Form Akışı (Çalışan Tarafı)

```
Token doğrulama
    ↓
Adım 1: Kişisel Bilgiler
    ↓
Adım 2: İletişim & Adres
    ↓
Adım 3: Acil İletişim Kişisi
    ↓
Adım 4: Banka Bilgileri
    ↓
Adım 5: Belge Yükleme
    ↓
Adım 6: Onay & İmza (checkbox ile dijital onay)
    ↓
Gönder → status: 'submitted'
    ↓
Teşekkür sayfası
```

**Kritik:** Her adım tamamlandıktan sonra veri Supabase'e kaydedilir (`draft` statüsünde). Sayfa kapanırsa token ile geri dönüldüğünde kaldığı adımdan devam eder.

---

## Onay Akışı (Admin Tarafı)

```
Başvuru listesi (status: submitted)
    ↓
Detay sayfasını aç
    ↓
Bilgileri incele + belgeleri görüntüle
    ↓
[Onayla] veya [Reddet + Not ekle]
    ↓
approval_logs'a kayıt düşülür
status → 'approved' veya 'rejected'
    ↓
[Onaylandıysa] PDF otomatik üretilir
PDF → Supabase Storage'a kaydedilir
```

---

## PDF İçeriği

PDF onaylandıktan sonra otomatik üretilir ve şunları içerir:
- Şirket başlığı (sabit metin)
- Çalışan adı, TC kimlik no, doğum tarihi
- İletişim bilgileri
- Banka bilgileri
- Yüklenen belgelerin listesi (dosya adları)
- Onay tarihi ve onaylayan HR kullanıcısı
- Dijital onay ifadesi

---

## Supabase Storage Bucket'ları

| Bucket | İçerik | Erişim |
|--------|--------|--------|
| `employee-documents` | Çalışanın yüklediği belgeler | Authenticated (HR) |
| `generated-pdfs` | Sistem tarafından üretilen PDF'ler | Authenticated (HR) |

---

## Geliştirme Notları

- Tüm tarihler ISO 8601 formatında saklanır (UTC)
- Türkçe karakter desteği için font encoding'e dikkat edilmeli (jsPDF'de custom font gerekebilir)
- Form validasyonları Zod ile tanımlanır, hem client hem tip güvenliği sağlar
- `form_sections` tablosu her adımın tamamlanma durumunu takip eder — bu sayede ilerleme çubuğu doğru gösterilir
- RLS (Row Level Security) tüm tablolarda aktif olmalı — detaylar DATABASE.md'de
- Çalışanlar yalnızca kendi submission'larını görebilir (token ile), HR tümünü görebilir
- GitHub Pages deploy için `vite.config.ts`'de `base: '/repo-adı/'` ayarlanmalı
