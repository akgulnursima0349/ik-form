import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { step4Schema } from '../../lib/validations';
import type { Step4Data } from '../../lib/validations';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useOnboarding } from '../../hooks/useOnboarding';
import { TURKISH_BANKS } from '../../utils/constants';

function formatIBAN(value: string): string {
  const cleaned = value.replace(/\s/g, '').toUpperCase();
  return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
}

export function Step4Bank() {
  const { submission, nextStep, prevStep } = useOnboardingStore();
  const { saveStep, loading } = useOnboarding();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: submission?.bank_info || {},
  });

  const ibanValue = watch('iban', '');

  const onSubmit = async (data: Step4Data) => {
    const cleanData = { ...data, iban: data.iban.replace(/\s/g, '') };
    const ok = await saveStep(4, cleanData);
    if (ok) nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Banka Adı <span className="text-red-500">*</span></label>
          <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" {...register('bank_name')}>
            <option value="">Banka seçiniz</option>
            {TURKISH_BANKS.map((bank) => (
              <option key={bank} value={bank}>{bank}</option>
            ))}
          </select>
          {errors.bank_name && <p className="text-xs text-red-600">{errors.bank_name.message}</p>}
        </div>

        <Input label="Hesap Sahibi Adı" required error={errors.account_holder?.message} {...register('account_holder')} placeholder="Ahmet Yılmaz" />

        <div className="col-span-full flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">IBAN <span className="text-red-500">*</span></label>
          <input
            className={`rounded-lg border px-3 py-2 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.iban ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            placeholder="TR00 0000 0000 0000 0000 0000 00"
            value={formatIBAN(ibanValue)}
            onChange={(e) => setValue('iban', e.target.value.replace(/\s/g, ''), { shouldValidate: true })}
            maxLength={32}
          />
          {errors.iban && <p className="text-xs text-red-600">{errors.iban.message}</p>}
          <p className="text-xs text-gray-500">TR ile başlayan 26 karakterli IBAN numaranızı giriniz</p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="secondary" onClick={prevStep}>← Geri</Button>
        <Button type="submit" isLoading={loading}>İleri →</Button>
      </div>
    </form>
  );
}
