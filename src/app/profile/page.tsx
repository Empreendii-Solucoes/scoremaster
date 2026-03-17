'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, User, MapPin, FileText, CheckCircle, Upload, X } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

const DOCS = [
  { key: 'doc_cnh', label: 'CNH ou RG', required: true },
  { key: 'doc_comprovante', label: 'Comprovante de Residência', required: true },
  { key: 'doc_extrato', label: 'Extrato Bancário (3 meses)', required: true },
  { key: 'doc_irpf', label: 'IRPF (Declaração de IR)', required: false },
  { key: 'doc_selfie', label: 'Selfie com Documento', required: true },
];

export default function ProfilePage() {
  const { user, theme, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'personal' | 'address' | 'docs'>('personal');
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>(() => {
    if (!user) return {};
    const uploaded: Record<string, boolean> = {};
    DOCS.forEach(d => { if (user.uploads?.[d.key]) uploaded[d.key] = true; });
    return uploaded;
  });
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [form, setForm] = useState(() => ({
    name: user?.name || '', 
    phone: user?.phone || '', 
    occupation: user?.occupation || '', 
    mother_name: user?.mother_name || '', 
    email: user?.email || '',
    address_cep: user?.address_cep || '', 
    address_street: user?.address_street || '', 
    address_number: user?.address_number || '',
    address_complement: user?.address_complement || '', 
    address_neighborhood: user?.address_neighborhood || '', 
    address_city: user?.address_city || '', 
    address_state: user?.address_state || '',
  }));

  const [prevUsername, setPrevUsername] = useState(user?.username);

  // Sincroniza apenas se o usuário mudou (ex: login diferente)
  if (user && user.username !== prevUsername) {
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      occupation: user.occupation || '',
      mother_name: user.mother_name || '',
      email: user.email || '',
      address_cep: user.address_cep || '',
      address_street: user.address_street || '',
      address_number: user.address_number || '',
      address_complement: user.address_complement || '',
      address_neighborhood: user.address_neighborhood || '',
      address_city: user.address_city || '',
      address_state: user.address_state || '',
    });
    const uploaded: Record<string, boolean> = {};
    DOCS.forEach(d => { if (user.uploads?.[d.key]) uploaded[d.key] = true; });
    setUploadedDocs(uploaded);
    setPrevUsername(user.username);
  }

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
  }, [user, router]);

  const lookupCep = async () => {
    const cep = form.address_cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();
    if (!data.erro) {
      setForm(p => ({
        ...p,
        address_street: data.logradouro || p.address_street,
        address_neighborhood: data.bairro || p.address_neighborhood,
        address_city: data.localidade || p.address_city,
        address_state: data.uf || p.address_state,
      }));
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateCPF = (cpf: string): boolean => {
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return false;
    if (/^(\d)\1+$/.test(clean)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i);
    let digit1 = (sum * 10) % 11;
    if (digit1 === 10) digit1 = 0;
    if (digit1 !== parseInt(clean[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i);
    digit1 = (sum * 10) % 11;
    if (digit1 === 10) digit1 = 0;
    return digit1 === parseInt(clean[10]);
  };

  const validatePhone = (phone: string): boolean => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length >= 10 && numbers.length <= 11 && numbers.startsWith('0') === false;
  };

  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 3) return `(${numbers.slice(0,2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 7) return `(${numbers.slice(0,2)}) ${numbers.slice(2,3)} ${numbers.slice(3)}`;
    if (numbers.length <= 8) return `(${numbers.slice(0,2)}) ${numbers.slice(2,3)} ${numbers.slice(3)}`;
    return `(${numbers.slice(0,2)}) ${numbers.slice(2,3)} ${numbers.slice(3,7)}-${numbers.slice(7,11)}`;
  };

  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const save = async () => {
    if (!user) return;
    setProfileErrors({});

    if (form.email && !validateEmail(form.email)) {
      setProfileErrors({ email: 'Email inválido. Verifique e tente novamente.' });
      setTab('personal');
      return;
    }

    if (form.phone && !validatePhone(form.phone)) {
      setProfileErrors({ phone: 'Telefone inválido. Use formato (XX) XXXXX-XXXX com DDD válido.' });
      setTab('personal');
      return;
    }

    setLoading(true);
    const updates = {
      ...form,
      progress: {
        ...user.progress,
        task_update_profile: { done: true, timestamp: Date.now() },
      },
    };
    await fetch(`/api/users/${user.username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    await refreshUser();
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const uploadDoc = async (docKey: string, file: File) => {
    if (!user) return;
    setUploadingDoc(docKey);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('username', user.username);
    fd.append('fileType', docKey);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (res.ok) {
      setUploadedDocs(p => ({ ...p, [docKey]: true }));
      await refreshUser();
    }
    setUploadingDoc(null);
  };

  const inp = (label: string, field: keyof typeof form, placeholder = '') => (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <input className="input" placeholder={placeholder} value={form[field]}
        onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
    </div>
  );

  const inpPhone = (label: string, field: keyof typeof form, placeholder = '') => (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <input className="input" placeholder={placeholder} value={form[field]}
        onChange={e => setForm(p => ({ ...p, [field]: formatPhone(e.target.value) }))} />
    </div>
  );

  const tabs = [
    { id: 'personal' as const, label: 'Dados Pessoais', icon: User },
    { id: 'address' as const, label: 'Endereço', icon: MapPin },
    { id: 'docs' as const, label: 'Documentos', icon: FileText },
  ];

  return (
    <div data-theme={theme} style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', display: 'flex' }}>
      <Sidebar />
      <div className="main-content" style={{ marginLeft: '240px', flex: 1, padding: '28px 32px', maxWidth: 'calc(100% - 240px)' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button onClick={() => router.push('/dashboard')} className="btn btn-ghost btn-sm"><ArrowLeft size={16} /></button>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Meu Perfil</h1>
            <p style={{ color: 'var(--text-sec)', fontSize: '0.875rem' }}>Mantenha seus dados atualizados</p>
          </div>
        </div>

        {saved && (
          <div className="alert alert-success" style={{ marginBottom: '20px' }}>
            <CheckCircle size={16} /> Dados salvos com sucesso!
          </div>
        )}

        {Object.keys(profileErrors).length > 0 && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
            {Object.values(profileErrors)[0]}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', background: 'var(--bg-card)', borderRadius: '14px', padding: '6px', border: '1px solid var(--border)' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: tab === t.id ? 'var(--gold)' : 'transparent', color: tab === t.id ? '#000' : 'var(--text-sec)', fontWeight: tab === t.id ? 700 : 400, fontSize: '0.85rem', transition: 'all 0.2s' }}>
              <t.icon size={15} />{t.label}
              {t.id === 'docs' && (
                <span style={{ background: Object.values(uploadedDocs).filter(Boolean).length === DOCS.length ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)', color: Object.values(uploadedDocs).filter(Boolean).length === DOCS.length ? 'var(--success)' : '#000', borderRadius: '999px', padding: '1px 7px', fontSize: '0.65rem', fontWeight: 700 }}>
                  {Object.values(uploadedDocs).filter(Boolean).length}/{DOCS.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: '28px' }}>
          {tab === 'personal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {inp('Nome Completo', 'name', 'Seu nome completo')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {inp('E-mail', 'email', 'email@exemplo.com')}
                {inpPhone('Celular', 'phone', '(11) 9XXXX-XXXX')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {inp('Ocupação / Profissão', 'occupation', 'Ex: Empresário')}
                {inp('Nome da Mãe', 'mother_name', 'Nome completo da mãe')}
              </div>
            </div>
          )}

          {tab === 'address' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
                {inp('CEP', 'address_cep', '00000-000')}
                <button className="btn btn-primary" onClick={lookupCep} style={{ padding: '12px 20px', marginBottom: '0' }}>Buscar</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '14px' }}>
                {inp('Logradouro', 'address_street', 'Rua, Avenida...')}
                {inp('Número', 'address_number', 'N°')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {inp('Complemento', 'address_complement', 'Apto, bloco...')}
                {inp('Bairro', 'address_neighborhood')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '14px' }}>
                {inp('Cidade', 'address_city')}
                {inp('Estado (UF)', 'address_state', 'SP')}
              </div>
            </div>
          )}

          {tab === 'docs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="alert alert-info">
                <FileText size={15} />
                <span>Envie seus documentos diretamente aqui. A equipe Empreendii Soluções ScoreMaster terá acesso para validação.</span>
              </div>

              {DOCS.map(doc => {
                const isUploaded = uploadedDocs[doc.key];
                const isLoading = uploadingDoc === doc.key;
                const userUpload = user?.uploads?.[doc.key];

                return (
                  <div key={doc.key} style={{
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '16px',
                    background: isUploaded ? 'rgba(34,197,94,0.05)' : 'var(--bg-input)',
                    border: `1px solid ${isUploaded ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
                    borderRadius: '14px', transition: 'all 0.2s',
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isUploaded ? 'rgba(34,197,94,0.15)' : 'var(--gold-bg)',
                      border: `1px solid ${isUploaded ? 'rgba(34,197,94,0.2)' : 'rgba(238,189,43,0.2)'}`,
                    }}>
                      {isUploaded ? <CheckCircle size={20} color="var(--success)" /> : <FileText size={20} color="var(--gold)" />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>{doc.label}</span>
                        {doc.required && <span className="badge" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>Obrigatório</span>}
                      </div>
                      {isUploaded && userUpload && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--success)' }}>
                          ✓ {userUpload.originalName} — enviado {new Date(userUpload.uploadedAt).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                      {!isUploaded && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PDF, JPG, PNG — máx. 20MB</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {isUploaded && (
                        <a href={`/api/upload/${user?.username}/${doc.key}`} target="_blank" rel="noopener noreferrer"
                          className="btn btn-sm" style={{ gap: '6px', borderColor: 'var(--gold)', color: 'var(--gold)' }}>
                          <FileText size={13} /> Ver
                        </a>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        style={{ display: 'none' }}
                        ref={el => { inputRefs.current[doc.key] = el; }}
                        onChange={async e => {
                          const f = e.target.files?.[0];
                          if (f) await uploadDoc(doc.key, f);
                          e.target.value = '';
                        }}
                      />
                      <button
                        onClick={() => inputRefs.current[doc.key]?.click()}
                        disabled={isLoading}
                        className="btn btn-sm"
                        style={{ gap: '6px', borderColor: isUploaded ? 'var(--border)' : 'var(--gold)', color: isUploaded ? 'var(--text-muted)' : 'var(--gold)' }}>
                        {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                        {isUploaded ? 'Atualizar' : 'Enviar'}
                      </button>
                    </div>
                  </div>
                );
              })}

              {Object.values(uploadedDocs).filter(Boolean).length === DOCS.filter(d => d.required).length && (
                <div className="alert alert-success">
                  <CheckCircle size={16} /> Todos os documentos obrigatórios foram enviados!
                </div>
              )}
            </div>
          )}

          {tab !== 'docs' && (
            <button className="btn btn-primary btn-full btn-lg" onClick={save} disabled={loading} style={{ marginTop: '20px' }}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> Salvando...</> : <><Save size={18} /> Salvar Dados</>}
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
