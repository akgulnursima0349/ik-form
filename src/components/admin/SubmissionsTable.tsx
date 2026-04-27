import { useNavigate } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAdminStore } from '../../store/adminStore';

const PAGE_SIZE = 20;

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function SubmissionsTable({ page, setPage }: { page: number; setPage: (p: number) => void }) {
  const navigate = useNavigate();
  const { submissions, filters } = useAdminStore();

  const filtered = submissions.filter((s) => {
    const matchStatus = filters.status === 'all' || s.status === filters.status;
    const q = filters.search.toLowerCase();
    const matchSearch = !q ||
      s.employees?.full_name?.toLowerCase().includes(q) ||
      s.employees?.email?.toLowerCase().includes(q) ||
      (s.personal_info as any)?.department?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!a.submitted_at) return 1;
    if (!b.submitted_at) return -1;
    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Ad Soyad</th>
              <th className="px-4 py-3 text-left">E-posta</th>
              <th className="px-4 py-3 text-left">Departman</th>
              <th className="px-4 py-3 text-left">Durum</th>
              <th className="px-4 py-3 text-left">Gönderim Tarihi</th>
              <th className="px-4 py-3 text-left">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">Başvuru bulunamadı</td></tr>
            ) : paginated.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{s.employees?.full_name || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{s.employees?.email || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{(s.personal_info as any)?.department || '-'}</td>
                <td className="px-4 py-3"><Badge status={s.status} /></td>
                <td className="px-4 py-3 text-gray-600">{formatDate(s.submitted_at)}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/submissions/${s.id}`)}>
                    İncele
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{filtered.length} başvuru</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Önceki</Button>
            <span className="flex items-center px-2 text-sm text-gray-600">{page} / {totalPages}</span>
            <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Sonraki</Button>
          </div>
        </div>
      )}
    </div>
  );
}
