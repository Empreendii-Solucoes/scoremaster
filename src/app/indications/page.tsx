'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Send, CheckCircle, Clock, MessageCircle, Loader2 } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function IndicationsPage() {
  const { user, theme } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sended, setSended] = useState(false);
  const [indications, setIndications] = useState<any[]>([]);
  
  const [form, setForm] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    fetchIndications();
  }, [user, router]);

  const fetchIndications = async () => {
    try {
      const res = await fetch('/api/indications');
      if (res.ok) {
        const data = await res.json();
        setIndications(data);
      }
    } catch (e) {
      console.error('Error fetching indications:', e);
    }
  };

  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 3) return `(${numbers.slice(0,2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 7) return `(${numbers.slice(0,2)}) ${numbers.slice(2,3)} ${numbers.slice(3)}`;
    if (numbers.length <= 8) return `(${numbers.slice(0,2)}) ${numbers.slice(2,3)} ${numbers.slice(3)}`;
    return `(${numbers.slice(0,2)}) ${numbers.slice(2,3)} ${numbers.slice(3,7)}-${numbers.slice(7,11)}`;
  };

  const validatePhone = (phone: string): boolean => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length >= 10 && numbers.length <= 11 && numbers.startsWith('0') === false;
  };

  const [phoneError, setPhoneError] = useState('');

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setForm(p => ({ ...p, phone: formatted }));
    if (value && !validatePhone(value)) {
      setPhoneError('Telefone inválido. Use formato (XX) XXXXX-XXXX');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    
    const cleanPhone = form.phone.replace(/\D/g, '');
    if (!validatePhone(form.phone)) {
      setPhoneError('Telefone inválido. Use formato (XX) XXXXX-XXXX');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/indications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indicated_name: form.name,
          indicated_phone: form.phone,
        }),
      });
      
      if (res.ok) {
        setSended(true);
        setForm({ name: '', phone: '' });
        fetchIndications();
        setTimeout(() => setSended(false), 5000);
      }
    } catch (e) {
      console.error('Error:', e);
    }
    setLoading(false);
  };

  if (!user) return null;

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Aguardando', color: 'var(--warning)', icon: Clock },
    contacted: { label: 'Contatado', color: 'var(--gold)', icon: MessageCircle },
    converted: { label: 'Convertido', color: 'var(--success)', icon: CheckCircle },
    rejected: { label: 'Recusado', color: 'var(--danger)', icon: Clock },
  };

  return (
    <div data-theme={theme} style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', display: 'flex' }}>
      <Sidebar />
      <div className="main-content" style={{ marginLeft: '240px', flex: 1, padding: '28px 32px', maxWidth: 'calc(100% - 240px)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <button onClick={() => router.push('/dashboard')} className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></button>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Indicações</h1>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.875rem' }}>Indique amigos e conquiste vantagens</p>
            </div>
          </div>

          {sended && (
            <div className="alert alert-success" style={{ marginBottom: '24px' }}>
              <CheckCircle size={16} /> Indicação enviada com sucesso! Em breve nosso responsável entrará em contato.
            </div>
          )}

          <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus size={20} color="#000" />
              </div>
              <div>
                <h3 style={{ color: 'var(--text-main)', fontWeight: 600, margin: 0 }}>Indicar um Amigo</h3>
                <p style={{ color: 'var(--text-sec)', fontSize: '0.8rem', margin: 0 }}>Compartilhe com alguém que precisa</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Nome do Indicado</label>
                <input className="input" placeholder="Nome completo" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label className="input-label">Telefone do Indicado</label>
                <input className="input" placeholder="(11) 99999-9999" value={form.phone}
                  onChange={e => handlePhoneChange(e.target.value)} required />
                {phoneError && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>{phoneError}</span>}
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ gap: '8px' }}>
                {loading ? <><Loader2 size={18} className="animate-spin" /> Enviando...</> : <><Send size={18} /> Enviar Indicação</>}
              </button>
            </form>
          </div>

          {indications.length > 0 && (
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: '16px' }}>Suas Indicações</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {indications.map(ind => {
                  const status = statusConfig[ind.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <div key={ind.id} style={{ 
                      padding: '16px', background: 'var(--bg-input)', borderRadius: '12px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
                    }}>
                      <div>
                        <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>{ind.indicated_name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{ind.indicated_phone}</div>
                        {ind.admin_notes && (
                          <div style={{ color: 'var(--gold)', fontSize: '0.8rem', marginTop: '8px', padding: '8px', background: 'rgba(238,189,43,0.1)', borderRadius: '8px' }}>
                            📝 {ind.admin_notes}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: status.color, fontSize: '0.8rem', fontWeight: 500 }}>
                        <StatusIcon size={14} /> {status.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}