'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/login'); return; }
    if (!user.onboarding_completed) { router.replace('/onboarding'); return; }
    if (!user.credit_health_completed) { router.replace('/health-quiz'); return; }
    const hasTheme = localStorage.getItem('sm_theme');
    if (!hasTheme) { router.replace('/theme-select'); return; }
    router.replace('/dashboard');
  }, [user, loading, router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
      <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }} />
    </div>
  );
}
