'use client';

import { Sun, Moon, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ThemeSelectPage() {
  const { setTheme, theme } = useAuth();
  const router = useRouter();

  const select = (t: 'dark' | 'light') => {
    setTheme(t);
    router.push('/dashboard');
  };

  return (
    <div data-theme={theme} style={{
      minHeight: '100vh', backgroundColor: 'var(--bg-app)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '640px', width: '100%' }} className="animate-fade-in">
        {/* Logo */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '56px', height: '56px',
          background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
          borderRadius: '16px', marginBottom: '16px',
          boxShadow: '0 8px 28px rgba(238,189,43,0.3)',
        }}>
          <TrendingUp size={28} color="#000" strokeWidth={2.5} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
          Escolha seu Tema
        </h2>
        <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', marginBottom: '40px' }}>
          Personalize sua experiência visual no ScoreMaster.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Dark */}
          <button onClick={() => select('dark')} style={{
            background: '#111111', border: '2px solid rgba(255,255,255,0.06)',
            borderRadius: '20px', padding: '32px 24px', cursor: 'pointer',
            transition: 'all 0.3s ease', textAlign: 'center',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#EEBD2B')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 16px',
              background: 'rgba(238,189,43,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Moon size={28} color="#EEBD2B" />
            </div>
            <h3 style={{ color: '#FFFFFF', fontWeight: 700, marginBottom: '8px' }}>Modo Escuro</h3>
            <p style={{ color: '#888', fontSize: '0.82rem', lineHeight: 1.5 }}>
              Alto contraste e elegância premium. Ideal para ambientes escuros.
            </p>
          </button>

          {/* Light */}
          <button onClick={() => select('light')} style={{
            background: '#FFFFFF', border: '2px solid rgba(0,0,0,0.06)',
            borderRadius: '20px', padding: '32px 24px', cursor: 'pointer',
            transition: 'all 0.3s ease', textAlign: 'center',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#EEBD2B')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)')}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px', margin: '0 auto 16px',
              background: 'rgba(238,189,43,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sun size={28} color="#D4AF37" />
            </div>
            <h3 style={{ color: '#1A1A1A', fontWeight: 700, marginBottom: '8px' }}>Modo Claro</h3>
            <p style={{ color: '#666', fontSize: '0.82rem', lineHeight: 1.5 }}>
              Visual limpo e moderno. Perfeito para ambientes iluminados.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
