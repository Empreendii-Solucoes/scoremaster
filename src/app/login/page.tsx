'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ShieldCheck, TrendingUp, Loader2 } from 'lucide-react';

type View = 'login' | 'register' | 'forgot';

export default function LoginPage() {
  const { login, register, theme } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<View>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Login form
  const [loginData, setLoginData] = useState({ username: '', password: '' });

  // Register form
  const [regData, setRegData] = useState({
    username: '', password: '', name: '', email: '', phone: '',
    profile_choice: 'PF', cpf: '', cnpj: '',
  });

  // Forgot
  const [forgotUser, setForgotUser] = useState('');
  const [forgotStep, setForgotStep] = useState<'form' | 'sent'>('form');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(loginData.username, loginData.password);
    setLoading(false);
    if (result.error) { setError(result.error); return; }

    const stored = localStorage.getItem('sm_user');
    if (stored) {
      const user = JSON.parse(stored);
      if (!user.onboarding_completed) { router.push('/onboarding'); return; }
      if (!user.credit_health_completed) { router.push('/health-quiz'); return; }
      const hasTheme = localStorage.getItem('sm_theme');
      if (!hasTheme) { router.push('/theme-select'); return; }
    }
    router.push('/dashboard');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await register({
      ...regData,
      email: regData.email,
      cpf: regData.profile_choice !== 'PJ' ? regData.cpf : undefined,
      cnpj: regData.profile_choice !== 'PF' ? regData.cnpj : undefined,
    });
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    router.push('/onboarding');
  };

  return (
    <div
      data-theme={theme}
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Background gradient orbs */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(238,189,43,0.08) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%',
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(238,189,43,0.05) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }} className="animate-fade-in">
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px',
            background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
            borderRadius: '18px', marginBottom: '16px',
            boxShadow: '0 8px 32px rgba(238,189,43,0.35)',
          }}>
            <TrendingUp size={32} color="#000" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-main)' }}>
            Empreendii Soluções <span className="text-gold">ScoreMaster</span>
          </h1>
          <p style={{ color: 'var(--text-sec)', fontSize: '0.875rem', marginTop: '6px' }}>
            Do 0 ao Crédito
          </p>
        </div>

        {/* Card */}
        <div className="card animate-fade-in" style={{ padding: '32px' }}>
          {/* Tabs */}
          {view !== 'forgot' && (
            <div style={{
              display: 'flex', gap: '4px', marginBottom: '28px',
              background: 'var(--bg-input)', borderRadius: '12px', padding: '4px',
            }}>
              {(['login', 'register'] as const).map(v => (
                <button key={v} onClick={() => { setView(v); setError(''); }}
                  className="btn btn-full"
                  style={{
                    flex: 1, padding: '8px',
                    background: view === v ? 'var(--gold)' : 'transparent',
                    color: view === v ? '#000' : 'var(--text-sec)',
                    fontWeight: view === v ? 700 : 500, border: 'none',
                    borderRadius: '10px', fontSize: '0.85rem', transition: 'all 0.2s',
                  }}>
                  {v === 'login' ? 'Entrar' : 'Criar Conta'}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
              <ShieldCheck size={16} /> {error}
            </div>
          )}

          {/* LOGIN */}
          {view === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Usuário</label>
                <input className="input" placeholder="Seu usuário" value={loginData.username}
                  onChange={e => setLoginData(p => ({ ...p, username: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label className="input-label">Senha</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPass ? 'text' : 'password'}
                    placeholder="••••••••" value={loginData.password}
                    onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                    style={{ paddingRight: '44px' }} required />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  }}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '8px' }}>
                {loading ? <><Loader2 size={18} className="animate-spin" /> Entrando...</> : 'Entrar'}
              </button>
              <button type="button" onClick={() => { setView('forgot'); setError(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', marginTop: '-4px' }}>
                Esqueci minha senha
              </button>
            </form>
          )}

          {/* REGISTER */}
          {view === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Nome Completo</label>
                <input className="input" placeholder="João Silva" value={regData.name}
                  onChange={e => setRegData(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input className="input" type="email" placeholder="joao@email.com" value={regData.email}
                  onChange={e => setRegData(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Usuário</label>
                  <input className="input" placeholder="joaosilva" value={regData.username}
                    onChange={e => setRegData(p => ({ ...p, username: e.target.value }))} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Celular</label>
                  <input className="input" placeholder="11 9XXXX-XXXX" value={regData.phone}
                    onChange={e => setRegData(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Senha</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPass ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres" value={regData.password}
                    onChange={e => setRegData(p => ({ ...p, password: e.target.value }))}
                    style={{ paddingRight: '44px' }} required />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  }}>{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Tipo de Perfil</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ val: 'PF', label: 'Pessoa Física' }, { val: 'PJ', label: 'Pessoa Jurídica' }, { val: 'Ambos', label: 'Ambos' }].map(o => (
                    <button key={o.val} type="button" onClick={() => setRegData(p => ({ ...p, profile_choice: o.val }))}
                      className="btn btn-sm"
                      style={{
                        flex: 1,
                        background: regData.profile_choice === o.val ? 'var(--gold)' : 'transparent',
                        color: regData.profile_choice === o.val ? '#000' : 'var(--text-sec)',
                        fontWeight: regData.profile_choice === o.val ? 700 : 400,
                        border: `1px solid ${regData.profile_choice === o.val ? 'var(--gold)' : 'var(--border)'}`,
                      }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              {regData.profile_choice !== 'PJ' && (
                <div className="input-group">
                  <label className="input-label">CPF</label>
                  <input className="input" placeholder="000.000.000-00" value={regData.cpf}
                    onChange={e => setRegData(p => ({ ...p, cpf: e.target.value }))} required />
                </div>
              )}
              {regData.profile_choice !== 'PF' && (
                <div className="input-group">
                  <label className="input-label">CNPJ</label>
                  <input className="input" placeholder="00.000.000/0000-00" value={regData.cnpj}
                    onChange={e => setRegData(p => ({ ...p, cnpj: e.target.value }))} required />
                </div>
              )}
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '4px' }}>
                {loading ? <><Loader2 size={18} className="animate-spin" /> Criando conta...</> : 'Criar Conta Gratuitamente'}
              </button>
            </form>
          )}

          {/* FORGOT */}
          {view === 'forgot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ color: 'var(--text-main)', fontWeight: 600 }}>Recuperar Senha</h3>
              {forgotStep === 'form' && (
                <>
                  <p style={{ color: 'var(--text-sec)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    Informe seu nome de usuário e enviaremos uma nova senha provisória para o email cadastrado.
                  </p>
                  <div className="input-group">
                    <label className="input-label">Seu Usuário</label>
                    <input className="input" placeholder="Seu usuário" value={forgotUser}
                      onChange={e => setForgotUser(e.target.value)} />
                  </div>
                  {forgotMsg && (
                    <div className="alert alert-danger" style={{ fontSize: '0.8rem' }}>
                      {forgotMsg}
                    </div>
                  )}
                  <button
                    onClick={async () => {
                      if (!forgotUser.trim()) { setForgotMsg('Informe seu usuário.'); return; }
                      setForgotLoading(true);
                      setForgotMsg('');
                      try {
                        const res = await fetch('/api/auth/forgot-password', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ username: forgotUser.trim() }),
                        });
                        const data = await res.json();
                        if (!res.ok) { setForgotMsg(data.error || 'Erro ao processar. Tente novamente.'); }
                        else { setForgotStep('sent'); }
                      } catch { setForgotMsg('Erro de conexão. Tente novamente.'); }
                      setForgotLoading(false);
                    }}
                    disabled={forgotLoading}
                    className="btn btn-primary btn-full btn-lg"
                    style={{ gap: '8px' }}>
                    {forgotLoading ? <><Loader2 size={18} className="animate-spin" /> Enviando...</> : '📧 Enviar Nova Senha por Email'}
                  </button>
                </>
              )}
              {forgotStep === 'sent' && (
                <>
                  <div className="alert alert-success" style={{ fontSize: '0.85rem' }}>
                    ✅ Se o usuário existir e tiver um email cadastrado, uma nova senha provisória foi enviada. Verifique sua caixa de entrada e spam.
                  </div>
                  <button onClick={() => { setView('login'); setForgotStep('form'); setForgotUser(''); setForgotMsg(''); setError(''); }}
                    className="btn btn-primary btn-full btn-lg">
                    Voltar ao Login
                  </button>
                </>
              )}
              {forgotStep === 'form' && (
                <button onClick={() => { setView('login'); setForgotStep('form'); setForgotUser(''); setForgotMsg(''); setError(''); }}
                  className="btn btn-ghost btn-full">← Voltar ao Login</button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '24px' }}>
          © 2026 Empreendii Soluções ScoreMaster — Empreendii Soluções
        </p>
      </div>
    </div>
  );
}
