import { z } from 'zod';

function validateTC(tc: string): boolean {
  if (tc.length !== 11 || !/^\d{11}$/.test(tc)) return false;
  if (tc[0] === '0') return false;
  const digits = tc.split('').map(Number);
  const sum1 = (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7;
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
  const check1 = (sum1 - sum2) % 10;
  if (check1 !== digits[9]) return false;
  const totalSum = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  return totalSum % 10 === digits[10];
}

function validateIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, '');
  if (!/^TR\d{24}$/.test(cleaned)) return false;
  return true;
}

export const step1Schema = z.object({
  full_name: z.string().min(2, 'Ad soyad zorunludur'),
  tc_no: z.string().refine(validateTC, { message: 'Geçerli bir TC Kimlik No giriniz' }),
  birth_date: z.string().min(1, 'Doğum tarihi zorunludur').refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 18;
  }, { message: '18 yaşından büyük olmalısınız' }),
  birth_place: z.string().min(2, 'Doğum yeri zorunludur'),
  gender: z.enum(['male', 'female', 'other']),
  marital_status: z.enum(['single', 'married', 'divorced', 'widowed']),
  education_level: z.enum(['ilkokul', 'ortaokul', 'lise', 'onlisans', 'lisans', 'yukseklisans', 'doktora']),
  department: z.string().min(2, 'Departman zorunludur'),
  job_title: z.string().min(2, 'Görev unvanı zorunludur'),
  start_date: z.string().min(1, 'İşe başlama tarihi zorunludur'),
});

export const step2Schema = z.object({
  phone: z.string().regex(/^05\d{9}$/, 'Geçerli bir telefon numarası giriniz (05XXXXXXXXX)'),
  address: z.string().min(10, 'Açık adres zorunludur'),
  city: z.string().min(2, 'İl zorunludur'),
  district: z.string().min(2, 'İlçe zorunludur'),
  postal_code: z.string().regex(/^\d{5}$/, 'Posta kodu 5 haneli olmalıdır'),
});

export const step3Schema = z.object({
  name: z.string().min(2, 'Ad soyad zorunludur'),
  relationship: z.string().min(2, 'Yakınlık derecesi zorunludur'),
  phone: z.string().regex(/^05\d{9}$/, 'Geçerli bir telefon numarası giriniz'),
});

export const step4Schema = z.object({
  bank_name: z.string().min(2, 'Banka adı zorunludur'),
  iban: z.string().refine((v) => validateIBAN(v), { message: 'Geçerli bir IBAN giriniz (TR + 24 hane)' }),
  account_holder: z.string().min(2, 'Hesap sahibi adı zorunludur'),
});

export const inviteSchema = z.object({
  full_name: z.string().min(2, 'Ad soyad zorunludur'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type InviteData = z.infer<typeof inviteSchema>;
export type LoginData = z.infer<typeof loginSchema>;
