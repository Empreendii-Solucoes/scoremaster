'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, TrendingUp, BarChart2, User, DollarSign, CreditCard,
  CheckCircle, Lock, Clock, Play, Zap, ChevronDown, ChevronUp,
  Award, Eye, FileText, MessageCircle, Trash2, RotateCcw, XCircle,
} from 'lucide-react';
import { User as UserType, Stage, BadgesData, ProfileType } from '@/lib/types';
import { calculateProgress, getUnlockedStages, getProgressMessage } from '@/lib/scoring';

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'var(--warning)' },
    pending_approval: { label: 'Aguardando', color: 'var(--info)' },
    approved: { label: 'Aprovado', color: 'var(--success)' },
    rejected: { label: 'Rejeitado', color: 'var(--danger)' },
  };
  const s = map[status] || { label: status, color: 'var(--text-muted)' };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600,
      background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}33`,
    }}>{s.label}</span>
  );
};

export default function AdminClientView() {
  const { user: adminUser, theme } = useAuth();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  const [client, setClient] = useState<UserType | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [badges, setBadges] = useState<BadgesData | null>(null);
  const [profileType, setProfileType] = useState<ProfileType>('PF');
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const [clientRes, contentRes, badgesRes] = await Promise.all([
      fetch(`/api/users/${username}`),
      fetch('/api/content'),
      fetch('/api/badges'),
    ]);
    if (clientRes.ok) {
      const data = await clientRes.json();
      setClient(data);
      const pt: ProfileType = 'PF' in (data.profiles || {}) ? 'PF' : 'PJ';
      setProfileType(pt);
    }
    if (contentRes.ok) {
      const c = await contentRes.json();
      setStages(c.stages || []);
    }
    if (badgesRes.ok) setBadges(await badgesRes.json());
    setLoading(false);
  }, [username]);

  const saveClient = async (updates: Record<string, unknown>) => {
    setSaving(true);
    await fetch(`/api/users/${username}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    await fetchData();
    setSaving(false);
  };

  const toggleTaskDone = async (taskId: string) => {
    if (!client) return;
    const currentProgress = client.progress || {};
    const isDone = currentProgress[taskId]?.done;
    const updatedProgress = { ...currentProgress };
    if (isDone) {
      delete updatedProgress[taskId];
    } else {
      updatedProgress[taskId] = { done: true, timestamp: Date.now() };
    }
    await saveClient({ progress: updatedProgress });
  };

  const toggleUserTaskDone = async (taskId: string) => {
    if (!client) return;
    const updatedTasks = (client.user_tasks || []).map(t =>
      t.id === taskId ? { ...t, done: !t.done, done_at: !t.done ? new Date().toISOString() : undefined } : t
    );
    await saveClient({ user_tasks: updatedTasks });
  };

  const deleteUserTask = async (taskId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa personalizada?')) return;
    if (!client) return;
    const updatedTasks = (client.user_tasks || []).filter(t => t.id !== taskId);
    await saveClient({ user_tasks: updatedTasks });
  };

  const markFinancialItemPaid = async (itemId: string) => {
    if (!client) return;
    const updated = (client.financial_items || []).map(i =>
      i.id === itemId ? { ...i, status: 'paid' as const, paid_at: new Date().toISOString() } : i
    );
    await saveClient({ financial_items: updated });
  };

  const deleteFinancialItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lançamento financeiro?')) return;
    if (!client) return;
    const updatedItems = (client.financial_items || []).filter(i => i.id !== itemId);
    await saveClient({ financial_items: updatedItems });
  };

  useEffect(() => {
    if (!adminUser?.isAdmin) { router.replace('/login'); return; }
    fetchData();
  }, [adminUser, router, fetchData]);

  if (loading || !client) {
    return (
      <div data-theme={theme} style={{ minHeight: '100vh', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px' }} />
      </div>
    );
  }

  const profile = client.profiles?.[profileType];
  const progress = client.progress || {};
  const userBadges = client.badges || [];
  const progressPct = stages.length ? calculateProgress(client, stages) : 0;
  const unlockedStages = stages.length ? getUnlockedStages(client, stages) : new Set<string>();
  const progressMessage = badges ? getProgressMessage(badges, progressPct) : '';
  const uploads = client.uploads || {};

  return (
    <div data-theme={theme} style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      {/* Admin Header Banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(238,189,43,0.15), rgba(238,189,43,0.05))',
        borderBottom: '1px solid rgba(238,189,43,0.2)',
        padding: '10px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Eye size={16} color="var(--gold)" />
          <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.85rem' }}>
            Modo Admin: Visualizando como <strong>{client.name}</strong>
          </span>
          <StatusBadge status={client.raio_x_status} />
        </div>
        <button onClick={() => router.push('/admin')} className="btn btn-sm" style={{ borderColor: 'rgba(238,189,43,0.3)', color: 'var(--gold)', gap: '6px' }}>
          <ArrowLeft size={14} /> Voltar ao Admin
        </button>
      </div>

      {/* Sidebar */}
      <div style={{ width: '260px', position: 'fixed', top: '44px', left: 0, bottom: 0, borderRight: '1px solid var(--border)', background: 'var(--bg-sidebar)', zIndex: 40, overflowY: 'auto', padding: '20px 16px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingLeft: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={18} color="#000" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>Empreendii Soluções <span className="text-gold">ScoreMaster</span></div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Visão do Cliente</div>
          </div>
        </div>

        {/* Client card */}
        <div style={{ background: 'var(--gold-bg)', border: '1px solid rgba(238,189,43,0.15)', borderRadius: '14px', padding: '14px', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Perfil visualizado</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{client.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--gold)', marginTop: '4px' }}>
            {client.credit_health?.level || 'Iniciante'} • {client.total_points || 0} pts
          </div>

          {/* Profile toggle */}
          {client.profiles?.PF && client.profiles?.PJ && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
              {(['PF', 'PJ'] as ProfileType[]).map(pt => (
                <button key={pt} onClick={() => setProfileType(pt)}
                  className="btn btn-sm"
                  style={{ flex: 1, padding: '5px', fontSize: '0.72rem', background: profileType === pt ? 'var(--gold)' : 'transparent', color: profileType === pt ? '#000' : 'var(--text-muted)', border: `1px solid ${profileType === pt ? 'var(--gold)' : 'var(--border)'}` }}>
                  {pt}
                </button>
              ))}
            </div>
          )}

          {/* Progress */}
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Jornada</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--gold)', fontWeight: 600 }}>{progressPct}%</span>
            </div>
            <div className="progress-bar" style={{ height: '4px' }}>
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        {/* Uploads section */}
        {Object.keys(uploads).length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Arquivos Enviados</div>
            {Object.entries(uploads).map(([key, up]) => (
              <a key={key} href={`/api/upload/${client.username}/${key}`} target="_blank" rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '8px 12px', gap: '8px', marginBottom: '6px', color: 'var(--text-sec)', fontSize: '0.8rem' }}>
                <FileText size={14} color="var(--gold)" />
                {key === 'serasa' ? 'Consulta Serasa/Boa Vista' : up.originalName}
              </a>
            ))}
          </div>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { icon: BarChart2, label: 'Dashboard' },
            { icon: DollarSign, label: 'Financeiro' },
            { icon: CreditCard, label: 'Cartões' },
            { icon: User, label: 'Perfil' },
          ].map(item => (
            <div key={item.label} className="btn btn-ghost"
              style={{ justifyContent: 'flex-start', padding: '10px 14px', gap: '10px', color: 'var(--text-muted)', cursor: 'default', fontSize: '0.875rem' }}>
              <item.icon size={16} />
              {item.label}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main style={{ marginLeft: '260px', padding: '28px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px', marginBottom: '4px' }}>
              Olá, {client.name.split(' ')[0]}! 👋
            </h1>
            <p style={{ color: 'var(--text-sec)', fontSize: '0.875rem' }}>
              {progressMessage || 'Sua jornada financeira está em progresso.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ background: 'var(--gold-bg)', border: '1px solid rgba(238,189,43,0.2)', borderRadius: '12px', padding: '10px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold)' }}>{client.total_points || 0}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>PONTOS</div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{userBadges.length}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>BADGES</div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
          {[
            { label: 'Progresso Geral', value: `${progressPct}%`, color: 'var(--gold)', extra: <div className="progress-bar" style={{ marginTop: '8px', height: '4px' }}><div className="progress-fill" style={{ width: `${progressPct}%` }} /></div> },
            { label: 'Score de Saúde', value: String(client.credit_health?.score || 0), color: client.credit_health?.level_color || 'var(--text-main)', extra: <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Nível: {client.credit_health?.level || 'Iniciante'}</div> },
            { label: 'Score Serasa', value: String(profile?.score || '—'), color: 'var(--text-main)', extra: <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{profile?.scoreTrend === 'up' ? '↑ Subindo' : '→ Estável'}</div> },
            { label: 'Tarefas Concluídas', value: String(Object.values(progress).filter(p => p.done).length), color: 'var(--text-main)', extra: <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>de {stages.flatMap(s => s.tasks).length}</div> },
          ].map(k => (
            <div key={k.label} className="kpi-card">
              <div className="kpi-label">{k.label}</div>
              <div className="kpi-value" style={{ color: k.color, fontSize: '1.5rem' }}>{k.value}</div>
              {k.extra}
            </div>
          ))}
        </div>

        {/* User tasks personalizadas */}
        {client.user_tasks && client.user_tasks.length > 0 && (
          <div className="card" style={{ marginBottom: '24px', borderColor: 'rgba(238,189,43,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Award size={18} color="var(--gold)" />
              <h3 style={{ color: 'var(--text-main)', fontWeight: 700 }}>Tarefas Personalizadas</h3>
              <span className="badge" style={{ fontSize: '0.65rem' }}>Atribuídas pela equipe</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {client.user_tasks.map(task => (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                  background: task.done ? 'rgba(34,197,94,0.05)' : 'var(--bg-input)',
                  border: `1px solid ${task.done ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
                  borderRadius: '12px',
                }}>
                  {task.done ? <CheckCircle size={18} color="var(--success)" /> : <Clock size={18} color="var(--gold)" />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>{task.title}</div>
                    <div style={{ color: 'var(--text-sec)', fontSize: '0.78rem' }}>{task.description}</div>
                  </div>
                  {task.link_url && (
                    <a href={task.link_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary" style={{ padding: '6px 12px', textDecoration: 'none' }}>
                      {task.link_label || 'Acessar'}
                    </a>
                  )}
                  <button
                    onClick={() => toggleUserTaskDone(task.id)}
                    disabled={saving}
                    className="btn btn-sm"
                    style={{
                      padding: '6px 12px', fontSize: '0.72rem', gap: '4px',
                      borderColor: task.done ? 'var(--warning)' : 'var(--success)',
                      color: task.done ? 'var(--warning)' : 'var(--success)',
                      opacity: saving ? 0.5 : 1,
                    }}>
                    {task.done ? <><RotateCcw size={12} /> Desfazer</> : <><CheckCircle size={12} /> Concluir</>}
                  </button>
                  <button
                    onClick={() => deleteUserTask(task.id)}
                    disabled={saving}
                    title="Excluir tarefa"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                      display: 'flex', alignItems: 'center', color: 'var(--danger)', opacity: saving ? 0.3 : 0.6,
                    }}
                    onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = saving ? '0.3' : '0.6'; }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {userBadges.length > 0 && badges && (
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Award size={18} color="var(--gold)" />
              <h3 style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem' }}>Conquistas</h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {badges.badges.filter(b => userBadges.includes(b.id)).map(badge => (
                <div key={badge.id} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
                  borderRadius: '12px', background: `${badge.color}18`, border: `1px solid ${badge.color}33`,
                }}>
                  <span>{badge.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: badge.color }}>{badge.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{badge.points} pts</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fases */}
        <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="var(--gold)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Jornada do Cliente</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {stages.map(stage => {
            const isUnlocked = unlockedStages.has(stage.id);
            const mandatory = stage.tasks.filter(t => t.mandatory);
            const done = mandatory.filter(t => progress[t.id]?.done);
            const isExpanded = activeStage === stage.id;
            const icons: Record<string, typeof Play> = { video: Play, action: Zap, checklist: CheckCircle, form: User, upload: FileText, health_quiz: BarChart2, video_action: Play };

            return (
              <div key={stage.id} className="card" style={{ padding: 0, overflow: 'hidden', border: `1px solid ${isUnlocked ? 'rgba(238,189,43,0.15)' : 'var(--border)'}` }}>
                <button onClick={() => isUnlocked && setActiveStage(isExpanded ? null : stage.id)}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: isUnlocked ? 'pointer' : 'default', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                    background: isUnlocked ? 'var(--gold-bg)' : 'var(--bg-input)',
                    border: `1px solid ${isUnlocked ? 'rgba(238,189,43,0.2)' : 'var(--border)'}`,
                  }}>
                    {isUnlocked ? stage.icon : '🔒'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '3px' }}>
                      Fase {stage.order}: {stage.title}
                    </div>
                    <p style={{ color: 'var(--text-sec)', fontSize: '0.8rem' }}>{stage.description}</p>
                    {isUnlocked && mandatory.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                        <div className="progress-bar" style={{ flex: 1, height: '3px' }}>
                          <div className="progress-fill" style={{ width: `${(done.length / mandatory.length) * 100}%` }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600 }}>{done.length}/{mandatory.length}</span>
                      </div>
                    )}
                  </div>
                  {isUnlocked && (isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />)}
                </button>

                {isExpanded && isUnlocked && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stage.tasks.map(task => {
                      const isDone = progress[task.id]?.done;
                      const TaskIcon = icons[task.type] || Zap;
                      const taskUpload = uploads[task.id];

                      const taskProgress = progress[task.id];
                      const checklistItems = taskProgress?.checklist_items;

                      return (
                        <div key={task.id} style={{
                          border: `1px solid ${isDone ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
                          borderRadius: '12px', padding: '14px',
                          background: isDone ? 'rgba(34,197,94,0.04)' : 'var(--bg-input)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: isDone ? 'rgba(34,197,94,0.15)' : 'var(--gold-bg)',
                              border: `1px solid ${isDone ? 'rgba(34,197,94,0.2)' : 'rgba(238,189,43,0.2)'}`,
                            }}>
                              {isDone ? <CheckCircle size={16} color="var(--success)" /> : <TaskIcon size={16} color="var(--gold)" />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: isDone ? 'var(--success)' : 'var(--text-main)', marginBottom: '3px' }}>
                                {task.title}
                                {task.mandatory && <span className="badge" style={{ fontSize: '0.6rem', padding: '2px 7px', marginLeft: '6px' }}>Obrigatório</span>}
                                {isDone && <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '2px 7px', marginLeft: '6px' }}>Concluído</span>}
                              </div>
                              <p style={{ color: 'var(--text-sec)', fontSize: '0.8rem' }}>{task.description}</p>

                              {/* Timestamp de conclusão */}
                              {isDone && taskProgress?.timestamp && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                                  Concluído em: {new Date(taskProgress.timestamp).toLocaleString('pt-BR')}
                                </div>
                              )}

                              {/* === RESPOSTAS DO CHECKLIST === */}
                              {isDone && task.type === 'checklist' && task.items && (
                                <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(34,197,94,0.06)', borderRadius: '8px', border: '1px solid rgba(34,197,94,0.15)' }}>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Itens marcados pelo cliente:</div>
                                  {task.items.map((item, i) => {
                                    const checked = checklistItems ? checklistItems[item] : true;
                                    return (
                                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
                                        {checked ? <CheckCircle size={13} color="var(--success)" /> : <XCircle size={13} color="var(--text-muted)" />}
                                        <span style={{ fontSize: '0.8rem', color: checked ? 'var(--text-main)' : 'var(--text-muted)', textDecoration: checked ? 'none' : 'line-through' }}>{item}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* === RESPOSTAS DO HEALTH QUIZ === */}
                              {isDone && task.type === 'health_quiz' && client.credit_health?.initial_data && (
                                <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(238,189,43,0.06)', borderRadius: '8px', border: '1px solid rgba(238,189,43,0.15)' }}>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Respostas do questionário:</div>
                                  {[
                                    { label: 'Sabe o Score no Serasa/SPC?', value: client.credit_health.initial_data.has_positive_score, format: (v: boolean | undefined) => v ? 'Sim' : 'Não' },
                                    { label: 'Contas bancárias ativas', value: client.credit_health.initial_data.bank_accounts_range, format: (v: string | undefined) => v === '0' ? 'Nenhuma' : v === '1' ? '1 conta' : v === '2-3' ? '2-3 contas' : v === '4+' ? '4 ou mais' : v || '—' },
                                    { label: 'Débito automático?', value: client.credit_health.initial_data.has_auto_debit, format: (v: boolean | undefined) => v ? 'Sim' : 'Não' },
                                    { label: 'Possui investimentos?', value: client.credit_health.initial_data.has_investments, format: (v: boolean | undefined) => v ? 'Sim' : 'Não' },
                                    { label: 'Possui seguro?', value: client.credit_health.initial_data.has_insurance, format: (v: boolean | undefined) => v ? 'Sim' : 'Não' },
                                  ].map((q, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                      <span style={{ fontSize: '0.78rem', color: 'var(--text-sec)' }}>{q.label}</span>
                                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>{q.format(q.value as never)}</span>
                                    </div>
                                  ))}
                                  {client.credit_health.score > 0 && (
                                    <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '8px', background: `${client.credit_health.level_color || 'var(--gold)'}15`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: client.credit_health.level_color || 'var(--gold)' }}>Score de Saúde: {client.credit_health.score}</span>
                                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Nível: {client.credit_health.level}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* === DADOS DO FORMULÁRIO (perfil preenchido) === */}
                              {isDone && task.type === 'form' && (
                                <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(59,130,246,0.06)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.15)' }}>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Dados preenchidos no perfil:</div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 16px' }}>
                                    {[
                                      { label: 'Nome', value: client.name },
                                      { label: 'Email', value: client.email },
                                      { label: 'Telefone', value: client.phone },
                                      { label: 'CPF', value: profile?.cpf },
                                      { label: 'CNPJ', value: client.profiles?.PJ?.cnpj },
                                      { label: 'Ocupação', value: client.occupation },
                                      { label: 'Nome da Mãe', value: client.mother_name },
                                      { label: 'CEP', value: client.address_cep },
                                      { label: 'Endereço', value: [client.address_street, client.address_number].filter(Boolean).join(', ') || undefined },
                                      { label: 'Bairro', value: client.address_neighborhood },
                                      { label: 'Cidade/UF', value: [client.address_city, client.address_state].filter(Boolean).join('/') || undefined },
                                    ].filter(f => f.value).map((f, i) => (
                                      <div key={i} style={{ padding: '3px 0' }}>
                                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{f.label}: </span>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>{f.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* === VIDEO/VIDEO_ACTION — qual ação o cliente escolheu === */}
                              {isDone && task.type === 'video_action' && task.actions && (
                                <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-sec)' }}>
                                  Ação disponível: {task.actions.join(' / ')} — <span style={{ color: 'var(--success)', fontWeight: 600 }}>Completou</span>
                                </div>
                              )}

                              {/* Exibe arquivo enviado (Serasa ou outro upload) */}
                              {(task.type === 'upload' || task.id === 'task_serasa_upload') && (
                                <div style={{ marginTop: '10px' }}>
                                  {taskUpload || uploads['serasa'] ? (
                                    <a href={`/api/upload/${client.username}/${task.type === 'upload' ? task.id : 'serasa'}`} target="_blank" rel="noopener noreferrer"
                                      className="btn btn-sm" style={{ borderColor: 'var(--gold)', color: 'var(--gold)', gap: '6px' }}>
                                      <Eye size={14} /> Visualizar Arquivo Enviado
                                    </a>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Nenhum arquivo enviado ainda</span>
                                  )}
                                  {/* Info do upload */}
                                  {(taskUpload || uploads['serasa']) && (() => {
                                    const up = taskUpload || uploads['serasa'];
                                    return (
                                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        {up.originalName} • {(up.size / 1024).toFixed(0)} KB • Enviado em {new Date(up.uploadedAt).toLocaleString('pt-BR')}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => toggleTaskDone(task.id)}
                              disabled={saving}
                              className="btn btn-sm"
                              style={{
                                padding: '6px 12px', fontSize: '0.72rem', gap: '4px', flexShrink: 0,
                                borderColor: isDone ? 'var(--warning)' : 'var(--success)',
                                color: isDone ? 'var(--warning)' : 'var(--success)',
                                opacity: saving ? 0.5 : 1,
                              }}>
                              {isDone ? <><RotateCcw size={12} /> Desfazer</> : <><CheckCircle size={12} /> Marcar Concluído</>}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Financial items */}
        {client.financial_items?.length > 0 && (
          <div className="card" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <DollarSign size={18} color="var(--gold)" />
              <h3 style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem' }}>Lançamentos Financeiros</h3>
            </div>
            {client.financial_items.map(item => {
              const sc = { paid: 'var(--success)', pending: 'var(--warning)', overdue: 'var(--danger)' };
              const sl = { paid: 'Pago', pending: 'Pendente', overdue: 'Vencido' };
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                  background: 'var(--bg-input)', borderRadius: '10px', marginBottom: '8px', border: '1px solid var(--border)',
                }}>
                  <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-main)' }}>{item.description}</div>
                  <div style={{ fontWeight: 700, color: sc[item.status] }}>R$ {item.amount.toFixed(2)}</div>
                  <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, background: `${sc[item.status]}18`, color: sc[item.status] }}>
                    {sl[item.status]}
                  </span>
                  {item.status !== 'paid' && (
                    <button
                      onClick={() => markFinancialItemPaid(item.id)}
                      disabled={saving}
                      className="btn btn-sm"
                      style={{ padding: '4px 10px', fontSize: '0.68rem', borderColor: 'var(--success)', color: 'var(--success)', gap: '4px', opacity: saving ? 0.5 : 1 }}>
                      <CheckCircle size={11} /> Marcar Pago
                    </button>
                  )}
                  <button
                    onClick={() => deleteFinancialItem(item.id)}
                    disabled={saving}
                    title="Excluir lançamento"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                      display: 'flex', alignItems: 'center', color: 'var(--danger)', opacity: saving ? 0.3 : 0.6,
                    }}
                    onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = saving ? '0.3' : '0.6'; }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Dados Cadastrais */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <User size={18} color="var(--gold)" />
            <h3 style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem' }}>Dados Cadastrais</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {[
              { label: 'Nome', value: client.name },
              { label: 'Email', value: client.email },
              { label: 'Telefone', value: client.phone },
              { label: 'Usuário', value: client.username },
              { label: 'Ocupação', value: client.occupation },
              { label: 'Nome da Mãe', value: client.mother_name },
              { label: 'CPF', value: profile?.cpf },
              { label: 'CNPJ', value: client.profiles?.PJ?.cnpj },
              { label: 'Score Serasa', value: profile?.score ? String(profile.score) : undefined },
              { label: 'CEP', value: client.address_cep },
              { label: 'Rua', value: client.address_street },
              { label: 'Número', value: client.address_number },
              { label: 'Complemento', value: client.address_complement },
              { label: 'Bairro', value: client.address_neighborhood },
              { label: 'Cidade', value: client.address_city },
              { label: 'Estado', value: client.address_state },
            ].filter(f => f.value).map(field => (
              <div key={field.label} style={{ padding: '10px 14px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{field.label}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{field.value}</div>
              </div>
            ))}
          </div>
          {/* Dívidas */}
          {profile?.debts && profile.debts.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Dívidas Registradas</div>
              {profile.debts.map((debt, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
                  background: 'var(--bg-input)', borderRadius: '8px', marginBottom: '6px', border: '1px solid var(--border)',
                }}>
                  <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-main)' }}>{debt.creditor}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--danger)' }}>R$ {debt.amount.toFixed(2)}</div>
                  {debt.status && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{debt.status}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contato rápido */}
        <div className="card" style={{ marginTop: '24px', background: 'var(--gold-bg)', borderColor: 'rgba(238,189,43,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>Contato com {client.name}</div>
              <div style={{ color: 'var(--text-sec)', fontSize: '0.82rem' }}>{client.phone || 'Telefone não cadastrado'}</div>
            </div>
            <a href={`https://wa.me/55${(client.phone || '').replace(/\D/g, '')}?text=Olá ${client.name}, aqui é a equipe Empreendii Soluções ScoreMaster!`}
              target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ textDecoration: 'none', gap: '8px' }}>
              <MessageCircle size={16} /> WhatsApp
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
