'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Users, DollarSign, Settings, CheckCircle, XCircle, Trash2,
  Eye, TrendingUp, Clock, Shield, Plus, AlertTriangle, LogOut, ChevronDown, ChevronUp,
  Edit2, Send, ListChecks, Link2, FileText, X, UserCheck, Save, FolderOpen, Download, Layers, RotateCcw, MessageSquare,
} from 'lucide-react';
import { User, Stage, Task, UserTask, GlobalSettings } from '@/lib/types';

type AdminTab = 'users' | 'financial' | 'tasks' | 'content' | 'settings';

interface NewTaskForm {
  title: string;
  description: string;
  type: UserTask['type'];
  items: string;
  link_url: string;
  link_label: string;
  targetUsername: string; // '' = todos
}

export default function AdminPage() {
  const { user: adminUser, theme, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [newUserForm, setNewUserForm] = useState({ username: '', password: '', name: '', phone: '' });
  const [showNewUser, setShowNewUser] = useState(false);
  const [taskForm, setTaskForm] = useState<NewTaskForm>({
    title: '', description: '', type: 'action', items: '',
    link_url: '', link_label: '', targetUsername: '',
  });
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskMsg, setTaskMsg] = useState('');
  const [billingForm, setBillingForm] = useState({ targetUsername: '', name: '', description: '', amount: 0, payment_link: '' });
  const [resetNote, setResetNote] = useState('');

  // Files modal
  const [viewFilesUser, setViewFilesUser] = useState<string | null>(null);

  // Phase/Task CRUD
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [stageForm, setStageForm] = useState({ title: '', description: '', icon: '📋', order: 0, is_paid: false, price: 0, payment_link: '' });
  const [stageTaskForm, setStageTaskForm] = useState<{ title: string; description: string; type: Task['type']; mandatory: boolean; video_url: string; items: string; actions: string }>({ title: '', description: '', type: 'action', mandatory: true, video_url: '', items: '', actions: '' });
  const [showNewStage, setShowNewStage] = useState(false);
  const [showNewTaskForStage, setShowNewTaskForStage] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({ whatsapp_number: '', mentoria_link: '', cartao_garantido_link: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [usersRes, contentRes] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/content'),
    ]);
    if (usersRes.ok) {
      const data = await usersRes.json();
      setUsers(data.filter((u: User) => !u.isAdmin));
    }
    if (contentRes.ok) {
      const content = await contentRes.json();
      setStages(content.stages || []);
      if (content.settings) setGlobalSettings(content.settings);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!adminUser) { router.replace('/login'); return; }
    if (!adminUser.isAdmin) { router.replace('/dashboard'); return; }
    fetchData();
  }, [adminUser, router, fetchData]);

  if (!adminUser?.isAdmin) return null;

  const approveRaioX = async (username: string) => {
    await fetch(`/api/users/${username}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ raio_x_status: 'approved' }) });
    fetchData();
  };
  const rejectRaioX = async (username: string) => {
    await fetch(`/api/users/${username}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ raio_x_status: 'rejected' }) });
    fetchData();
  };
  const deleteUser = async (username: string) => {
    if (!confirm(`Excluir ${username}?`)) return;
    await fetch(`/api/users/${username}`, { method: 'DELETE' });
    fetchData();
  };
  const createUser = async () => {
    const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newUserForm, profile_choice: 'PF' }) });
    if (res.ok) { setShowNewUser(false); setNewUserForm({ username: '', password: '', name: '', phone: '' }); fetchData(); }
  };

  const deleteUserTask = async (targetUsername: string, taskId: string) => {
    const target = users.find(u => u.username === targetUsername);
    if (!target) return;
    const updatedTasks = (target.user_tasks || []).filter(t => t.id !== taskId);
    await fetch(`/api/users/${targetUsername}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_tasks: updatedTasks }) });
    fetchData();
  };

  const assignTask = async () => {
    if (!taskForm.title) return;
    setTaskLoading(true);
    setTaskMsg('');

    const newTask: UserTask = {
      id: `ut_${Date.now()}`,
      title: taskForm.title,
      description: taskForm.description,
      type: taskForm.type,
      items: taskForm.type === 'checklist' ? taskForm.items.split('\n').filter(Boolean) : undefined,
      link_url: taskForm.type === 'link' ? taskForm.link_url : undefined,
      link_label: taskForm.type === 'link' ? taskForm.link_label : undefined,
      created_at: new Date().toISOString(),
      created_by: adminUser.username,
      done: false,
    };

    const targets = taskForm.targetUsername ? users.filter(u => u.username === taskForm.targetUsername) : users;

    await Promise.all(targets.map(async (u) => {
      const updatedTasks = [...(u.user_tasks || []), newTask];
      await fetch(`/api/users/${u.username}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_tasks: updatedTasks }) });
    }));

    setTaskMsg(taskForm.targetUsername ? `Tarefa atribuída para ${taskForm.targetUsername}!` : `Tarefa atribuída para ${targets.length} cliente(s)!`);
    setTaskForm({ title: '', description: '', type: 'action', items: '', link_url: '', link_label: '', targetUsername: '' });
    setTaskLoading(false);
    fetchData();
  };

  // === Phase/Task CRUD ===
  const saveStages = async (updated: Stage[]) => {
    await fetch('/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stages: updated }) });
    setStages(updated);
  };

  const addStage = async () => {
    if (!stageForm.title) return;
    const newStage: Stage = {
      id: `stage_${Date.now()}`, title: stageForm.title, description: stageForm.description, icon: stageForm.icon,
      order: stages.length + 1, locked: stages.length > 0, is_paid: stageForm.is_paid,
      price: stageForm.is_paid ? stageForm.price : undefined, payment_link: stageForm.is_paid ? stageForm.payment_link : undefined, tasks: [],
    };
    await saveStages([...stages, newStage]);
    setStageForm({ title: '', description: '', icon: '📋', order: 0, is_paid: false, price: 0, payment_link: '' });
    setShowNewStage(false);
  };

  const updateStage = async (stageId: string) => {
    const updated = stages.map(s => s.id === stageId ? {
      ...s, title: stageForm.title || s.title, description: stageForm.description || s.description, icon: stageForm.icon || s.icon,
      is_paid: stageForm.is_paid, price: stageForm.is_paid ? stageForm.price : undefined, payment_link: stageForm.is_paid ? stageForm.payment_link : undefined,
    } : s);
    await saveStages(updated);
    setEditingStageId(null);
  };

  const deleteStage = async (stageId: string) => {
    if (!confirm('Excluir esta fase e todas as suas tarefas?')) return;
    const updated = stages.filter(s => s.id !== stageId).map((s, i) => ({ ...s, order: i + 1 }));
    await saveStages(updated);
  };

  const addTaskToStage = async (stageId: string) => {
    if (!stageTaskForm.title) return;
    const newTask: Task = {
      id: `task_${Date.now()}`, title: stageTaskForm.title, description: stageTaskForm.description,
      type: stageTaskForm.type, mandatory: stageTaskForm.mandatory,
      video_url: ['video', 'video_action'].includes(stageTaskForm.type) ? stageTaskForm.video_url : undefined,
      items: stageTaskForm.type === 'checklist' ? stageTaskForm.items.split('\n').filter(Boolean) : undefined,
      actions: stageTaskForm.type === 'video_action' ? stageTaskForm.actions.split('\n').filter(Boolean) : undefined,
    };
    const updated = stages.map(s => s.id === stageId ? { ...s, tasks: [...s.tasks, newTask] } : s);
    await saveStages(updated);
    setStageTaskForm({ title: '', description: '', type: 'action', mandatory: true, video_url: '', items: '', actions: '' });
    setShowNewTaskForStage(null);
  };

  const updateTaskInStage = async (stageId: string, taskId: string) => {
    const updated = stages.map(s => s.id === stageId ? {
      ...s, tasks: s.tasks.map(t => t.id === taskId ? {
        ...t, title: stageTaskForm.title || t.title, description: stageTaskForm.description || t.description,
        type: stageTaskForm.type, mandatory: stageTaskForm.mandatory,
        video_url: ['video', 'video_action'].includes(stageTaskForm.type) ? stageTaskForm.video_url : undefined,
        items: stageTaskForm.type === 'checklist' ? stageTaskForm.items.split('\n').filter(Boolean) : undefined,
        actions: stageTaskForm.type === 'video_action' ? stageTaskForm.actions.split('\n').filter(Boolean) : undefined,
      } : t),
    } : s);
    await saveStages(updated);
    setEditingTaskId(null);
  };

  const deleteTaskFromStage = async (stageId: string, taskId: string) => {
    if (!confirm('Excluir esta tarefa?')) return;
    const updated = stages.map(s => s.id === stageId ? { ...s, tasks: s.tasks.filter(t => t.id !== taskId) } : s);
    await saveStages(updated);
  };

  const startEditStage = (s: Stage) => {
    setEditingStageId(s.id);
    setStageForm({ title: s.title, description: s.description, icon: s.icon, order: s.order, is_paid: !!s.is_paid, price: s.price || 0, payment_link: s.payment_link || '' });
  };

  const startEditTask = (t: Task) => {
    setEditingTaskId(t.id);
    setStageTaskForm({ title: t.title, description: t.description, type: t.type, mandatory: t.mandatory, video_url: t.video_url || '', items: t.items?.join('\n') || '', actions: t.actions?.join('\n') || '' });
  };

  const startNewTaskForStage = (stageId: string) => {
    setShowNewTaskForStage(stageId);
    setStageTaskForm({ title: '', description: '', type: 'action', mandatory: true, video_url: '', items: '', actions: '' });
  };

  const uploadLabelMap: Record<string, string> = {
    serasa: 'Consulta Serasa / Boa Vista', doc_rg: 'RG', doc_cnh: 'CNH', doc_comprovante: 'Comprovante de Residência',
    doc_cpf: 'CPF', doc_selfie: 'Selfie com Documento',
  };

  const resetTaskProgress = async (username: string, taskId: string, note: string) => {
    const target = users.find(u => u.username === username);
    if (!target) return;
    const updatedProgress = JSON.parse(JSON.stringify(target.progress || {}));
    updatedProgress[taskId] = { done: false, timestamp: Date.now(), reset_note: note || 'Resetado pelo admin', reset_at: new Date().toISOString() };
    try {
      await fetch(`/api/users/${username}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ progress: updatedProgress }) });
      await fetchData();
    } catch (err) { console.error('Reset failed', err); }
  };

  const addBilling = async () => {
    if (!billingForm.name || !billingForm.amount) return;
    const targets = billingForm.targetUsername ? users.filter(u => u.username === billingForm.targetUsername) : users;
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await Promise.all(targets.map(async (u) => {
      const newItem = {
        id: `fin_${Date.now()}_${u.username}`,
        description: `${billingForm.name}${billingForm.description ? ' — ' + billingForm.description : ''}`,
        amount: billingForm.amount,
        due_date: dueDate,
        status: 'pending' as const,
        payment_link: billingForm.payment_link || undefined,
      };
      const items = [...(u.financial_items || []), newItem];
      await fetch(`/api/users/${u.username}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ financial_items: items }) });
    }));
    setBillingForm({ targetUsername: '', name: '', description: '', amount: 0, payment_link: '' });
    fetchData();
  };

  const markItemPaid = async (username: string, itemId: string) => {
    const target = users.find(u => u.username === username);
    if (!target) return;
    const updated = (target.financial_items || []).map(i => i.id === itemId ? { ...i, status: 'paid' as const, paid_at: new Date().toISOString() } : i);
    await fetch(`/api/users/${username}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ financial_items: updated }) });
    fetchData();
  };

  const pendingApproval = users.filter(u => u.raio_x_status === 'pending_approval');
  const totalRevenue = users.reduce((s, u) => s + (u.financial_items || []).filter(i => i.status === 'paid').reduce((ss, i) => ss + i.amount, 0), 0);
  const totalPending = users.reduce((s, u) => s + (u.financial_items || []).filter(i => i.status !== 'paid').reduce((ss, i) => ss + i.amount, 0), 0);

  const statusMap: Record<string, { label: string; color: string }> = {
    approved: { label: 'Aprovado', color: 'var(--success)' },
    pending: { label: 'Pendente', color: 'var(--warning)' },
    pending_approval: { label: 'Aguardando', color: 'var(--info)' },
    rejected: { label: 'Rejeitado', color: 'var(--danger)' },
  };

  const saveGlobalSettings = async (updated: GlobalSettings) => {
    setGlobalSettings(updated);
    await fetch('/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stages, settings: updated }) });
  };

  const totalTasksDone = users.reduce((s, u) => s + Object.values(u.progress || {}).filter(p => p.done).length, 0);
  const totalTasksAll = users.length * stages.flatMap(s => s.tasks).length;
  const avgProgress = users.length ? Math.round(users.reduce((s, u) => { const m = stages.flatMap(st => st.tasks).filter(t => t.mandatory); const d = m.filter(t => u.progress?.[t.id]?.done).length; return s + (m.length ? (d / m.length) * 100 : 0); }, 0) / users.length) : 0;

  const tabs = [
    { id: 'users' as AdminTab, label: 'Clientes', icon: Users },
    { id: 'tasks' as AdminTab, label: 'Tarefas', icon: ListChecks },
    { id: 'financial' as AdminTab, label: 'Financeiro', icon: DollarSign },
    { id: 'content' as AdminTab, label: 'Fases', icon: Layers },
    { id: 'settings' as AdminTab, label: 'Configurações', icon: Settings },
  ];

  return (
    <div data-theme={theme} style={{ minHeight: '100vh', background: 'var(--bg-app)' }}>
      {/* Admin Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border)', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={16} color="#000" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem' }}>ScoreMaster <span style={{ color: 'var(--gold)' }}>Admin</span></span>
          <span className="badge" style={{ fontSize: '0.6rem' }}>Gerencial</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard')} style={{ gap: '6px', color: 'var(--text-sec)', borderColor: 'transparent' }}>
            <Eye size={14} /> Dashboard
          </button>
          <button className="btn btn-ghost btn-sm" onClick={logout} style={{ gap: '6px', color: 'var(--danger)', borderColor: 'transparent' }}>
            <LogOut size={14} /> Sair
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* KPIs gerenciais */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Total de Clientes', value: users.length, icon: Users, color: 'var(--text-main)' },
            { label: 'Aguard. Aprovação', value: pendingApproval.length, icon: Clock, color: 'var(--warning)' },
            { label: 'Progresso Médio', value: `${avgProgress}%`, icon: TrendingUp, color: 'var(--gold)' },
            { label: 'Tarefas Concluídas', value: `${totalTasksDone}/${totalTasksAll}`, icon: CheckCircle, color: 'var(--success)' },
            { label: 'Receita Paga', value: `R$ ${totalRevenue.toFixed(0)}`, icon: DollarSign, color: 'var(--gold)' },
          ].map(k => (
            <div key={k.label} className="kpi-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <k.icon size={14} color={k.color} />
                <span className="kpi-label">{k.label}</span>
              </div>
              <div className="kpi-value" style={{ color: k.color, fontSize: '1.3rem' }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-card)', borderRadius: '14px', padding: '5px', border: '1px solid var(--border)', width: 'fit-content' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: tab === t.id ? 'var(--gold)' : 'transparent', color: tab === t.id ? '#000' : 'var(--text-sec)', fontWeight: tab === t.id ? 700 : 400, fontSize: '0.85rem', transition: 'all 0.2s' }}>
              <t.icon size={14} />{t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}><div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '3px', margin: '0 auto' }} /></div>
        ) : (
          <>
            {/* === CLIENTES TAB === */}
            {tab === 'users' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Fila de aprovação Raio-X */}
                {pendingApproval.length > 0 && (
                  <div className="card" style={{ padding: '20px', borderColor: 'rgba(245,158,11,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <AlertTriangle size={16} color="var(--warning)" />
                      <h3 style={{ color: 'var(--warning)', fontWeight: 700, fontSize: '0.95rem' }}>Aprovação Pendente — Raio-X ({pendingApproval.length})</h3>
                    </div>
                    {pendingApproval.map(u => (
                      <div key={u.username} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'var(--bg-input)', borderRadius: '10px', marginBottom: '8px', border: '1px solid var(--border)' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.username} • {u.phone}</div>
                        </div>
                        {u.uploads?.serasa && (
                          <a href={`/api/upload/${u.username}/serasa`} target="_blank" rel="noopener noreferrer"
                            className="btn btn-sm" style={{ gap: '6px', borderColor: 'rgba(238,189,43,0.3)', color: 'var(--gold)' }}>
                            <Eye size={13} /> Ver Arquivo
                          </a>
                        )}
                        <button className="btn btn-sm" onClick={() => approveRaioX(u.username)} style={{ borderColor: 'var(--success)', color: 'var(--success)', gap: '5px' }}>
                          <CheckCircle size={13} /> Aprovar
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => rejectRaioX(u.username)} style={{ gap: '5px' }}>
                          <XCircle size={13} /> Rejeitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Header + add */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem' }}>Todos os Clientes ({users.length})</h3>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowNewUser(!showNewUser)} style={{ gap: '6px' }}>
                    <Plus size={13} /> Novo Cliente
                  </button>
                </div>

                {showNewUser && (
                  <div className="card" style={{ padding: '20px' }}>
                    <h4 style={{ color: 'var(--text-main)', marginBottom: '16px', fontWeight: 600 }}>Cadastrar Novo Cliente</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      {[{ l: 'Nome', f: 'name' as keyof typeof newUserForm, ph: 'Nome completo' }, { l: 'Usuário', f: 'username' as keyof typeof newUserForm, ph: 'username' }, { l: 'Senha', f: 'password' as keyof typeof newUserForm, ph: 'senha' }, { l: 'Celular', f: 'phone' as keyof typeof newUserForm, ph: '11 9XXXX-XXXX' }].map(fld => (
                        <div key={fld.f} className="input-group">
                          <label className="input-label">{fld.l}</label>
                          <input className="input" placeholder={fld.ph} value={newUserForm[fld.f]} onChange={e => setNewUserForm(p => ({ ...p, [fld.f]: e.target.value }))} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary btn-sm" onClick={createUser}><Plus size={13} /> Criar</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowNewUser(false)}>Cancelar</button>
                    </div>
                  </div>
                )}

                {/* Users list */}
                {users.map(u => {
                  const isExp = expandedUser === u.username;
                  const statusInfo = statusMap[u.raio_x_status] || { label: u.raio_x_status, color: 'var(--text-muted)' };
                  const doneTasks = Object.values(u.progress || {}).filter(p => p.done).length;
                  const totalTasks = stages.flatMap(s => s.tasks).length;
                  const allTasks = stages.flatMap(s => s.tasks);
                  const mandatoryDone = allTasks.filter(t => t.mandatory && u.progress?.[t.id]?.done).length;
                  const mandatoryTotal = allTasks.filter(t => t.mandatory).length;
                  const progressPct = mandatoryTotal ? Math.round((mandatoryDone / mandatoryTotal) * 100) : 0;

                  return (
                    <div key={u.username} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                      <div role="button" tabIndex={0} onClick={() => setExpandedUser(isExp ? null : u.username)}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gold-bg)', border: '1px solid rgba(238,189,43,0.2)', fontSize: '1.1rem' }}>👤</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '2px' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            @{u.username} • {u.phone} • {doneTasks}/{totalTasks} tarefas • {progressPct}%
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '80px' }}>
                            <div className="progress-bar" style={{ height: '4px' }}>
                              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                            </div>
                          </div>
                          <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, background: `${statusInfo.color}18`, color: statusInfo.color, border: `1px solid ${statusInfo.color}33`, flexShrink: 0 }}>
                            {statusInfo.label}
                          </span>
                          <button onClick={e => { e.stopPropagation(); router.push(`/admin/client/${u.username}`); }} className="btn btn-sm" style={{ padding: '3px 10px', gap: '4px', borderColor: 'rgba(238,189,43,0.3)', color: 'var(--gold)', fontSize: '0.7rem' }}>
                            <Eye size={11} /> Ver como Cliente
                          </button>
                        </div>
                        {isExp ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                      </div>

                      {isExp && (
                        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {/* Dados gerenciais */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                            {[
                              { l: 'Score Serasa', v: String(u.profiles?.PF?.score || u.profiles?.PJ?.score || '—') },
                              { l: 'Score Saúde', v: String(u.credit_health?.score || 0) },
                              { l: 'Nível', v: u.credit_health?.level || 'Iniciante' },
                              { l: 'Lançamentos', v: String(u.financial_items?.length || 0) },
                            ].map(k => (
                              <div key={k.l} style={{ padding: '10px 12px', background: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }}>{k.l}</div>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>{k.v}</div>
                              </div>
                            ))}
                          </div>

                          {/* Arquivos enviados */}
                          {u.uploads && Object.keys(u.uploads).length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Arquivos Enviados</div>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {Object.entries(u.uploads).map(([key, up]) => (
                                  <a key={key} href={`/api/upload/${u.username}/${key}`} target="_blank" rel="noopener noreferrer"
                                    className="btn btn-sm" style={{ borderColor: 'rgba(238,189,43,0.3)', color: 'var(--gold)', gap: '6px' }}>
                                    <FileText size={13} />
                                    {key === 'serasa' ? 'Consulta Serasa' : up.originalName}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tarefas personalizadas existentes */}
                          {u.user_tasks && u.user_tasks.length > 0 && (
                            <div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Tarefas Atribuídas</div>
                              {u.user_tasks.map(task => (
                                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: '10px', marginBottom: '6px', border: '1px solid var(--border)' }}>
                                  {task.done ? <CheckCircle size={14} color="var(--success)" /> : <Clock size={14} color="var(--gold)" />}
                                  <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-main)' }}>{task.title}</div>
                                  <span style={{ fontSize: '0.68rem', color: task.done ? 'var(--success)' : 'var(--text-muted)' }}>
                                    {task.done ? '✓ Concluída' : 'Pendente'}
                                  </span>
                                  <button onClick={() => deleteUserTask(u.username, task.id)}
                                    className="btn btn-sm" style={{ padding: '4px 8px', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Progresso das Fases */}
                          <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Progresso nas Fases</div>
                            {stages.map(stage => (
                              <div key={stage.id} style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>{stage.icon} {stage.title}</div>
                                {stage.tasks.filter(t => t.mandatory).map(t => {
                                  const done = u.progress?.[t.id]?.done;
                                  const note = u.progress?.[t.id]?.reset_note;
                                  return (
                                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'var(--bg-input)', borderRadius: '8px', marginBottom: '4px', border: '1px solid var(--border)' }}>
                                      {done ? <CheckCircle size={13} color="var(--success)" /> : <Clock size={13} color="var(--text-muted)" />}
                                      <div style={{ flex: 1, fontSize: '0.78rem', color: 'var(--text-main)' }}>{t.title}</div>
                                      {note && <span style={{ fontSize: '0.65rem', color: 'var(--warning)' }}>📝 {note}</span>}
                                      {done && (
                                        <button onClick={() => {
                                          const obs = prompt('Observação para o cliente (motivo do reset):');
                                          if (obs !== null) resetTaskProgress(u.username, t.id, obs);
                                        }} className="btn btn-sm" style={{ padding: '2px 6px', gap: '4px', borderColor: 'rgba(238,189,43,0.3)', color: 'var(--gold)', fontSize: '0.65rem' }}>
                                          <RotateCcw size={10} /> Resetar
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>

                          {/* Ações */}
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {u.uploads && Object.keys(u.uploads).length > 0 && (
                              <button className="btn btn-sm" onClick={() => setViewFilesUser(u.username)}
                                style={{ gap: '6px', borderColor: 'rgba(99,102,241,0.3)', color: 'var(--info)' }}>
                                <FolderOpen size={13} /> Ver Arquivos ({Object.keys(u.uploads).length})
                              </button>
                            )}
                            {u.raio_x_status === 'pending_approval' && (
                              <>
                                <button className="btn btn-sm" onClick={() => approveRaioX(u.username)} style={{ borderColor: 'var(--success)', color: 'var(--success)', gap: '5px' }}>
                                  <CheckCircle size={13} /> Aprovar Raio-X
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => rejectRaioX(u.username)} style={{ gap: '5px' }}>
                                  <XCircle size={13} /> Rejeitar
                                </button>
                              </>
                            )}
                            <button className="btn btn-sm" onClick={() => deleteUser(u.username)} style={{ borderColor: 'var(--danger)', color: 'var(--danger)', gap: '5px' }}>
                              <Trash2 size={13} /> Excluir
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* === TAREFAS TAB === */}
            {tab === 'tasks' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
                {/* Formulário de criação */}
                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <Plus size={18} color="var(--gold)" />
                    <h3 style={{ color: 'var(--text-main)', fontWeight: 700 }}>Nova Tarefa</h3>
                  </div>

                  {taskMsg && (
                    <div className="alert alert-success" style={{ marginBottom: '16px' }}>
                      <CheckCircle size={15} /> {taskMsg}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="input-group">
                      <label className="input-label">Atribuir para</label>
                      <select className="input" value={taskForm.targetUsername} onChange={e => setTaskForm(p => ({ ...p, targetUsername: e.target.value }))}>
                        <option value="">🌐 Todos os Clientes (coletivo)</option>
                        {users.map(u => <option key={u.username} value={u.username}>{u.name} (@{u.username})</option>)}
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Tipo de Tarefa</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {([
                          { val: 'action', label: '✓ Ação', icon: UserCheck },
                          { val: 'checklist', label: '☑ Checklist', icon: ListChecks },
                          { val: 'link', label: '🔗 Link', icon: Link2 },
                        ] as const).map(o => (
                          <button key={o.val} type="button" onClick={() => setTaskForm(p => ({ ...p, type: o.val }))}
                            className="btn btn-sm" style={{ flex: 1, background: taskForm.type === o.val ? 'var(--gold)' : 'transparent', color: taskForm.type === o.val ? '#000' : 'var(--text-sec)', border: `1px solid ${taskForm.type === o.val ? 'var(--gold)' : 'var(--border)'}` }}>
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Título *</label>
                      <input className="input" placeholder="Nome da tarefa" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Descrição</label>
                      <textarea className="input" rows={3} placeholder="Instruções detalhadas..." value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
                    </div>

                    {taskForm.type === 'checklist' && (
                      <div className="input-group">
                        <label className="input-label">Itens do Checklist (um por linha)</label>
                        <textarea className="input" rows={4} placeholder="Item 1&#10;Item 2&#10;Item 3" value={taskForm.items} onChange={e => setTaskForm(p => ({ ...p, items: e.target.value }))} style={{ resize: 'vertical' }} />
                      </div>
                    )}

                    {taskForm.type === 'link' && (
                      <>
                        <div className="input-group">
                          <label className="input-label">URL do Link</label>
                          <input className="input" placeholder="https://..." value={taskForm.link_url} onChange={e => setTaskForm(p => ({ ...p, link_url: e.target.value }))} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Texto do Botão</label>
                          <input className="input" placeholder="Acessar formulário" value={taskForm.link_label} onChange={e => setTaskForm(p => ({ ...p, link_label: e.target.value }))} />
                        </div>
                      </>
                    )}

                    <button className="btn btn-primary btn-full" onClick={assignTask} disabled={!taskForm.title || taskLoading} style={{ gap: '8px', marginTop: '4px' }}>
                      <Send size={16} />
                      {taskLoading ? 'Atribuindo...' : taskForm.targetUsername ? `Atribuir para ${users.find(u => u.username === taskForm.targetUsername)?.name?.split(' ')[0] || ''}` : `Atribuir para Todos (${users.length})`}
                    </button>
                  </div>
                </div>

                {/* Listagem por cliente */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <Edit2 size={16} color="var(--gold)" />
                    <h3 style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '0.95rem' }}>Tarefas Atribuídas</h3>
                  </div>
                  {users.filter(u => (u.user_tasks?.length || 0) > 0).map(u => (
                    <div key={u.username} className="card" style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem', marginBottom: '10px' }}>
                        {u.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.78rem' }}>(@{u.username})</span>
                      </div>
                      {u.user_tasks!.map(task => (
                        <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'var(--bg-input)', borderRadius: '10px', marginBottom: '6px', border: '1px solid var(--border)' }}>
                          {task.done ? <CheckCircle size={14} color="var(--success)" /> : <Clock size={14} color="var(--gold)" />}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 500 }}>{task.title}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{task.type === 'action' ? 'Ação' : task.type === 'checklist' ? 'Checklist' : 'Link'}</div>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: task.done ? 'var(--success)' : 'var(--text-muted)' }}>{task.done ? '✓' : '•'}</span>
                          <button onClick={() => deleteUserTask(u.username, task.id)} className="btn btn-sm" style={{ padding: '3px 7px', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                  {users.every(u => !u.user_tasks?.length) && (
                    <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <ListChecks size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                      <p style={{ fontSize: '0.875rem' }}>Nenhuma tarefa atribuída ainda.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* === FINANCEIRO TAB === */}
            {tab === 'financial' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <DollarSign size={18} color="var(--gold)" />
                    <h3 style={{ color: 'var(--text-main)', fontWeight: 700 }}>Resumo Financeiro por Cliente</h3>
                  </div>

                  {/* Tabela */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {['Cliente', 'Total Pago', 'Em Aberto', 'Vencidos', 'Status', 'Lançamentos'].map(h => (
                            <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => {
                          const items = u.financial_items || [];
                          const paid = items.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
                          const pending = items.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
                          const overdue = items.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);
                          const pendingItems = items.filter(i => i.status !== 'paid');
                          const fmt = (v: number) => v > 0 ? `R$ ${v.toFixed(2)}` : '—';
                          return (
                            <tr key={u.username} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                              </td>
                              <td style={{ padding: '12px 14px', color: paid > 0 ? 'var(--success)' : 'var(--text-muted)' }}>{fmt(paid)}</td>
                              <td style={{ padding: '12px 14px', color: pending > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>{fmt(pending)}</td>
                              <td style={{ padding: '12px 14px', color: overdue > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{fmt(overdue)}</td>
                              <td style={{ padding: '12px 14px' }}>
                                {overdue > 0 ? <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Inadimplente</span> :
                                  pending > 0 ? <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Pendente</span> :
                                    items.length === 0 ? <span className="badge" style={{ fontSize: '0.65rem', background: 'var(--bg-input)', color: 'var(--text-muted)', borderColor: 'transparent' }}>Sem dados</span> :
                                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Em dia</span>}
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                {items.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {items.map(item => (
                                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px', borderRadius: '4px', background: 'var(--bg-app)' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-main)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {item.description}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: item.status === 'paid' ? 'var(--success)' : item.status === 'overdue' ? 'var(--danger)' : 'var(--warning)', fontWeight: 600 }}>
                                          {fmt(item.amount)}
                                        </span>
                                        {item.status === 'paid' ? (
                                          <span style={{ fontSize: '0.65rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}><CheckCircle size={10} /> Pago</span>
                                        ) : item.status === 'overdue' ? (
                                          <span style={{ fontSize: '0.65rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}><XCircle size={10} /> Vencido</span>
                                        ) : (
                                          <button className="btn btn-sm" onClick={() => markItemPaid(u.username, item.id)} style={{ padding: '2px 8px', fontSize: '0.65rem', borderColor: 'var(--success)', color: 'var(--success)', gap: '4px', marginLeft: 'auto' }}>
                                            <CheckCircle size={10} /> Marcar Pago
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Billing Form */}
                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <Plus size={18} color="var(--gold)" />
                    <h3 style={{ color: 'var(--text-main)', fontWeight: 700 }}>Nova Cobrança</h3>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Nome *</label>
                      <input className="input" placeholder="Ex: Consultoria Premium" value={billingForm.name} onChange={e => setBillingForm(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Cliente (vazio = todos)</label>
                      <select className="input" value={billingForm.targetUsername} onChange={e => setBillingForm(p => ({ ...p, targetUsername: e.target.value }))}>
                        <option value="">Todos os clientes</option>
                        {users.map(u => <option key={u.username} value={u.username}>{u.name} (@{u.username})</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="input-group" style={{ marginBottom: '12px' }}>
                    <label className="input-label">Descrição</label>
                    <input className="input" placeholder="Descrição da cobrança" value={billingForm.description} onChange={e => setBillingForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Valor (R$) *</label>
                      <input className="input" type="number" step="0.01" placeholder="0.00" value={billingForm.amount || ''} onChange={e => setBillingForm(p => ({ ...p, amount: Number(e.target.value) }))} />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Link de Pagamento</label>
                      <input className="input" placeholder="https://pay.exemplo.com/..." value={billingForm.payment_link} onChange={e => setBillingForm(p => ({ ...p, payment_link: e.target.value }))} />
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={addBilling} disabled={!billingForm.name || !billingForm.amount} style={{ gap: '8px' }}>
                    <Send size={16} /> Criar Cobrança
                  </button>
                </div>
              </div>
            )}

            {/* === CONFIGURAÇÕES TAB === */}
            {tab === 'content' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Layers size={18} color="var(--gold)" />
                      <h3 style={{ color: 'var(--text-main)', fontWeight: 700 }}>Editor de Fases ({stages.length})</h3>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => { setShowNewStage(!showNewStage); setEditingStageId(null); }} style={{ gap: '6px' }}>
                      <Plus size={13} /> Nova Fase
                    </button>
                  </div>

                  {/* New Stage Form */}
                  {showNewStage && (
                    <div style={{ padding: '16px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--gold)', marginBottom: '14px' }}>
                      <h4 style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '12px' }}>Criar Nova Fase</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                        <div className="input-group"><label className="input-label">Título *</label><input className="input" placeholder="Ex: Diagnóstico" value={stageForm.title} onChange={e => setStageForm(p => ({ ...p, title: e.target.value }))} /></div>
                        <div className="input-group"><label className="input-label">Ícone (emoji)</label><input className="input" placeholder="🔍" value={stageForm.icon} onChange={e => setStageForm(p => ({ ...p, icon: e.target.value }))} /></div>
                      </div>
                      <div className="input-group" style={{ marginBottom: '10px' }}><label className="input-label">Descrição</label><input className="input" placeholder="Descrição da fase" value={stageForm.description} onChange={e => setStageForm(p => ({ ...p, description: e.target.value }))} /></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                          <input type="checkbox" checked={stageForm.is_paid} onChange={e => setStageForm(p => ({ ...p, is_paid: e.target.checked }))} /> Premium (pago)
                        </label>
                        {stageForm.is_paid && (
                          <>
                            <div className="input-group" style={{ marginBottom: 0, width: '120px' }}><input className="input" type="number" placeholder="Preço" value={stageForm.price || ''} onChange={e => setStageForm(p => ({ ...p, price: Number(e.target.value) }))} /></div>
                            <div className="input-group" style={{ marginBottom: 0, flex: 1 }}><input className="input" placeholder="Link de pagamento" value={stageForm.payment_link} onChange={e => setStageForm(p => ({ ...p, payment_link: e.target.value }))} /></div>
                          </>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary btn-sm" onClick={addStage} disabled={!stageForm.title} style={{ gap: '6px' }}><Plus size={13} /> Criar Fase</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowNewStage(false)}>Cancelar</button>
                      </div>
                    </div>
                  )}

                  {/* Stage List */}
                  {stages.map(stage => {
                    const isExp = expandedStage === stage.id;
                    const isEditing = editingStageId === stage.id;
                    const completedUsers = users.filter(u => stage.tasks.filter(t => t.mandatory).every(t => u.progress?.[t.id]?.done)).length;
                    return (
                      <div key={stage.id} style={{ background: 'var(--bg-input)', borderRadius: '12px', border: `1px solid ${isExp ? 'rgba(238,189,43,0.3)' : 'var(--border)'}`, marginBottom: '10px', overflow: 'hidden' }}>
                        {/* Stage Header */}
                        {isEditing ? (
                          <div style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                              <div className="input-group" style={{ marginBottom: 0 }}><label className="input-label">Título</label><input className="input" value={stageForm.title} onChange={e => setStageForm(p => ({ ...p, title: e.target.value }))} /></div>
                              <div className="input-group" style={{ marginBottom: 0 }}><label className="input-label">Ícone</label><input className="input" value={stageForm.icon} onChange={e => setStageForm(p => ({ ...p, icon: e.target.value }))} /></div>
                            </div>
                            <div className="input-group" style={{ marginBottom: '10px' }}><label className="input-label">Descrição</label><input className="input" value={stageForm.description} onChange={e => setStageForm(p => ({ ...p, description: e.target.value }))} /></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                                <input type="checkbox" checked={stageForm.is_paid} onChange={e => setStageForm(p => ({ ...p, is_paid: e.target.checked }))} /> Premium
                              </label>
                              {stageForm.is_paid && (
                                <>
                                  <div className="input-group" style={{ marginBottom: 0, width: '120px' }}><input className="input" type="number" placeholder="Preço" value={stageForm.price || ''} onChange={e => setStageForm(p => ({ ...p, price: Number(e.target.value) }))} /></div>
                                  <div className="input-group" style={{ marginBottom: 0, flex: 1 }}><input className="input" placeholder="Link pagamento" value={stageForm.payment_link} onChange={e => setStageForm(p => ({ ...p, payment_link: e.target.value }))} /></div>
                                </>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="btn btn-primary btn-sm" onClick={() => updateStage(stage.id)} style={{ gap: '5px' }}><Save size={13} /> Salvar</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditingStageId(null)}>Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div role="button" tabIndex={0} onClick={() => setExpandedStage(isExp ? null : stage.id)}
                            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                            <span style={{ fontSize: '1.1rem' }}>{stage.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>Fase {stage.order}: {stage.title}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stage.description} • {stage.tasks.length} tarefas • {completedUsers}/{users.length} completos</div>
                            </div>
                            {stage.is_paid && <span className="badge" style={{ fontSize: '0.6rem' }}>Premium</span>}
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={e => { e.stopPropagation(); startEditStage(stage); }} className="btn btn-sm" style={{ padding: '4px 8px', borderColor: 'rgba(238,189,43,0.3)', color: 'var(--gold)' }}><Edit2 size={12} /></button>
                              <button onClick={e => { e.stopPropagation(); deleteStage(stage.id); }} className="btn btn-sm" style={{ padding: '4px 8px', borderColor: 'var(--danger)', color: 'var(--danger)' }}><Trash2 size={12} /></button>
                            </div>
                            {isExp ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                          </div>
                        )}

                        {/* Stage Tasks */}
                        {isExp && !isEditing && (
                          <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px' }}>
                            {stage.tasks.map(task => {
                              const isEditingT = editingTaskId === task.id;
                              if (isEditingT) {
                                return (
                                  <div key={task.id} style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--gold)', marginBottom: '8px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                      <div className="input-group" style={{ marginBottom: 0 }}><label className="input-label">Título</label><input className="input" value={stageTaskForm.title} onChange={e => setStageTaskForm(p => ({ ...p, title: e.target.value }))} /></div>
                                      <div className="input-group" style={{ marginBottom: 0 }}>
                                        <label className="input-label">Tipo</label>
                                        <select className="input" value={stageTaskForm.type} onChange={e => setStageTaskForm(p => ({ ...p, type: e.target.value as Task['type'] }))}>
                                          <option value="action">Ação</option><option value="checklist">Checklist</option><option value="video">Vídeo</option>
                                          <option value="video_action">Vídeo + Ações</option><option value="upload">Upload</option><option value="form">Formulário</option><option value="health_quiz">Quiz Saúde</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="input-group" style={{ marginBottom: '10px' }}><label className="input-label">Descrição</label><textarea className="input" rows={2} value={stageTaskForm.description} onChange={e => setStageTaskForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                                    {['video', 'video_action'].includes(stageTaskForm.type) && (
                                      <div className="input-group" style={{ marginBottom: '10px' }}><label className="input-label">URL do Vídeo</label><input className="input" value={stageTaskForm.video_url} onChange={e => setStageTaskForm(p => ({ ...p, video_url: e.target.value }))} /></div>
                                    )}
                                    {stageTaskForm.type === 'checklist' && (
                                      <div className="input-group" style={{ marginBottom: '10px' }}><label className="input-label">Itens (um por linha)</label><textarea className="input" rows={3} value={stageTaskForm.items} onChange={e => setStageTaskForm(p => ({ ...p, items: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                                    )}
                                    {stageTaskForm.type === 'video_action' && (
                                      <div className="input-group" style={{ marginBottom: '10px' }}><label className="input-label">Ações (uma por linha)</label><textarea className="input" rows={2} value={stageTaskForm.actions} onChange={e => setStageTaskForm(p => ({ ...p, actions: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={stageTaskForm.mandatory} onChange={e => setStageTaskForm(p => ({ ...p, mandatory: e.target.checked }))} /> Obrigatória
                                      </label>
                                      <div style={{ flex: 1 }} />
                                      <button className="btn btn-primary btn-sm" onClick={() => updateTaskInStage(stage.id, task.id)} style={{ gap: '5px' }}><Save size={13} /> Salvar</button>
                                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingTaskId(null)}>Cancelar</button>
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '6px' }}>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{task.title}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{task.type} {task.mandatory ? '• obrigatória' : '• opcional'}</div>
                                  </div>
                                  <button onClick={() => startEditTask(task)} className="btn btn-sm" style={{ padding: '4px 8px', borderColor: 'rgba(238,189,43,0.3)', color: 'var(--gold)' }}><Edit2 size={12} /></button>
                                  <button onClick={() => deleteTaskFromStage(stage.id, task.id)} className="btn btn-sm" style={{ padding: '4px 8px', borderColor: 'var(--danger)', color: 'var(--danger)' }}><Trash2 size={12} /></button>
                                </div>
                              );
                            })}

                            {/* New Task Form */}
                            {showNewTaskForStage === stage.id ? (
                              <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--gold)', marginTop: '8px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                  <div className="input-group" style={{ marginBottom: 0 }}><label className="input-label">Título *</label><input className="input" placeholder="Nome da tarefa" value={stageTaskForm.title} onChange={e => setStageTaskForm(p => ({ ...p, title: e.target.value }))} /></div>
                                  <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="input-label">Tipo</label>
                                    <select className="input" value={stageTaskForm.type} onChange={e => setStageTaskForm(p => ({ ...p, type: e.target.value as Task['type'] }))}>
                                      <option value="action">Ação</option><option value="checklist">Checklist</option><option value="video">Vídeo</option>
                                      <option value="video_action">Vídeo + Ações</option><option value="upload">Upload</option><option value="form">Formulário</option><option value="health_quiz">Quiz Saúde</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="input-group" style={{ marginBottom: '10px' }}><label className="input-label">Descrição</label><textarea className="input" rows={2} placeholder="Instruções..." value={stageTaskForm.description} onChange={e => setStageTaskForm(p => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                                {['video', 'video_action'].includes(stageTaskForm.type) && (
                                  <div className="input-group" style={{ marginBottom: '10px' }}><label className="input-label">URL do Vídeo</label><input className="input" placeholder="https://..." value={stageTaskForm.video_url} onChange={e => setStageTaskForm(p => ({ ...p, video_url: e.target.value }))} /></div>
                                )}
                                {stageTaskForm.type === 'checklist' && (
                                  <div className="input-group" style={{ marginBottom: '10px' }}><label className="input-label">Itens (um por linha)</label><textarea className="input" rows={3} placeholder="Item 1&#10;Item 2" value={stageTaskForm.items} onChange={e => setStageTaskForm(p => ({ ...p, items: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                                )}
                                {stageTaskForm.type === 'video_action' && (
                                  <div className="input-group" style={{ marginBottom: '10px' }}><label className="input-label">Ações (uma por linha)</label><textarea className="input" rows={2} placeholder="Ação 1&#10;Ação 2" value={stageTaskForm.actions} onChange={e => setStageTaskForm(p => ({ ...p, actions: e.target.value }))} style={{ resize: 'vertical' }} /></div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={stageTaskForm.mandatory} onChange={e => setStageTaskForm(p => ({ ...p, mandatory: e.target.checked }))} /> Obrigatória
                                  </label>
                                  <div style={{ flex: 1 }} />
                                  <button className="btn btn-primary btn-sm" onClick={() => addTaskToStage(stage.id)} disabled={!stageTaskForm.title} style={{ gap: '5px' }}><Plus size={13} /> Criar</button>
                                  <button className="btn btn-ghost btn-sm" onClick={() => setShowNewTaskForStage(null)}>Cancelar</button>
                                </div>
                              </div>
                            ) : (
                              <button className="btn btn-sm" onClick={() => startNewTaskForStage(stage.id)} style={{ marginTop: '8px', gap: '6px', borderColor: 'rgba(238,189,43,0.3)', color: 'var(--gold)' }}>
                                <Plus size={13} /> Adicionar Tarefa
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* === SETTINGS TAB === */}
            {tab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                    <Settings size={18} color="var(--gold)" />
                    <h3 style={{ color: 'var(--text-main)', fontWeight: 700 }}>Configurações Globais</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="input-group">
                      <label className="input-label">Número WhatsApp (com cód. país)</label>
                      <input className="input" placeholder="5511999999999" value={globalSettings.whatsapp_number}
                        onChange={e => setGlobalSettings(p => ({ ...p, whatsapp_number: e.target.value }))} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Usado em todos os botões de contato do app</span>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Link Cartão Garantido</label>
                      <input className="input" placeholder="https://..." value={globalSettings.cartao_garantido_link}
                        onChange={e => setGlobalSettings(p => ({ ...p, cartao_garantido_link: e.target.value }))} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Link Mentoria</label>
                      <input className="input" placeholder="https://..." value={globalSettings.mentoria_link}
                        onChange={e => setGlobalSettings(p => ({ ...p, mentoria_link: e.target.value }))} />
                    </div>
                    <button className="btn btn-primary" onClick={() => saveGlobalSettings(globalSettings)} style={{ gap: '8px', alignSelf: 'flex-start' }}>
                      <Save size={16} /> Salvar Configurações
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* === FILES MODAL === */}
      {viewFilesUser && (() => {
        const fileUser = users.find(u => u.username === viewFilesUser);
        const uploads = fileUser?.uploads || {};
        return (
          <div onClick={() => setViewFilesUser(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)', width: '100%', maxWidth: '600px', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1, borderRadius: '20px 20px 0 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FolderOpen size={18} color="var(--gold)" />
                  <div>
                    <h3 style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>Arquivos de {fileUser?.name}</h3>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>@{viewFilesUser} • {Object.keys(uploads).length} arquivo(s)</div>
                  </div>
                </div>
                <button onClick={() => setViewFilesUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={20} /></button>
              </div>
              <div style={{ padding: '20px 24px' }}>
                {Object.keys(uploads).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    <FolderOpen size={36} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                    <p style={{ fontSize: '0.875rem' }}>Nenhum arquivo enviado.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(uploads).map(([key, file]) => (
                      <div key={key} style={{ padding: '14px 16px', background: 'var(--bg-input)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--gold-bg)', border: '1px solid rgba(238,189,43,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={18} color="var(--gold)" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>{uploadLabelMap[key] || key}</div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.originalName}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {(file.size / 1024).toFixed(0)} KB • {new Date(file.uploadedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <a href={`/api/upload/${viewFilesUser}/${key}`} target="_blank" rel="noopener noreferrer"
                            className="btn btn-sm" style={{ gap: '5px', borderColor: 'rgba(238,189,43,0.3)', color: 'var(--gold)', flexShrink: 0 }}>
                            <Download size={13} /> Abrir
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
