import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAdmin } from '../../hooks/useAdmin';
import { useAdminStore } from '../../store/adminStore';
import { StatCards } from '../../components/admin/StatCards';
import { SubmissionsTable } from '../../components/admin/SubmissionsTable';
import { Button } from '../../components/ui/Button';
import { SkeletonTable } from '../../components/ui/Skeleton';

export function DashboardPage() {
  const navigate = useNavigate();
  const { fetchSubmissions, loading } = useAdmin();
  const { hrUser, filters, setFilter } = useAdminStore();
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchSubmissions();

    // Realtime
    const channel = supabase
      .channel('submissions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'onboarding_submissions' }, () => {
        fetchSubmissions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
    toast.success('Çıkış yapıldı');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="text-xl font-bold text-brand-600">HR Platform</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{hrUser?.full_name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>Çıkış</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Başvurular</h1>
          <Button onClick={() => navigate('/admin/invite')}>+ Çalışan Davet Et</Button>
        </div>

        <StatCards />

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Ad, e-posta veya departman ara..."
            value={filters.search}
            onChange={(e) => { setFilter('search', e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
          />
          <select
            value={filters.status}
            onChange={(e) => { setFilter('status', e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="submitted">Beklemede</option>
            <option value="approved">Onaylandı</option>
            <option value="rejected">Reddedildi</option>
            <option value="draft">Taslak</option>
          </select>
        </div>

        {loading ? <SkeletonTable /> : <SubmissionsTable page={page} setPage={setPage} />}
      </main>
    </div>
  );
}
