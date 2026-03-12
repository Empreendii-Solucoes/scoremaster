'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';

interface TaskReminderProps {
  currentTaskId?: string | null;
  currentTaskTitle?: string | null;
  timeoutMinutes?: number;
}

export default function TaskReminder({ currentTaskId, currentTaskTitle, timeoutMinutes = 5 }: TaskReminderProps) {
  const [show, setShow] = useState(false);
  const [lastActivity, setLastActivity] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(false);

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setDismissed(false);
  }, []);

  useEffect(() => {
    if (!currentTaskId) return;
    
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    
    const interval = setInterval(() => {
      const elapsed = (Date.now() - lastActivity) / 1000 / 60;
      if (elapsed >= timeoutMinutes && !dismissed && currentTaskId) {
        setShow(true);
      }
    }, 10000);

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearInterval(interval);
    };
  }, [currentTaskId, lastActivity, dismissed, timeoutMinutes, resetTimer]);

  if (!show || !currentTaskTitle) return null;

  return (
    <div style={{
      position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
      background: 'var(--bg-card)', border: '1px solid rgba(238,189,43,0.4)',
      borderRadius: '14px', padding: '16px 20px', maxWidth: '340px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(238,189,43,0.15)',
      animation: 'slideInRight 0.4s ease-out',
    }}>
      <style>{`@keyframes slideInRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }`}</style>
      <button onClick={() => { setShow(false); setDismissed(true); }} style={{
        position: 'absolute', top: '8px', right: '8px', background: 'none',
        border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px',
      }}><X size={14} /></button>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(238,189,43,0.12)', border: '1px solid rgba(238,189,43,0.25)',
        }}>
          <AlertTriangle size={18} color="var(--gold)" />
        </div>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem', marginBottom: '4px' }}>
            Tarefa em andamento
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-sec)', marginBottom: '10px', lineHeight: 1.4 }}>
            Você estava preenchendo <strong style={{ color: 'var(--gold)' }}>&quot;{currentTaskTitle}&quot;</strong>. Continue de onde parou!
          </div>
          <button onClick={() => { setShow(false); setDismissed(true); }} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600,
            background: 'linear-gradient(135deg, var(--gold), var(--gold-dark))',
            color: '#000', border: 'none', cursor: 'pointer',
          }}>
            Continuar <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
