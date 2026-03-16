'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { CreditCard, BookOpen, ArrowLeft, MessageCircle, Calculator, ChevronDown } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { ServicesData, CreditCard as CCType } from '@/lib/types';

export default function ServicesPage() {
  const { user, theme } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<ServicesData | null>(null);
  const [selectedValue, setSelectedValue] = useState<number>(0);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    fetch('/api/services').then(r => r.json()).then(setServices);
  }, [user, router]);

  if (!user || !services) return (
    <div data-theme={theme} style={{ minHeight:'100vh', background:'var(--bg-app)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="spinner" />
    </div>
  );

  const cards = services.credit_cards.filter(c =>
    c.type === 'standard' || c.allowed_users?.includes(user.username)
  );

  const calcPrice = (card: CCType, val: number): string => {
    if (card.payment_rule.type === 'percent' && card.payment_rule.value) {
      const total = val * card.payment_rule.value;
      const entrada = total * 0.5;
      return `Entrada: R$ ${entrada.toFixed(2)} + R$ ${entrada.toFixed(2)} na entrega`;
    }
    if (card.payment_rule.type === 'fixed' && card.price) {
      return `R$ ${card.price.toFixed(2)} (ou parcelado)`;
    }
    return '—';
  };

  const whatsappLink = (card: CCType) => {
    const msg = `Olá! Sou ${user.name} e gostaria de adquirir: ${card.title}${selectedValue ? ` - Limite: R$ ${selectedValue.toLocaleString('pt-BR')}` : ''}.`;
    const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5500000000000';
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const categoryIcon = { guaranteed: CreditCard, education: BookOpen, standard: CreditCard };
  const categoryLabel = { guaranteed: 'Crédito Garantido', education: 'Mentoria/Educação', standard: 'Padrão' };

  return (
    <div data-theme={theme} style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex' }}>
      <Sidebar />
      <div className="main-content" style={{ marginLeft: '240px', flex: 1, padding: '28px 32px', maxWidth: 'calc(100% - 240px)' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button onClick={() => router.push('/dashboard')} className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
              Cartões & Serviços
            </h1>
            <p style={{ color: 'var(--text-sec)', fontSize: '0.875rem' }}>Ofertas exclusivas para seu perfil de crédito</p>
          </div>
        </div>
              {cards.length === 0 && (!services.whatsapp_services || services.whatsapp_services.length === 0) ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <CreditCard size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>Nenhuma oferta disponível</h3>
            <p style={{ color: 'var(--text-sec)', fontSize: '0.875rem' }}>Complete as fases da jornada para desbloquear ofertas exclusivas.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {/* Credit Cards Section */}
            {cards.length > 0 && (
              <div>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} color="var(--gold)" /> Cartões de Crédito
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {cards.map(card => {
                    const Icon = categoryIcon[card.category] || CreditCard;
                    const isExpanded = false;

                    return (
                      <div key={card.id} className="card" style={{
                        padding: '24px',
                        border: `1px solid ${isExpanded ? 'rgba(238,189,43,0.3)' : 'var(--border)'}`,
                        background: isExpanded ? 'linear-gradient(135deg, var(--bg-card), var(--gold-bg))' : 'var(--bg-card)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                            background: 'var(--gold-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid rgba(238,189,43,0.2)',
                          }}>
                            <Icon size={22} color="var(--gold)" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <span className="badge" style={{ fontSize: '0.65rem', marginBottom: '6px', display: 'inline-block' }}>
                              {categoryLabel[card.category]}
                            </span>
                            <h3 style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>{card.title}</h3>
                          </div>
                        </div>

                        <p style={{ color: 'var(--text-sec)', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '16px' }}>
                          {card.client_description || card.description}
                        </p>

                        {/* Calculadora para crédito garantido */}
                        {card.category === 'guaranteed' && card.allowed_values && (
                          <div style={{ marginBottom: '16px' }}>
                            <div className="input-group">
                              <label className="input-label">
                                <Calculator size={12} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                                Limite Desejado
                              </label>
                              <div style={{ position: 'relative' }}>
                                <select
                                  value={selectedValue || ''}
                                  onChange={e => setSelectedValue(Number(e.target.value))}
                                  style={{
                                    width: '100%', padding: '10px 36px 10px 14px',
                                    background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '10px',
                                    color: 'var(--text-main)', cursor: 'pointer', appearance: 'none', fontSize: '0.9rem',
                                  }}>
                                  <option value="">Selecione o valor</option>
                                  {card.allowed_values.map(v => (
                                    <option key={v} value={v}>
                                      {`R$ ${v.toLocaleString('pt-BR')}`}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                              </div>
                            </div>
                            {selectedValue > 0 && (
                              <div style={{
                                marginTop: '10px', padding: '12px', borderRadius: '10px',
                                background: 'var(--gold-bg)', border: '1px solid rgba(238,189,43,0.15)',
                              }}>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>💰 Condições de pagamento:</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--gold)', fontWeight: 600 }}>
                                  {calcPrice(card, selectedValue)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <a href={whatsappLink(card)} target="_blank" rel="noopener noreferrer"
                          className="btn btn-primary btn-full" style={{ textDecoration: 'none' }}>
                          <MessageCircle size={16} /> Adquirir via WhatsApp
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WhatsApp Community Services Section */}
            {(services.whatsapp_services || []).filter(s => s.visibility === 'all' || s.userIds?.includes(user.username)).length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h2 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageCircle size={18} color="var(--gold)" /> Comunidade Exclusive
                  </h2>
                  <span className="badge" style={{ background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid rgba(238,189,43,0.2)' }}>WhatsApp VIP</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {services.whatsapp_services?.filter(s => s.visibility === 'all' || s.userIds?.includes(user.username)).map(s => (
                    <div key={s.id} className="card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h3 style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem', flex: 1 }}>{s.title}</h3>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '1.1rem' }}>R$ {s.price.toFixed(2)}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Taxa única</div>
                        </div>
                      </div>
                      <p style={{ color: 'var(--text-sec)', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '16px', flex: 1 }}>{s.description}</p>
                      <a href={s.link || `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5500000000000'}?text=${encodeURIComponent(`Olá! Tenho interesse no serviço: ${s.title}`)}`}
                        target="_blank" rel="noopener noreferrer" className="btn btn-sm"
                        style={{ width: '100%', justifyContent: 'center', gap: '8px', background: 'var(--bg-input)', color: 'var(--text-main)', borderColor: 'var(--border)' }}>
                        <MessageCircle size={14} /> Solicitar Agora
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
      </div>
  );
}
