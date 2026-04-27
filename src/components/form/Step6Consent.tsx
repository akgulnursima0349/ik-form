import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useOnboarding } from '../../hooks/useOnboarding';
import { DOC_TYPE_LABELS } from '../../utils/constants';

function InfoRow({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div className="flex gap-2 py-1">
      <span className="w-40 flex-shrink-0 text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-900">{value || '-'}</span>
    </div>
  );
}

export function Step6Consent() {
  const navigate = useNavigate();
  const { submission, employee, prevStep } = useOnboardingStore();
  const { submitForm, loading } = useOnboarding();
  const [consented, setConsented] = useState(false);

  if (!submission) return null;

  const p = submission.personal_info;
  const c = submission.contact_info;
  const e = submission.emergency_contact;
  const b = submission.bank_info;

  const handleSubmit = async () => {
    const ok = await submitForm();
    if (ok) navigate('/onboarding/success');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
        <h4 className="text-sm font-semibold text-gray-700">Kişisel Bilgiler</h4>
        <InfoRow label="Ad Soyad" value={employee?.full_name} />
        <InfoRow label="TC Kimlik No" value={p?.tc_no ? '•••••••' + p.tc_no.slice(-4) : '-'} />
        <InfoRow label="Doğum Tarihi" value={p?.birth_date} />
        <InfoRow label="Departman" value={p?.department} />
        <InfoRow label="Görev Unvanı" value={p?.job_title} />
        <InfoRow label="İşe Başlama" value={p?.start_date} />

        <h4 className="text-sm font-semibold text-gray-700 pt-2">İletişim</h4>
        <InfoRow label="Telefon" value={c?.phone} />
        <InfoRow label="Şehir" value={c?.city ? `${c.city} / ${c.district}` : undefined} />

        <h4 className="text-sm font-semibold text-gray-700 pt-2">Acil İletişim</h4>
        <InfoRow label="Kişi" value={e?.name} />
        <InfoRow label="Yakınlık" value={e?.relationship} />

        <h4 className="text-sm font-semibold text-gray-700 pt-2">Banka</h4>
        <InfoRow label="Banka" value={b?.bank_name} />
        <InfoRow label="Hesap Sahibi" value={b?.account_holder} />

        <h4 className="text-sm font-semibold text-gray-700 pt-2">Yüklenen Belgeler</h4>
        {(submission.documents || []).length === 0 ? (
          <p className="text-xs text-gray-400">Belge yüklenmedi</p>
        ) : (
          submission.documents!.map((doc) => (
            <p key={doc.id} className="text-xs text-gray-700">✓ {DOC_TYPE_LABELS[doc.doc_type]} — {doc.file_name}</p>
          ))
        )}
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        <span className="text-sm text-gray-700">
          Yukarıdaki bilgilerin doğru ve eksiksiz olduğunu beyan ederim. Bu form gönderiminin dijital imza yerine geçtiğini kabul ediyorum.
        </span>
      </label>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="secondary" onClick={prevStep}>← Geri</Button>
        <Button type="button" isLoading={loading} disabled={!consented} onClick={handleSubmit}>
          Formu Gönder
        </Button>
      </div>
    </div>
  );
}
