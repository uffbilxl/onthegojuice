import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await supabase.auth.signOut();
      try { localStorage.removeItem('otgj_user'); } catch {}
      router.replace('/');
    })();
  }, [router]);

  return null;
}
