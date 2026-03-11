'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
const RechartsBar = dynamic(() => import('recharts').then(m => {
  const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } = m;
  return function ChartWrap({ data, xKey, yKey, color }: { data: Record<string, unknown>[]; xKey: string; yKey: string; color: string }) {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '0.8rem' }} />
          <Bar dataKey={yKey} radius={[6,6,0,0]}>
            {data.map((_: unknown, i: number) => <Cell key={i} fill={color} fillOpacity={0.8 + (i % 3) * 0.07} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };
}), { ssr: false });
import {
  BarChart2, DollarSign, CreditCard, User, Settings, LogOut, TrendingUp,
  Award, Play, CheckSquare, FileText, Zap, Upload, Lock,
  ChevronDown, ChevronUp, CheckCircle, Loader2, X, Brain,
} from 'lucide-react';
import { Stage, Task, UserTask } from '@/lib/types';
import { calculateProgress, getUnlockedStages, getProgressMessage } from '@/lib/scoring';
import { BadgesData } from '@/lib/types';
import TaskReminder from '@/components/TaskReminder';

// Questionário de Saúde Financeira
const QUIZ_QUESTIONS = [
  {
    id: 'has_positive_score',
    question: 'Você sabe qual é seu Score no Serasa/SPC atualmente?',
    options: ['Sim, sei meu score', 'Não sei meu score'],
    field: 'has_positive_score',
    mapToBoolean: (i: number) => i === 0,
  },
  {
    id: 'bank_accounts_range',
    question: 'Quantas contas bancárias ativas você possui?',
    options: ['Nenhuma', '1 conta', '2-3 contas', '4 ou mais contas'],
    field: 'bank_accounts_range',
    mapToString: (i: number) => ['0', '1', '2-3', '4+'][i],
  },
  {
    id: 'has_auto_debit',
    question: 'Você possui contas em débito automático (água, luz, internet)?',
    options: ['Sim', 'Não'],
    field: 'has_auto_debit',
    mapToBoolean: (i: number) => i === 0,
  },
  {
    id: 'has_investments',
    question: 'Você possui algum tipo de investimento ativo?',
    options: ['Sim, invisto regularmente', 'Sim, eventualmente', 'Não invisto'],
    field: 'has_investments',
    mapToBoolean: (i: number) => i <= 1,
  },
  {
    id: 'has_insurance',
    question: 'Você possui algum seguro contratado (auto, vida, residencial)?',
    options: ['Sim', 'Não'],
    field: 'has_insurance',
    mapToBoolean: (i: number) => i === 0,
  },
];

