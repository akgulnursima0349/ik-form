import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAdminStore } from '../../store/adminStore';
import { DEMO_HR_USER } from '../../lib/demoData';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { loginSchema } from '../../lib/validations';
import type { LoginData } from '../../lib/validations';

export function LoginPage() {
  const navigate = useNavigate();
  const { setHrUser } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    setLoading(true);

    if (data.email === 'demo@demo.com' && data.password === 'demo123') {
      setHrUser(DEMO_HR_USER);
      navigate('/admin');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });

    if (error) {
      toast.error('E-posta veya şifre hatalı');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: hrUser, error: hrError } = await supabase.from('hr_users').select('*').eq('id', user.id).single();
      console.log('hr_users sorgu:', { hrUser, hrError, userId: user.id });
      if (hrUser) {
        setHrUser(hrUser);
        navigate('/admin');
      } else {
        toast.error('Bu hesabın admin yetkisi yok');
        await supabase.auth.signOut();
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm border border-gray-100 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-brand-600">HR Platform</h1>
          <p className="text-sm text-gray-500">Yönetici Girişi</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="E-posta" type="email" required error={errors.email?.message} {...register('email')} placeholder="admin@sirket.com" />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Şifre <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                {...register('password')}
              />
              <button type="button" className="absolute right-3 top-2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" isLoading={loading} size="lg">
            Giriş Yap
          </Button>
        </form>
      </div>
    </div>
  );
}
