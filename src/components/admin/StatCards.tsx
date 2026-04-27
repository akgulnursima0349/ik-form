import { useAdminStore } from '../../store/adminStore';
import type { SubmissionStatus } from '../../types/database';

interface CardProps {
  label: string;
  count: number;
  colorClass: string;
  onClick: () => void;
}

function Card({ label, count, colorClass, onClick }: CardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl border-2 p-4 text-left transition-shadow hover:shadow-md ${colorClass}`}
    >
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-sm font-medium">{label}</p>
    </button>
  );
}

export function StatCards() {
  const { submissions, setFilter } = useAdminStore();

  const counts = {
    all: submissions.length,
    submitted: submissions.filter((s) => s.status === 'submitted').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Card label="Toplam Başvuru" count={counts.all} colorClass="border-gray-200 text-gray-700" onClick={() => setFilter('status', 'all')} />
      <Card label="Bekleyen İnceleme" count={counts.submitted} colorClass="border-blue-200 bg-blue-50 text-blue-700" onClick={() => setFilter('status', 'submitted' as SubmissionStatus)} />
      <Card label="Onaylanan" count={counts.approved} colorClass="border-green-200 bg-green-50 text-green-700" onClick={() => setFilter('status', 'approved' as SubmissionStatus)} />
      <Card label="Reddedilen" count={counts.rejected} colorClass="border-red-200 bg-red-50 text-red-700" onClick={() => setFilter('status', 'rejected' as SubmissionStatus)} />
    </div>
  );
}
