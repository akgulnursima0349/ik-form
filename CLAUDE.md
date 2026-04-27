# Claude Code — Proje Talimatları

Bu klasörde 3 doküman var. Hepsini oku, sonra kodu yaz.

## Oku:
1. `PROJECT.md` — Genel mimari, stack, rotalar, akışlar
2. `DATABASE.md` — Supabase tabloları, RLS politikaları, TypeScript tipleri
3. `FRONTEND.md` — Her sayfa, her bileşen, her hook, state yönetimi, PDF, deploy

## Projeyi Yap:

Yukarıdaki 3 dokümanı eksiksiz uygulayan bir React + TypeScript + Supabase projesi kur.

### Başlangıç adımları:
1. `npm create vite@latest . -- --template react-ts` ile proje oluştur
2. Bağımlılıkları yükle: `@supabase/supabase-js`, `react-router-dom`, `zustand`, `react-hook-form`, `zod`, `@hookform/resolvers`, `jspdf`, `react-hot-toast`, `tailwindcss`
3. `.env.example` oluştur (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
4. Klasör yapısını PROJECT.md'deki gibi oluştur
5. DATABASE.md'deki TypeScript tiplerini `src/types/database.ts`'e yaz
6. Supabase client'ı kur
7. Store'ları, hook'ları, sayfaları sırayla oluştur

### Öncelik sırası:
1. Tip tanımları ve Supabase client
2. Zustand store'ları
3. Custom hook'lar (useOnboarding, useAdmin, useDocuments)
4. UI bileşenleri (Button, Input, Badge, Modal, Skeleton)
5. Onboarding sayfaları (token doğrulama, 6 adım formu, teşekkür)
6. Admin sayfaları (login, dashboard, detay, davet)
7. PDF üretimi
8. AuthGuard ve routing
9. GitHub Actions deploy config

### Kritik noktalar:
- Ayrı backend YAZMA. Supabase client ile doğrudan işlem yap.
- Her async işlemde loading state ve hata yönetimi ekle.
- Form adımları arası geçişte Supabase'e kaydet (draft).
- Token doğrulama için DATABASE.md'deki `verify_onboarding_token` RPC fonksiyonunu kullan.
- Türkçe karakter için jsPDF'e custom font yükle.
