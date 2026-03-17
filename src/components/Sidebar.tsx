'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart2, DollarSign, CreditCard, User, Settings, LogOut,
  TrendingUp, Menu, X, UserPlus,
} from 'lucide-react';

export default function Sidebar() {
  const { user, theme, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fecha sidebar mobile ao navegar
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [pathname]);

  // Fecha ao redimensionar para desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!user) return null;

  const profileType = 'PF' in (user.profiles || {}) ? 'PF' : 'PJ';

  const navItems = [
    { label: 'Dashboard', icon: BarChart2, href: '/dashboard' },
    { label: 'Financeiro', icon: DollarSign, href: '/financial' },
    { label: 'Cartões', icon: CreditCard, href: '/services' },
    { label: 'Indicações', icon: UserPlus, href: '/indications' },
    { label: 'Meu Perfil', icon: User, href: '/profile' },
    ...(user.isAdmin ? [{ label: 'Admin', icon: Settings, href: '/admin' }] : []),
  ];

  const sidebarContent = (
    <>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingLeft: '8px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <TrendingUp size={18} color="#000" strokeWidth={2.5} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Empreendii <span className="text-gold">ScoreMaster</span>
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Do 0 ao Crédito</div>
        </div>
      </div>

      {/* Profile card */}
      <div style={{ background: 'var(--gold-bg)', border: '1px solid rgba(238,189,43,0.15)', borderRadius: '14px', padding: '14px', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
          {profileType === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
        </div>
        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.name}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>
          {user.credit_health?.level || 'Iniciante'} • {user.total_points || 0} pts
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(item => {
          const isActive = pathname === item.href;
          return (
            <button key={item.label} onClick={() => router.push(item.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                borderRadius: '12px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                background: isActive ? 'rgba(238,189,43,0.1)' : 'transparent',
                color: isActive ? 'var(--gold)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 400, fontSize: '0.875rem', transition: 'all 0.15s',
              }}>
              <item.icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button onClick={() => router.push('/theme-select')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
          ☀️ {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        </button>
        <button onClick={logout}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.825rem' }}>
          <LogOut size={15} /> Sair
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Botão hamburger mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="sidebar-mobile-toggle"
        aria-label="Abrir menu"
        style={{
          position: 'fixed', top: '12px', left: '12px', zIndex: 60,
          width: '40px', height: '40px', borderRadius: '10px',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          display: 'none', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-main)',
          boxShadow: 'var(--shadow)',
        }}>
        <Menu size={20} />
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 55, backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar-container ${mobileOpen ? 'sidebar-open' : ''}`}
        style={{
          width: '240px', position: 'fixed', top: 0, left: 0, bottom: 0,
          borderRight: '1px solid var(--border)', background: 'var(--bg-sidebar)',
          zIndex: 60, display: 'flex', flexDirection: 'column', padding: '20px 14px',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
        {/* Botão fechar mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="sidebar-close-btn"
          style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', display: 'none',
          }}>
          <X size={20} />
        </button>

        {sidebarContent}
      </aside>

      <style jsx global>{`
        @media (max-width: 768px) {
          .sidebar-mobile-toggle {
            display: flex !important;
          }
          .sidebar-container {
            transform: translateX(-100%);
          }
          .sidebar-container.sidebar-open {
            transform: translateX(0);
          }
          .sidebar-close-btn {
            display: block !important;
          }
          .main-content {
            margin-left: 0 !important;
            max-width: 100% !important;
            padding: 60px 16px 24px !important;
          }
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .admin-charts-grid {
            grid-template-columns: 1fr !important;
          }
          .quick-links-grid {
            grid-template-columns: 1fr !important;
          }
          .header-stats {
            flex-direction: column;
            align-items: flex-start !important;
          }
        }
        @media (max-width: 480px) {
          .kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
