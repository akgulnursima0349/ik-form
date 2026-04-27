import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { step3Schema } from '../../lib/validations';
import type { Step3Data } from '../../lib/validations';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useOnboarding } from '../../hooks/useOnboarding';

export function Step3Emergency() {
  const { submission, nextStep, prevStep } = useOnboardingStore();
  const { saveStep, loading } = useOnboarding();

  const { register, handleSubmit, formState: { errors } } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: submission?.emergency_contact || {},
  });

  const onSubmit = async (data: Step3Data) => {
    const ok = await saveStep(3, data);
    if (ok) nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-gray-600">Acil durumlarda ulaşılacak kişi bilgilerini giriniz.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Kişi Adı Soyadı" required error={errors.name?.message} {...register('name')} placeholder="Ayşe Yılmaz" />
        <Input label="Yakınlık Derecesi" required error={errors.relationship?.message} {...register('relationship')} placeholder="Eş, Anne, Kardeş..." />
        <Input label="Telefon Numarası" required error={errors.phone?.message} {...register('phone')} placeholder="05559876543" />
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="secondary" onClick={prevStep}>← Geri</Button>
        <Button type="submit" isLoading={loading}>İleri →</Button>
      </div>
    </form>
  );
}
