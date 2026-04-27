import { useState } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { useAdmin } from '../../hooks/useAdmin';
import { useAdminStore } from '../../store/adminStore';
import { useDocuments } from '../../hooks/useDocuments';

export function ApprovalPanel() {
  const { selectedSubmission } = useAdminStore();
  const { approveSubmission, rejectSubmission, revertToSubmitted, loading } = useAdmin();
  const { getPdfUrl } = useDocuments();
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  if (!selectedSubmission) return null;

  const { status, approval_logs } = selectedSubmission;

  const handleApprove = async () => {
    await approveSubmission(selectedSubmission.id);
    setApproveModal(false);
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) return;
    await rejectSubmission(selectedSubmission.id, rejectNote);
    setRejectModal(false);
    setRejectNote('');
  };

  const handleDownloadPdf = async () => {
    const url = await getPdfUrl(`${selectedSubmission.id}/onboarding_`);
    if (url) window.open(url, '_blank');
  };

  const lastApprovalLog = approval_logs?.find(
    (l) => l.action === 'approved' || l.action === 'rejected'
  );
  const rejectionNote = approval_logs?.find((l) => l.action === 'rejected')?.note;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Onay İşlemleri</h3>

      {status === 'submitted' && (
        <div className="space-y-2">
          <Button className="w-full" onClick={() => setApproveModal(true)} isLoading={loading}>
            ✓ Onayla
          </Button>
          <Button className="w-full" variant="danger" onClick={() => setRejectModal(true)} isLoading={loading}>
            ✗ Reddet
          </Button>
        </div>
      )}

      {status === 'approved' && (
        <div className="space-y-2">
          <Badge status="approved" />
          <p className="text-xs text-gray-500">
            Onaylayan: {lastApprovalLog?.hr_users?.full_name || 'HR'}<br />
            Tarih: {lastApprovalLog ? new Date(lastApprovalLog.created_at).toLocaleDateString('tr-TR') : '-'}
          </p>
          <Button className="w-full" variant="secondary" onClick={handleDownloadPdf}>
            PDF İndir
          </Button>
        </div>
      )}

      {status === 'rejected' && (
        <div className="space-y-2">
          <Badge status="rejected" />
          {rejectionNote && (
            <p className="text-xs italic text-gray-600">"{rejectionNote}"</p>
          )}
          <Button className="w-full" variant="secondary" onClick={() => revertToSubmitted(selectedSubmission.id)} isLoading={loading}>
            Yeniden İncele
          </Button>
        </div>
      )}

      {status === 'draft' && (
        <p className="text-sm text-gray-400">Form henüz gönderilmemiş</p>
      )}

      {/* Onay Geçmişi */}
      {approval_logs && approval_logs.length > 0 && (
        <div className="border-t pt-4 space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase">Onay Geçmişi</h4>
          {approval_logs.map((log) => (
            <div key={log.id} className="text-xs text-gray-600 space-y-0.5">
              <p className="font-medium">
                {new Date(log.created_at).toLocaleDateString('tr-TR')} — {log.hr_users?.full_name || 'HR'} —{' '}
                {log.action === 'approved' ? 'Onaylandı' : log.action === 'rejected' ? 'Reddedildi' : 'Not eklendi'}
              </p>
              {log.note && <p className="italic text-gray-500">"{log.note}"</p>}
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      <Modal isOpen={approveModal} onClose={() => setApproveModal(false)} title="Başvuruyu Onayla">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Bu başvuruyu onaylamak istediğinize emin misiniz? Onay sonrası PDF otomatik oluşturulacaktır.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setApproveModal(false)}>İptal</Button>
            <Button onClick={handleApprove} isLoading={loading}>Onayla</Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="Başvuruyu Reddet">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Red gerekçesini belirtiniz (zorunlu):</p>
          <textarea
            rows={3}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Red gerekçesi..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setRejectModal(false)}>İptal</Button>
            <Button variant="danger" onClick={handleReject} disabled={!rejectNote.trim()} isLoading={loading}>Reddet</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
