import type { SubmissionStatus } from '../../types/database';

const statusConfig: Record<SubmissionStatus, { label: string; className: string }> = {
  draft: { label: 'Taslak', className: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Beklemede', className: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Onaylandı', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Reddedildi', className: 'bg-red-100 text-red-700' },
};

export function Badge({ status }: { status: SubmissionStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
