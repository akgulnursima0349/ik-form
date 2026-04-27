import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import { useAdminStore } from '../../store/adminStore';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DocumentList } from '../../components/admin/DocumentList';
import { ApprovalPanel } from '../../components/admin/ApprovalPanel';
import { Skeleton } from '../../components/ui/Skeleton';

type Tab = 'personal' | 'bank' | 'documents' | 'history';

function InfoRow({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div className="grid grid-cols-2 gap-2 py-2 border-b border-gray-50">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || '-'}</span>
    </div>
  );
}

const EDUCATION_LABELS: Record<string, string> = {
  ilkokul: 'İlkokul', ortaokul: 'Ortaokul', lise: 'Lise', onlisans: 'Ön Lisans',
  lisans: 'Lisans', yukseklisans: 'Yüksek Lisans', doktora: 'Doktora',
};

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchSubmissionDetail, loading } = useAdmin();
  const { selectedSubmission } = useAdminStore();
  const [activeTab, setActiveTab] = useState<Tab>('personal');

  useEffect(() => {
    if (id) fetchSubmissionDetail(id);
  }, [id]);

  if (loading && !selectedSubmission) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!selectedSubmission) return <div className="p-8 text-gray-500">Başvuru bulunamadı</div>;

  const p = selectedSubmission.personal_info;
  const c = selectedSubmission.contact_info;
  const e = selectedSubmission.emergency_contact;
  const b = selectedSubmission.bank_info;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'personal', label: 'Kişisel' },
    { id: 'bank', label: 'Banka' },
    { id: 'documents', label: 'Belgeler' },
    { id: 'history', label: 'Geçmiş' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="text-xl font-bold text-brand-600">HR Platform</div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin')}>← Geri</Button>
          <h1 className="text-xl font-bold text-gray-900">{selectedSubmission.employees?.full_name}</h1>
          <Badge status={selectedSubmission.status} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Sol: Detaylar */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id ? 'border-b-2 border-brand-600 text-brand-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'personal' && (
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Kişisel Bilgiler</h3>
                    <InfoRow label="Ad Soyad" value={selectedSubmission.employees?.full_name} />
                    <InfoRow label="E-posta" value={selectedSubmission.employees?.email} />
                    <InfoRow label="TC Kimlik No" value={p?.tc_no ? '•••••••' + p.tc_no.slice(-4) : '-'} />
                    <InfoRow label="Doğum Tarihi" value={p?.birth_date} />
                    <InfoRow label="Doğum Yeri" value={p?.birth_place} />
                    <InfoRow label="Cinsiyet" value={p?.gender === 'male' ? 'Erkek' : p?.gender === 'female' ? 'Kadın' : 'Belirtmek İstemiyor'} />
                    <InfoRow label="Medeni Durum" value={p?.marital_status === 'single' ? 'Bekar' : p?.marital_status === 'married' ? 'Evli' : p?.marital_status === 'divorced' ? 'Boşanmış' : 'Dul'} />
                    <InfoRow label="Eğitim Durumu" value={p?.education_level ? EDUCATION_LABELS[p.education_level] : '-'} />
                    <InfoRow label="Departman" value={p?.department} />
                    <InfoRow label="Görev Unvanı" value={p?.job_title} />
                    <InfoRow label="İşe Başlama" value={p?.start_date} />

                    <h3 className="text-sm font-semibold text-gray-700 mb-3 pt-4">İletişim & Adres</h3>
                    <InfoRow label="Telefon" value={c?.phone} />
                    <InfoRow label="Adres" value={c?.address} />
                    <InfoRow label="İl / İlçe" value={c ? `${c.city} / ${c.district}` : '-'} />
                    <InfoRow label="Posta Kodu" value={c?.postal_code} />

                    <h3 className="text-sm font-semibold text-gray-700 mb-3 pt-4">Acil İletişim</h3>
                    <InfoRow label="Kişi Adı" value={e?.name} />
                    <InfoRow label="Yakınlık" value={e?.relationship} />
                    <InfoRow label="Telefon" value={e?.phone} />
                  </div>
                )}

                {activeTab === 'bank' && (
                  <div className="space-y-1">
                    <InfoRow label="Banka Adı" value={b?.bank_name} />
                    <InfoRow label="IBAN" value={b?.iban ? `${b.iban.slice(0, 4)} •••• •••• •••• •••• ${b.iban.slice(-2)}` : '-'} />
                    <InfoRow label="Hesap Sahibi" value={b?.account_holder} />
                  </div>
                )}

                {activeTab === 'documents' && (
                  <DocumentList documents={selectedSubmission.documents || []} />
                )}

                {activeTab === 'history' && (
                  <div className="space-y-3">
                    {(selectedSubmission.approval_logs || []).length === 0 ? (
                      <p className="text-sm text-gray-400">Henüz işlem yapılmamış</p>
                    ) : (
                      [...(selectedSubmission.approval_logs || [])].reverse().map((log) => (
                        <div key={log.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                          <div className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${log.action === 'approved' ? 'bg-green-500' : log.action === 'rejected' ? 'bg-red-500' : 'bg-blue-500'}`} />
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {log.hr_users?.full_name || 'HR'} — {log.action === 'approved' ? 'Onayladı' : log.action === 'rejected' ? 'Reddetti' : 'Not ekledi'}
                            </p>
                            <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString('tr-TR')}</p>
                            {log.note && <p className="mt-1 text-xs italic text-gray-600">"{log.note}"</p>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sağ: Onay Paneli */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 h-fit">
            <ApprovalPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
