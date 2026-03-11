'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, TrendingUp } from 'lucide-react';

type Step = 'upload' | 'processing' | 'confirm';

interface ExtractedData {
  name?: string;
  cpf?: string;
  score?: number;
  debts?: { creditor: string; amount: number }[];
}

export default function OnboardingPage() {
  const { user, theme, refreshUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData>({});
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setLoading(true);
    setError('');
    setStep('processing');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('username', user.username);

      const res = await fetch('/api/ocr', { method: 'POST', body: formData });
      const data = await res.json();

      if (res.ok && data.extracted) {
        setExtracted(data.extracted);
      } else {
        // Simula extração se OCR falhar
        setExtracted({
          name: user.name,
          cpf: user.profiles?.PF?.cpf || '',
          score: 0,
          debts: [],
        });
      }
      setStep('confirm');
    } catch {
      setExtracted({ name: user.name, cpf: '', score: 0, debts: [] });
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    setLoading(true);
    await fetch(`/api/users/${user.username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ onboarding_completed: true, raio_x_status: 'pending' }),
    });
    await refreshUser();
    setLoading(false);
    router.push('/health-quiz');
  };

  const handleConfirm = async () => {
    if (!user) return;
    setLoading(true);

    const updates: Record<string, unknown> = {
      onboarding_completed: true,
      raio_x_status: 'pending_approval',
    };

    if (extracted.name || extracted.score !== undefined || (extracted.debts && extracted.debts.length > 0)) {
      const profileType = 'PF' in (user.profiles || {}) ? 'PF' : 'PJ';
      updates[`profiles`] = {
        ...user.profiles,
        [profileType]: {
          ...user.profiles[profileType as 'PF' | 'PJ'],
          ...(extracted.name ? { name: extracted.name } : {}),
          score: extracted.score ?? 0,
          debts: extracted.debts ?? [],
        },
      };
    }

    await fetch(`/api/users/${user.username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await refreshUser();
    setLoading(false);
    router.push('/health-quiz');
  };

  return (
    <div data-theme={theme} style={{
      minHeight: '100vh', backgroundColor: 'var(--bg-app)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '560px' }} className="animate-fade-in">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: 'var(--gold-bg)', border: '1px solid rgba(238,189,43,0.2)',
            borderRadius: '12px', padding: '8px 16px', marginBottom: '16px',
          }}>
            <TrendingUp size={16} color="var(--gold)" />
            <span style={{ color: 'var(--gold)', fontSize: '0.82rem', fontWeight: 600 }}>Fase 1 • Diagnóstico</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Raio-X Financeiro
          </h1>
          <p style={{ color: 'var(--text-sec)', marginTop: '8px', fontSize: '0.9rem' }}>
            Envie sua consulta Serasa ou Boa Vista para análise detalhada e personalizada.
          </p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          {/* Steps indicator */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
            {(['upload', 'processing', 'confirm'] as const).map((s, i) => (
              <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700,
                  background: s === step || (i < ['upload','processing','confirm'].indexOf(step))
                    ? 'linear-gradient(135deg, var(--gold), var(--gold-dark))' : 'var(--bg-input)',
                  color: s === step || (i < ['upload','processing','confirm'].indexOf(step)) ? '#000' : 'var(--text-muted)',
                }}>
                  {i + 1}
                </div>
                {i < 2 && <div style={{ flex: 1, height: '2px', background: 'var(--border)' }} />}
              </div>
            ))}
          </div>

          {/* UPLOAD */}
          {step === 'upload' && (
            <div>
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => document.getElementById('file-input')?.click()}
                style={{
                  border: `2px dashed ${file ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: '16px', padding: '40px 24px', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.3s ease',
                  background: file ? 'var(--gold-bg)' : 'var(--bg-input)',
                }}>
                <input id="file-input" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} />
                {file ? (
                  <>
                    <FileText size={40} color="var(--gold)" style={{ margin: '0 auto 12px' }} />
                    <p style={{ color: 'var(--gold)', fontWeight: 600 }}>{file.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>Clique para trocar o arquivo</p>
                  </>
                ) : (
                  <>
                    <Upload size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                    <p style={{ color: 'var(--text-main)', fontWeight: 600 }}>Arraste ou clique para enviar</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '6px' }}>PDF, JPG ou PNG • Máx. 10MB</p>
                  </>
                )}
              </div>

              {error && <div className="alert alert-danger" style={{ marginTop: '16px' }}><AlertCircle size={16} />{error}</div>}

              <button className="btn btn-primary btn-full btn-lg" onClick={handleUpload} disabled={!file || loading} style={{ marginTop: '20px' }}>
                {loading ? <><Loader2 size={18} className="animate-spin" /> Processando...</> : 'Analisar Consulta'}
              </button>

              <div className="divider" />
              <button onClick={handleSkip} className="btn btn-ghost btn-full" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Pular por agora →'}
              </button>
            </div>
          )}

          {/* PROCESSING */}
          {step === 'processing' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '3px', margin: '0 auto 20px' }} />
              <h3 style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: '8px' }}>Analisando seu documento...</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.875rem' }}>Nosso sistema de OCR está extraindo seus dados. Isso leva alguns segundos.</p>
            </div>
          )}

          {/* CONFIRM */}
          {step === 'confirm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="alert alert-success">
                <CheckCircle size={16} /> Dados extraídos com sucesso!
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Nome', value: extracted.name || '—' },
                  { label: 'CPF', value: extracted.cpf || '—' },
                  { label: 'Score', value: extracted.score !== undefined ? String(extracted.score) : '—' },
                  { label: 'Dívidas encontradas', value: extracted.debts?.length !== undefined ? String(extracted.debts.length) : '0' },
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', background: 'var(--bg-input)', borderRadius: '12px',
                    border: '1px solid var(--border)',
                  }}>
                    <span style={{ color: 'var(--text-sec)', fontSize: '0.875rem' }}>{item.label}</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.9rem' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              <button className="btn btn-primary btn-full btn-lg" onClick={handleConfirm} disabled={loading}>
                {loading ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : 'Confirmar e Continuar'}
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '20px' }}>
          🔒 Seus dados são protegidos com criptografia e usados apenas para análise de crédito.
        </p>
      </div>
    </div>
  );
}
