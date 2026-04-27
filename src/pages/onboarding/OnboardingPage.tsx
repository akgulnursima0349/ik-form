import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useOnboarding } from '../../hooks/useOnboarding';
import { SkeletonForm } from '../../components/ui/Skeleton';
import { Step1PersonalInfo } from '../../components/form/Step1PersonalInfo';
import { Step2Contact } from '../../components/form/Step2Contact';
import { Step3Emergency } from '../../components/form/Step3Emergency';
import { Step4Bank } from '../../components/form/Step4Bank';
import { Step5Documents } from '../../components/form/Step5Documents';
import { Step6Consent } from '../../components/form/Step6Consent';

const STEPS = [
  { label: 'Kişisel', short: '1' },
  { label: 'İletişim', short: '2' },
  { label: 'Acil', short: '3' },
  { label: 'Banka', short: '4' },
  { label: 'Belgeler', short: '5' },
  { label: 'Onay', short: '6' },
];

function ProgressBar({ current }: { current: number }) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden sm:flex items-center gap-0">
        {STEPS.map((step, i) => {
          const num = i + 1;
          const done = num < current;
          const active = num === current;
          return (
            <div key={i} className="flex items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                done ? 'bg-green-500 text-white' : active ? 'bg-brand-600 text-white' : 'border-2 border-gray-300 bg-white text-gray-400'
              }`}>
                {done ? '✓' : num}
              </div>
              <span className={`mx-1 text-xs ${active ? 'font-semibold text-brand-600' : 'text-gray-400'}`}>{step.label}</span>
              {i < STEPS.length - 1 && (
                <div className={`mx-1 h-0.5 w-8 ${done ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
      {/* Mobile */}
      <p className="sm:hidden text-sm font-medium text-gray-600">Adım {current} / {STEPS.length} — {STEPS[current - 1].label}</p>
    </>
  );
}

const STEP_COMPONENTS = [Step1PersonalInfo, Step2Contact, Step3Emergency, Step4Bank, Step5Documents, Step6Consent];

export function OnboardingPage() {
  const { token } = useParams<{ token: string }>();
  const { currentStep } = useOnboardingStore();
  const { verifyToken, loading } = useOnboarding();
  const [tokenStatus, setTokenStatus] = useState<'checking' | 'valid' | 'invalid' | 'used'>('checking');

  useEffect(() => {
    if (!token) { setTokenStatus('invalid'); return; }
    verifyToken(token).then((result) => {
      if (result.valid) setTokenStatus('valid');
      else if (result.reason === 'used') setTokenStatus('used');
      else setTokenStatus('invalid');
    });
  }, [token]);

  if (tokenStatus === 'checking' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-sm">
          <SkeletonForm />
        </div>
      </div>
    );
  }

  if (tokenStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="text-4xl">🔗</div>
          <h2 className="text-xl font-semibold text-gray-800">Bu link artık geçerli değil</h2>
          <p className="text-gray-500">Lütfen HR departmanı ile iletişime geçiniz.</p>
        </div>
      </div>
    );
  }

  if (tokenStatus === 'used') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="text-4xl">✅</div>
          <h2 className="text-xl font-semibold text-gray-800">Formunuz zaten gönderildi</h2>
          <p className="text-gray-500">Başvurunuz HR ekibimiz tarafından incelenmektedir.</p>
        </div>
      </div>
    );
  }

  const StepComponent = STEP_COMPONENTS[currentStep - 1];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-brand-600">HR Platform</div>
          <p className="text-sm text-gray-500">İşe Giriş Formu</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b bg-gray-50 px-6 py-4">
            <ProgressBar current={currentStep} />
          </div>

          <div className="px-6 py-6">
            <h2 className="mb-6 text-lg font-semibold text-gray-800">
              {STEPS[currentStep - 1].label} Bilgileri
            </h2>
            <StepComponent />
          </div>
        </div>
      </div>
    </div>
  );
}