function HealthQuizInline({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean | string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; level: string; level_color: string } | null>(null);

  const handleAnswer = (idx: number) => {
    const q = QUIZ_QUESTIONS[step];
    const val = 'mapToBoolean' in q ? q.mapToBoolean!(idx) : q.mapToString!(idx);
    const newAnswers = { ...answers, [q.field]: val };
    setAnswers(newAnswers);
    if (step < QUIZ_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (ans: Record<string, boolean | string>) => {
    if (!user) return;
    setLoading(true);
    const res = await fetch('/api/health-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, answers: ans }),
    });
    const data = await res.json();
    setResult(data.credit_health || { score: 500, level: 'Iniciante', level_color: '#F59E0B' });
    setLoading(false);
    onComplete();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Loader2 size={28} className="animate-spin" color="var(--gold)" style={{ margin: '0 auto 10px' }} />
        <p style={{ color: 'var(--text-sec)', fontSize: '0.85rem' }}>Calculando seu Score de Saúde...</p>
      </div>
    );
  }

  if (result) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: result.level_color, marginBottom: '8px' }}>{result.score}</div>
        <div style={{ color: 'var(--text-sec)', fontSize: '0.875rem', marginBottom: '4px' }}>Score de Saúde Financeira</div>
        <div style={{ color: result.level_color, fontWeight: 700, fontSize: '1rem', marginBottom: '16px' }}>{result.level}</div>
        <div className="alert alert-success" style={{ marginTop: '0' }}>
          <CheckCircle size={16} /> Questionário concluído! Continue sua jornada.
        </div>
      </div>
    );
  }

  const q = QUIZ_QUESTIONS[step];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pergunta {step + 1} de {QUIZ_QUESTIONS.length}</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {QUIZ_QUESTIONS.map((_, i) => (
            <div key={i} style={{ width: '24px', height: '3px', borderRadius: '2px', background: i <= step ? 'var(--gold)' : 'var(--border)' }} />
          ))}
        </div>
      </div>
      <p style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: '14px', fontSize: '0.9rem', lineHeight: 1.5 }}>{q.question}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(i)}
            className="btn btn-ghost"
            style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '0.85rem', textAlign: 'left', border: '1px solid var(--border)', borderRadius: '12px', gap: '10px', color: 'var(--text-main)', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--gold-bg)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>{i + 1}</span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function UploadTaskCard({ username, taskId, onComplete }: { username: string; taskId: string; onComplete: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.size > 20 * 1024 * 1024) { setError('Arquivo muito grande (máx. 20MB)'); return; }
    setFile(f);
    setError('');
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('username', username);
    fd.append('fileType', taskId === 'task_raio_x_upload' ? 'serasa' : taskId);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (res.ok) {
      // Marca tarefa como concluída
      await fetch('/api/health-quiz', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, taskId, done: true }),
      });
      setUploaded(true);
      onComplete();
    } else {
      setError('Erro ao enviar. Tente novamente.');
    }
    setUploading(false);
  };

  if (uploaded) {
    return (
      <div className="alert alert-success" style={{ margin: '0' }}>
        <CheckCircle size={16} /> Arquivo enviado com sucesso! A equipe será notificada.
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        style={{
          border: `2px dashed ${file ? 'var(--gold)' : 'var(--border)'}`,
          borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer',
          background: file ? 'var(--gold-bg)' : 'var(--bg-input)', marginBottom: '12px',
          transition: 'all 0.2s',
        }}>
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        {file ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
            <FileText size={20} color="var(--gold)" />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>{file.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(0)} KB</div>
            </div>
            <button onClick={e => { e.stopPropagation(); setFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={24} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
            <div style={{ color: 'var(--text-sec)', fontSize: '0.85rem' }}>Clique ou arraste o arquivo aqui</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>PDF, JPG, PNG — máx. 20MB</div>
          </>
        )}
      </div>
      {error && <div className="alert alert-danger" style={{ marginBottom: '12px' }}>{error}</div>}
      <button className="btn btn-primary" onClick={upload} disabled={!file || uploading} style={{ gap: '8px', width: '100%' }}>
        {uploading ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : <><Upload size={16} /> Enviar Consulta</>}
      </button>
    </div>
  );
}

export default function Dashboard() {
  const { user, theme, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [stages, setStages] = useState<Stage[]>([]);
  const [badges, setBadges] = useState<BadgesData | null>(null);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [checkItems, setCheckItems] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [expandedUserTask, setExpandedUserTask] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    const promises: Promise<Response>[] = [fetch('/api/content'), fetch('/api/badges')];
    if (user?.isAdmin) promises.push(fetch('/api/users'));
    
    const [contentRes, badgesRes, usersRes] = await Promise.all(promises);
    if (contentRes?.ok) {
      const c = await contentRes.json();
      setStages(c.stages || []);
    }
    if (badgesRes?.ok) setBadges(await badgesRes.json());
    if (usersRes?.ok) {
      const uData = await usersRes.json();
      setUsers(Array.isArray(uData) ? uData : []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (!user.onboarding_completed) { router.replace('/onboarding'); return; }
    fetchData();
  }, [user, router, fetchData]);

  const markTaskDone = async (taskId: string, extra?: Record<string, unknown>) => {
    if (!user) return;
    const updates = {
      progress: {
        ...user.progress,
        [taskId]: { done: true, timestamp: Date.now(), ...(extra || {}) },
      },
    };
    await fetch(`/api/users/${user.username}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    await refreshUser();
  };

  const markUserTaskDone = async (taskId: string) => {
    if (!user) return;
    const updatedTasks = (user.user_tasks || []).map(t => t.id === taskId ? { ...t, done: true, done_at: new Date().toISOString() } : t);
    await fetch(`/api/users/${user.username}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_tasks: updatedTasks }) });
    await refreshUser();
  };

  if (!user || loading) {
    return (
      <div data-theme={theme} style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }} />
      </div>
    );
  }

  const progress = user.progress || {};
  const userBadges = user.badges || [];
  const profileType = 'PF' in (user.profiles || {}) ? 'PF' : 'PJ';
  const profile = user.profiles?.[profileType];
  const progressPct = stages.length ? calculateProgress(user, stages) : 0;
  const unlockedStages = stages.length ? getUnlockedStages(user, stages) : new Set<string>();
  const progressMessage = badges ? getProgressMessage(badges, progressPct) : '';
  const userTasksList: UserTask[] = user.user_tasks || [];

  // Find first incomplete mandatory task for abandonment reminder
  const firstIncompleteTask = (() => {
    for (const stage of stages) {
      if (!unlockedStages.has(stage.id)) continue;
      for (const task of stage.tasks) {
        if (task.mandatory && !progress[task.id]?.done) return task;
      }
    }
    return null;
  })();

  const navItems = [
    { label: 'Dashboard', icon: BarChart2, href: '/dashboard', active: true },
    { label: 'Financeiro', icon: DollarSign, href: '/financial' },
    { label: 'Cartões', icon: CreditCard, href: '/services' },
    { label: 'Meu Perfil', icon: User, href: '/profile' },
    ...(user.isAdmin ? [{ label: 'Admin', icon: Settings, href: '/admin' }] : []),
  ];

  const renderTask = (task: Task, isDone: boolean, isUnlocked: boolean) => {
    const hasUpload = user.uploads?.[task.id === 'task_raio_x_upload' ? 'serasa' : task.id];
    const isHealthDone = progress['task_health_questionnaire']?.done;

    return (
      <div key={task.id} style={{
        border: `1px solid ${isDone ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
        borderRadius: '14px', padding: '16px',
        background: isDone ? 'rgba(34,197,94,0.04)' : 'var(--bg-input)',
        opacity: isUnlocked ? 1 : 0.5,
        marginBottom: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isDone ? 'rgba(34,197,94,0.15)' : 'var(--gold-bg)',
            border: `1px solid ${isDone ? 'rgba(34,197,94,0.2)' : 'rgba(238,189,43,0.2)'}`,
          }}>
            {isDone ? <CheckCircle size={18} color="var(--success)" /> :
              task.type === 'video' || task.type === 'video_action' ? <Play size={18} color="var(--gold)" /> :
                task.type === 'checklist' ? <CheckSquare size={18} color="var(--gold)" /> :
                  task.type === 'upload' ? <Upload size={18} color="var(--gold)" /> :
                    task.type === 'health_quiz' ? <Brain size={18} color="var(--gold)" /> :
                      <Zap size={18} color="var(--gold)" />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: isDone ? 'var(--success)' : 'var(--text-main)' }}>
                {task.title}
              </span>
              {task.mandatory && <span className="badge" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>Obrigatório</span>}
              {isDone && <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>✓ Concluído</span>}
            </div>
            <p style={{ color: 'var(--text-sec)', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: isUnlocked && !isDone ? '14px' : '0' }}>
              {task.description}
            </p>

            {/* === UPLOAD TASK (Serasa/Boa Vista) === */}
            {task.type === 'upload' && isUnlocked && !isDone && (
              <UploadTaskCard
                username={user.username}
                taskId={task.id}
                onComplete={() => { markTaskDone(task.id); }}
              />
            )}
            {task.type === 'upload' && isDone && hasUpload && (
              <div className="alert alert-success" style={{ margin: '0', marginTop: '4px' }}>
                <FileText size={14} /> Arquivo enviado com sucesso. Aguardando análise da equipe.
              </div>
            )}

            {/* === HEALTH QUIZ === */}
            {task.type === 'health_quiz' && isUnlocked && !isHealthDone && (
              <HealthQuizInline onComplete={() => markTaskDone(task.id)} />
            )}

            {/* === FORM (Dados Cadastrais) → vai para /profile === */}
            {task.type === 'form' && isUnlocked && !isDone && (
              <button className="btn btn-primary" onClick={() => router.push('/profile')} style={{ gap: '8px' }}>
                <User size={16} /> Preencher Perfil
              </button>
            )}

            {/* === VIDEO === */}
            {(task.type === 'video' || task.type === 'video_action') && task.video_url && isUnlocked && !isDone && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <a href={task.video_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ gap: '8px', textDecoration: 'none', display: 'inline-flex' }}>
                  <Play size={16} /> Assistir Vídeo
                </a>
                {task.type === 'video' && (
                  <button onClick={() => markTaskDone(task.id)} className="btn btn-sm" style={{ borderColor: 'var(--success)', color: 'var(--success)', gap: '6px' }}>
                    <CheckCircle size={14} /> Já assisti
                  </button>
                )}
              </div>
            )}
            {task.type === 'video_action' && isUnlocked && task.actions && !isDone && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {task.actions.map((a, i) => (
                  <button key={i} onClick={() => markTaskDone(task.id)} className="btn btn-sm" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>{a}</button>
                ))}
              </div>
            )}

            {/* === CHECKLIST === */}
            {task.type === 'checklist' && task.items && isUnlocked && !isDone && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {task.items.map((item, i) => {
                  const checked = checkItems[task.id]?.[item] || false;
                  return (
                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <div onClick={() => setCheckItems(p => ({ ...p, [task.id]: { ...(p[task.id] || {}), [item]: !checked } }))}
                        style={{ width: '18px', height: '18px', borderRadius: '5px', border: `2px solid ${checked ? 'var(--gold)' : 'var(--border)'}`, background: checked ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s' }}>
                        {checked && <CheckCircle size={11} color="#000" strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: '0.85rem', color: checked ? 'var(--text-main)' : 'var(--text-sec)', textDecoration: checked ? 'line-through' : 'none' }}>{item}</span>
                    </label>
                  );
                })}
                <button onClick={() => markTaskDone(task.id, { checklist_items: checkItems[task.id] || {} })}
                  disabled={!Object.keys(checkItems[task.id] || {}).some(k => checkItems[task.id][k])}
                  className="btn btn-primary btn-sm" style={{ marginTop: '4px', alignSelf: 'flex-start', gap: '6px' }}>
                  <CheckCircle size={14} /> Marcar Concluído
                </button>
              </div>
            )}

            {/* === ACTION === */}
            {task.type === 'action' && isUnlocked && !isDone && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {task.id === 'task_cartao_secured' ? (
                  <button onClick={() => router.push('/services')} className="btn btn-primary" style={{ gap: '8px' }}>
                    <CreditCard size={16} /> Ver Cartões
                  </button>
                ) : task.id === 'task_mentoria' ? (
                  <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5500000000000'}?text=Quero saber sobre a mentoria`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ gap: '8px', textDecoration: 'none' }}>
                    Contatar via WhatsApp
                  </a>
                ) : (
                  <button onClick={() => markTaskDone(task.id)} className="btn btn-sm" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
                    Marcar como feito
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div data-theme={theme} style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex' }}>
      <TaskReminder currentTaskId={firstIncompleteTask?.id} currentTaskTitle={firstIncompleteTask?.title} timeoutMinutes={5} />
      {/* Sidebar */}
      <div style={{ width: '240px', position: 'fixed', top: 0, left: 0, bottom: 0, borderRight: '1px solid var(--border)', background: 'var(--bg-sidebar)', zIndex: 40, display: 'flex', flexDirection: 'column', padding: '20px 14px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingLeft: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={18} color="#000" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>Score<span className="text-gold">Master</span></div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Do 0 ao Crédito</div>
          </div>
        </div>

        {/* Profile card */}
        <div style={{ background: 'var(--gold-bg)', border: '1px solid rgba(238,189,43,0.15)', borderRadius: '14px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{profileType === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>{user.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--gold)' }}>{user.credit_health?.level || 'Iniciante'} • {user.total_points || 0} pts</div>
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Jornada</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 600 }}>{progressPct}%</span>
            </div>
            <div className="progress-bar" style={{ height: '4px' }}>
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(item => (
            <button key={item.label} onClick={() => router.push(item.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                borderRadius: '12px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                background: item.active ? 'rgba(238,189,43,0.1)' : 'transparent',
                color: item.active ? 'var(--gold)' : 'var(--text-muted)',
                fontWeight: item.active ? 600 : 400, fontSize: '0.875rem', transition: 'all 0.15s',
              }}>
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
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
      </div>

      {/* Main Content */}
      <main style={{ marginLeft: '240px', flex: 1, padding: '28px 32px', maxWidth: 'calc(100% - 240px)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
              Olá, {user.name.split(' ')[0]}! 👋
            </h1>
            <p style={{ color: 'var(--text-sec)', fontSize: '0.875rem' }}>{progressMessage || 'Você está começando sua jornada! Continue assim!'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ background: 'var(--gold-bg)', border: '1px solid rgba(238,189,43,0.2)', borderRadius: '12px', padding: '10px 16px', textAlign: 'center', minWidth: '70px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold)' }}>{user.total_points || 0}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pontos</div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 16px', textAlign: 'center', minWidth: '70px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{userBadges.length}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Badges</div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {[
            {
              label: 'Progresso Geral', value: `${progressPct}%`, color: 'var(--gold)',
              extra: <div className="progress-bar" style={{ marginTop: '8px', height: '4px' }}><div className="progress-fill" style={{ width: `${progressPct}%` }} /></div>,
            },
            {
              label: 'Score de Saúde', value: String(user.credit_health?.score || 0), color: user.credit_health?.level_color || 'var(--text-main)',
              extra: <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Nível: {user.credit_health?.level || 'Iniciante'}</div>,
            },
            {
              label: 'Score Serasa', value: String(profile?.score || '—'), color: 'var(--text-main)',
              extra: <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>→ {profile?.scoreTrend === 'up' ? 'Subindo' : 'Estável'}</div>,
            },
            {
              label: 'Tarefas Concluídas', value: String(Object.values(progress).filter(p => p.done).length), color: 'var(--text-main)',
              extra: <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>de {stages.flatMap(s => s.tasks).length} no total</div>,
            },
          ].map(k => (
            <div key={k.label} className="kpi-card">
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value" style={{ color: k.color, fontSize: '1.6rem' }}>{k.value}</div>
              {k.extra}
            </div>
          ))}
        </div>

        {/* Tarefas personalizadas da equipe */}
        {userTasksList.length > 0 && (
          <div className="card" style={{ marginBottom: '24px', borderColor: 'rgba(238,189,43,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Award size={18} color="var(--gold)" />
              <h3 style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem' }}>Tarefas da Equipe Empreendii Master Score</h3>
              <span className="badge" style={{ fontSize: '0.62rem' }}>{userTasksList.filter(t => !t.done).length} pendente(s)</span>
            </div>
            {userTasksList.map(task => {
              const isExp = expandedUserTask === task.id;
              return (
                <div key={task.id} style={{
                  border: `1px solid ${task.done ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
                  borderRadius: '12px', marginBottom: '8px', overflow: 'hidden',
                  background: task.done ? 'rgba(34,197,94,0.04)' : 'var(--bg-input)',
                }}>
                  <button onClick={() => setExpandedUserTask(isExp ? null : task.id)}
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                    {task.done ? <CheckCircle size={18} color="var(--success)" /> :
                      task.type === 'link' ? <FileText size={18} color="var(--gold)" /> : <Zap size={18} color="var(--gold)" />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: task.done ? 'var(--success)' : 'var(--text-main)' }}>{task.title}</div>
                    </div>
                    {task.done && <span style={{ fontSize: '0.72rem', color: 'var(--success)' }}>✓</span>}
                    {!task.done && (isExp ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />)}
                  </button>
                  {isExp && !task.done && (
                    <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      {task.description && <p style={{ color: 'var(--text-sec)', fontSize: '0.82rem', marginBottom: '12px' }}>{task.description}</p>}
                      {task.type === 'checklist' && task.items && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                          {task.items.map((item, i) => <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text-sec)' }}>• {item}</div>)}
                        </div>
                      )}
                      {task.type === 'link' && task.link_url && (
                        <a href={task.link_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ gap: '6px', textDecoration: 'none', marginBottom: '10px', display: 'inline-flex' }}>
                          {task.link_label || 'Acessar'}
                        </a>
                      )}
                      <button onClick={() => markUserTaskDone(task.id)} className="btn btn-sm" style={{ borderColor: 'var(--gold)', color: 'var(--gold)', gap: '6px' }}>
                        <CheckCircle size={14} /> Marcar Concluído
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Badges */}
        {userBadges.length > 0 && badges && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Award size={18} color="var(--gold)" />
              <h3 style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem' }}>Conquistas</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {badges.badges.filter(b => userBadges.includes(b.id)).map(badge => (
                <div key={badge.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '12px', background: `${badge.color}18`, border: `1px solid ${badge.color}33` }}>
                  <span>{badge.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: badge.color }}>{badge.name}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>+{badge.points} pts</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fases / Dashboard Admin */}
        {user.isAdmin ? (
          <div>
            <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--gold)" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Visão Geral (Admin)</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', marginBottom: '28px' }}>
              <div className="card">
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px' }}>Progresso por Usuário (%)</div>
                <RechartsBar
                  data={users.map(u => ({ name: u.name?.split(' ')[0] || u.username, progresso: Math.round(stages.flatMap(s => s.tasks).filter(t => t.mandatory).length ? (stages.flatMap(s => s.tasks).filter(t => t.mandatory && u.progress?.[t.id]?.done).length / stages.flatMap(s => s.tasks).filter(t => t.mandatory).length) * 100 : 0) }))}
                  xKey="name" yKey="progresso" color="#EEBD2B"
                />
              </div>
              <div className="card">
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '16px' }}>Tarefas Concluídas por Fase</div>
                <RechartsBar
                  data={stages.map(s => ({ name: `Fase ${s.order}`, concluidas: users.reduce((sum, u) => sum + s.tasks.filter(t => u.progress?.[t.id]?.done).length, 0) }))}
                  xKey="name" yKey="concluidas" color="#22C55E"
                />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--gold)" />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Sua Jornada</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
          {stages.map(stage => {
            const isUnlocked = unlockedStages.has(stage.id);
            const mandatoryTasks = stage.tasks.filter(t => t.mandatory);
            const doneMandatory = mandatoryTasks.filter(t => progress[t.id]?.done).length;
            const isExpanded = activeStage === stage.id;

            return (
              <div key={stage.id} className="card" style={{ padding: 0, overflow: 'hidden', border: `1px solid ${isUnlocked ? 'rgba(238,189,43,0.12)' : 'var(--border)'}` }}>
                <button onClick={() => isUnlocked && setActiveStage(isExpanded ? null : stage.id)}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: isUnlocked ? 'pointer' : 'default', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', background: isUnlocked ? 'var(--gold-bg)' : 'var(--bg-input)', border: `1px solid ${isUnlocked ? 'rgba(238,189,43,0.2)' : 'var(--border)'}` }}>
                    {isUnlocked ? stage.icon : <Lock size={18} color="var(--text-muted)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: isUnlocked ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Fase {stage.order}: {stage.title}
                      {stage.is_paid && <span className="badge" style={{ fontSize: '0.6rem' }}>Premium</span>}
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{stage.description}</p>
                    {isUnlocked && mandatoryTasks.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <div className="progress-bar" style={{ flex: 1, height: '3px' }}>
                          <div className="progress-fill" style={{ width: `${(doneMandatory / mandatoryTasks.length) * 100}%` }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600 }}>{doneMandatory}/{mandatoryTasks.length}</span>
                      </div>
                    )}
                  </div>
                  {isUnlocked && (isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />)}
                </button>

                {isExpanded && isUnlocked && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px 20px' }}>
                    {stage.tasks.map(task => {
                      const isDone = progress[task.id]?.done || false;
                      return renderTask(task, isDone, isUnlocked);
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )}

        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {[
            { icon: DollarSign, label: 'Central Financeira', sub: 'Veja faturas e pagamentos', href: '/financial', color: '#10B981' },
            { icon: CreditCard, label: 'Cartões & Serviços', sub: 'Explore ofertas exclusivas', href: '/services', color: 'var(--gold)' },
            { icon: User, label: 'Meu Perfil', sub: 'Gerencie seus dados', href: '/profile', color: 'var(--info)' },
          ].map(item => (
            <button key={item.label} onClick={() => router.push(item.href)}
              className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '10px', cursor: 'pointer', border: 'none', textAlign: 'center', transition: 'all 0.2s' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: `${item.color}18`, border: `1px solid ${item.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <item.icon size={22} color={item.color} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.875rem' }}>{item.label}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>{item.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
