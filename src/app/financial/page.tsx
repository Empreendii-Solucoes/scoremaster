'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, Clock, CheckCircle, ExternalLink, ArrowLeft, XCircle } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { FinancialItem } from '@/lib/types';

export default function FinancialPage() {
  const { user, theme, refreshUser } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<(FinancialItem & { username?: string; userName?: string })[]>(() => {
    if (user && !user.isAdmin) return user.financial_items || [];
    return [];
  });

  const lastUserRef = useRef(user?.username);

  const fetchAllUsersFinancials = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const users = await res.json();
        const allItems = users.flatMap((u: { financial_items?: import("@/lib/types").FinancialItem[]; username: string; name: string }) => 
          (u.financial_items || []).map((i: import("@/lib/types").FinancialItem) => ({ ...i, username: u.username, userName: u.name }))
        );
        setItems(allItems);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    refreshUser();
  }, [router, refreshUser, user]);

  useEffect(() => {
    if (user) {
      if (user.isAdmin) {
        fetchAllUsersFinancials();
      } else if (user.username !== lastUserRef.current) {
        setItems(user.financial_items || []);
        lastUserRef.current = user.username;
      }
    }
  }, [user, fetchAllUsersFinancials]);

  const totalPaid = items.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalPending = items.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0);
  const nextDue = items.filter(i => i.status === 'pending').sort((a, b) => a.due_date.localeCompare(b.due_date))[0];

  const markPaid = async (itemId: string, itemUsername?: string) => {
    if (!user) return;
    
    if (user.isAdmin && itemUsername) {
      // Find the user first to get their current items
      const res = await fetch(`/api/users/${itemUsername}`);
      if (!res.ok) return;
      const targetUser = await res.json();
      const updated = (targetUser.financial_items || []).map((i: import("@/lib/types").FinancialItem) => i.id === itemId ? { ...i, status: 'paid', paid_at: new Date().toISOString() } : i);
      
      await fetch(`/api/users/${itemUsername}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financial_items: updated }),
      });
      await fetchAllUsersFinancials();
    } else {
      const updated = items.map(i => i.id === itemId ? { ...i, status: 'paid' as const, paid_at: new Date().toISOString() } : i);
      setItems(updated as (import("@/lib/types").FinancialItem & { username?: string; userName?: string })[]);
      await fetch(`/api/users/${user.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financial_items: updated }),
      });
      await refreshUser();
    }
  };

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  const statusColor = { paid: 'var(--success)', pending: 'var(--warning)', overdue: 'var(--danger)' };
  const statusLabel = { paid: 'Pago', pending: 'Pendente', overdue: 'Vencido' };
  const StatusIcon = { paid: CheckCircle, pending: Clock, overdue: XCircle };

  if (!user) return null;

  return (
    <div data-theme={theme} style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', display: 'flex' }}>
      <Sidebar />
      <div className="main-content" style={{ marginLeft: '240px', flex: 1, padding: '28px 32px', maxWidth: 'calc(100% - 240px)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button onClick={() => router.push('/dashboard')} className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              Central Financeira
            </h1>
            <p style={{ color: 'var(--text-sec)', fontSize: '0.875rem' }}>Gerencie seus pagamentos e faturas</p>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Pago', value: fmt(totalPaid), icon: CheckCircle, color: 'var(--success)' },
            { label: 'Em Aberto', value: fmt(totalPending), icon: Clock, color: 'var(--warning)' },
            { label: 'Próx. Vencimento', value: nextDue ? nextDue.due_date : 'Nenhum', icon: DollarSign, color: 'var(--gold)' },
          ].map(k => (
            <div key={k.label} className="kpi-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <k.icon size={16} color={k.color} />
                <span className="kpi-label">{k.label}</span>
              </div>
              <div className="kpi-value" style={{ fontSize: '1.3rem', color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <TrendingUp size={18} color="var(--gold)" />
            <h3 style={{ color: 'var(--text-main)', fontWeight: 700 }}>Extrato de Lançamentos</h3>
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <DollarSign size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>Nenhum lançamento encontrado.</p>
              <p style={{ fontSize: '0.82rem', marginTop: '8px' }}>Sua equipe adicionará cobranças em breve.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map(item => {
                const St = StatusIcon[item.status] || Clock;
                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
                    background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border)',
                  }}>
                    <St size={18} color={statusColor[item.status]} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        {item.description}
                        {user.isAdmin && item.userName && (
                          <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--info)', fontWeight: 500 }}>
                            {item.userName}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Vencimento: {item.due_date}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: statusColor[item.status], fontSize: '0.95rem' }}>{fmt(item.amount)}</div>
                      <div style={{ fontSize: '0.72rem' }}>
                        <span className="badge" style={{
                          background: `${statusColor[item.status]}18`, color: statusColor[item.status],
                          borderColor: `${statusColor[item.status]}33`, padding: '2px 8px',
                        }}>
                          {statusLabel[item.status]}
                        </span>
                      </div>
                    </div>
                    {item.status !== 'paid' && item.payment_link && !user.isAdmin && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                          <a href={item.payment_link} target="_blank" rel="noopener noreferrer"
                            className="btn btn-sm btn-primary" style={{ padding: '6px 12px' }}>
                            <ExternalLink size={14} /> Pagar
                          </a>
                      </div>
                    )}
                    {item.status !== 'paid' && user.isAdmin && (
                      <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
                        <button className="btn btn-sm" onClick={() => markPaid(item.id, item.username)} style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'var(--success)', color: 'var(--success)', gap: '6px' }}>
                          <CheckCircle size={12} /> Marcar Pago
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
