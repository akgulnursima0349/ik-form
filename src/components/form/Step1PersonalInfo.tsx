import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { step1Schema } from '../../lib/validations';
import type { Step1Data } from '../../lib/validations';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useOnboarding } from '../../hooks/useOnboarding';

export function Step1PersonalInfo() {
  const { submission, nextStep } = useOnboardingStore();
  const { saveStep, loading } = useOnboarding();
  const defaults = submission?.personal_info;

  const { register, handleSubmit, formState: { errors } } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: defaults || {},
  });

  const onSubmit = async (data: Step1Data) => {
    const ok = await saveStep(1, data);
    if (ok) nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input label="Ad Soyad" required error={errors.full_name?.message} {...register('full_name')} placeholder="Ahmet Yılmaz" />
        </div>
        <Input label="TC Kimlik No" required error={errors.tc_no?.message} {...register('tc_no')} placeholder="12345678901" />
        <Input label="Doğum Tarihi" type="date" required error={errors.birth_date?.message} {...register('birth_date')} />
        <Input label="Doğum Yeri" required error={errors.birth_place?.message} {...register('birth_place')} placeholder="İstanbul" />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Cinsiyet <span className="text-red-500">*</span></label>
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" {...register('gender')}>
            <option value="">Seçiniz</option>
            <option value="male">Erkek</option>
            <option value="female">Kadın</option>
            <option value="other">Belirtmek İstemiyorum</option>
          </select>
          {errors.gender && <p className="text-xs text-red-600">{errors.gender.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Medeni Durum <span className="text-red-500">*</span></label>
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" {...register('marital_status')}>
            <option value="">Seçiniz</option>
            <option value="single">Bekar</option>
            <option value="married">Evli</option>
            <option value="divorced">Boşanmış</option>
            <option value="widowed">Dul</option>
          </select>
          {errors.marital_status && <p className="text-xs text-red-600">{errors.marital_status.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Öğrenim Durumu <span className="text-red-500">*</span></label>
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" {...register('education_level')}>
            <option value="">Seçiniz</option>
            <option value="ilkokul">İlkokul</option>
            <option value="ortaokul">Ortaokul</option>
            <option value="lise">Lise</option>
            <option value="onlisans">Ön Lisans</option>
            <option value="lisans">Lisans</option>
            <option value="yukseklisans">Yüksek Lisans</option>
            <option value="doktora">Doktora</option>
          </select>
          {errors.education_level && <p className="text-xs text-red-600">{errors.education_level.message}</p>}
        </div>

        <Input label="Departman" required error={errors.department?.message} {...register('department')} placeholder="Yazılım" />
        <Input label="Görev Unvanı" required error={errors.job_title?.message} {...register('job_title')} placeholder="Yazılım Geliştirici" />
        <Input label="İşe Başlama Tarihi" type="date" required error={errors.start_date?.message} {...register('start_date')} />
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" isLoading={loading}>İleri →</Button>
      </div>
    </form>
  );
}
