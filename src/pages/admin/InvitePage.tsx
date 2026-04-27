import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAdminStore } from '../../store/adminStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { inviteSchema } from '../../lib/validations';
import type { InviteData } from '../../lib/validations';
import type { Employee } from '../../types/database';

export function InvitePage() {
  const navigate = useNavigate();
  const { hrUser } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [recentInvites, setRecentInvites] = useState<Employee[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteData>({
    resolver: zodResolver(inviteSchema),
  });

  const fetchRecent = async () => {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setRecentInvites(data);
  };

  useEffect(() => { fetchRecent(); }, []);

  const onSubmit = async (data: InviteData) => {
    if (!hrUser) return;
    setLoading(true);

    const { data: employee, error } = await supabase
      .from('employees')
      .insert({ full_name: data.full_name, email: data.email, phone: data.phone || null, invited_by: hrUser.id })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') toast.error('Bu e-posta adresi zaten kayıtlı');
      else toast.error('Davet oluşturulamadı');
      setLoading(false);
      return;
    }

    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const link = `${window.location.origin}${base}/onboarding/${employee.token}`;
    setGeneratedLink(link);
    toast.success('Davet oluşturuldu!');
    reset();
    fetchRecent();
    setLoading(false);
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast.success('Link kopyalandı!');
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Bugün';
    if (days === 1) return 'Dün';
    return `${days} gün önce`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="text-xl font-bold text-brand-600">HR Platform</div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin')}>← Geri</Button>
          <h1 className="text-xl font-bold text-gray-900">Yeni Çalışan Davet Et</h1>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Ad Soyad" required error={errors.full_name?.message} {...register('full_name')} placeholder="Ahmet Yılmaz" />
            <Input label="E-posta" type="email" required error={errors.email?.message} {...register('email')} placeholder="ahmet@sirket.com" />
            <Input label="Telefon" error={errors.phone?.message} {...register('phone')} placeholder="05551234567" hint="Opsiyonel" />
            <div className="flex justify-end">
              <Button type="submit" isLoading={loading}>Davet Oluştur</Button>
            </div>
          </form>

          {/* Generated Link */}
          {generatedLink && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
              <p className="text-sm font-semibold text-green-700">Oluşturulan Link:</p>
              <p className="break-all text-sm text-gray-700 font-mono">{generatedLink}</p>
              <Button size="sm" onClick={copyLink}>Kopyala</Button>
            </div>
          )}
        </div>

        {/* Recent Invites */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Son Davetler</h3>
          {recentInvites.length === 0 ? (
            <p className="text-sm text-gray-400">Henüz davet oluşturulmamış</p>
          ) : (
            recentInvites.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{emp.full_name}</p>
                  <p className="text-xs text-gray-500">{emp.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{timeAgo(emp.created_at)}</p>
                  <span className={`text-xs font-medium ${emp.token_used ? 'text-green-600' : 'text-blue-600'}`}>
                    {emp.token_used ? 'Tamamlandı' : 'Bekliyor'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
