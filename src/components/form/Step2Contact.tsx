import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { step2Schema } from '../../lib/validations';
import type { Step2Data } from '../../lib/validations';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useOnboarding } from '../../hooks/useOnboarding';
import { TURKISH_CITIES } from '../../utils/constants';

export function Step2Contact() {
  const { submission, nextStep, prevStep } = useOnboardingStore();
  const { saveStep, loading } = useOnboarding();

  const { register, handleSubmit, formState: { errors } } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: submission?.contact_info || {},
  });

  const onSubmit = async (data: Step2Data) => {
    const ok = await saveStep(2, data);
    if (ok) nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Cep Telefonu"
          required
          error={errors.phone?.message}
          {...register('phone')}
          placeholder="05551234567"
          hint="Türkiye formatı: 05XXXXXXXXX"
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">İl <span className="text-red-500">*</span></label>
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" {...register('city')}>
            <option value="">İl seçiniz</option>
            {TURKISH_CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          {errors.city && <p className="text-xs text-red-600">{errors.city.message}</p>}
        </div>

        <Input label="İlçe" required error={errors.district?.message} {...register('district')} placeholder="Kadıköy" />
        <Input label="Posta Kodu" required error={errors.postal_code?.message} {...register('postal_code')} placeholder="34710" maxLength={5} />

        <div className="col-span-full flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Açık Adres <span className="text-red-500">*</span></label>
          <textarea
            rows={3}
            className={`rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.address ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            placeholder="Mahalle, sokak, bina no, daire no..."
            {...register('address')}
          />
          {errors.address && <p className="text-xs text-red-600">{errors.address.message}</p>}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="secondary" onClick={prevStep}>← Geri</Button>
        <Button type="submit" isLoading={loading}>İleri →</Button>
      </div>
    </form>
  );
}
