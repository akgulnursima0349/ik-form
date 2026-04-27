import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAdminStore } from '../store/adminStore';

export function AuthGuard({ children }: { children: ReactNode }) {
  const [checked, setChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const { setHrUser } = useAdminStore();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: hrUser } = await supabase
          .from('hr_users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (hrUser) {
          setHrUser(hrUser);
          setAuthenticated(true);
        }
      }
      setChecked(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setAuthenticated(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!authenticated) return <Navigate to="/admin/login" replace />;

  return <>{children}</>;
}
