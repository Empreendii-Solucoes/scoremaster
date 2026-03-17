'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ShieldCheck, TrendingUp, Loader2, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const { user, theme } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!user.password_reset_required) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Erro ao redefinir senha.');
        return;
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    }
    setLoading(false);
  };

  if (!user || !user.password_reset_required) {
    return null;
  }

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
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
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
            Nova Senha
          </h1>
          <p style={{ color: 'var(--text-sec)', fontSize: '0.875rem', marginTop: '6px' }}>
            Olá, {user.name}! Defina uma nova senha definitiva.
          </p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          {success ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <CheckCircle size={32} color="#fff" />
              </div>
              <h3 style={{ color: 'var(--text-main)', fontWeight: 600 }}>Senha redefinida!</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem' }}>
                Você será redirecionado para o dashboard em alguns segundos...
              </p>
            </div>
          ) : (
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ 
                background: 'var(--gold)', color: '#000', padding: '12px 16px', 
                borderRadius: '12px', fontSize: '0.85rem', fontWeight: 500 
              }}>
                ⚠️ Você fez login com uma senha provisória. Defina uma nova senha para continuar.
              </div>
              
              <div className="input-group">
                <label className="input-label">Nova Senha</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPass ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres" value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    style={{ paddingRight: '44px' }} required />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  }}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="input-group">
                <label className="input-label">Confirmar Nova Senha</label>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={showPassConfirm ? 'text' : 'password'}
                    placeholder="Repita a senha" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{ paddingRight: '44px' }} required />
                  <button type="button" onClick={() => setShowPassConfirm(!showPassConfirm)} style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  }}>
                    {showPassConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger" style={{ fontSize: '0.85rem' }}>
                  <ShieldCheck size={16} /> {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '8px' }}>
                {loading ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : '💾 Definir Nova Senha'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '24px' }}>
          © 2026 Empreendii Soluções ScoreMaster
        </p>
      </div>
    </div>
  );
}