'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { TrendingUp, ChevronRight, Loader2, Award } from 'lucide-react';
import { calculateCreditHealth } from '@/lib/scoring';

interface QuizData {
  has_positive_score: boolean | null;
  bank_accounts_range: string;
  has_auto_debit: boolean | null;
  has_investments: boolean | null;
  has_insurance: boolean | null;
}

const questions = [
  {
    id: 'has_positive_score',
    text: 'Você tem o Cadastro Positivo ativado?',
    desc: 'O Cadastro Positivo registra seus pagamentos em dia, aumentando seu score.',
    type: 'bool',
  },
  {
    id: 'bank_accounts_range',
    text: 'Quantas contas bancárias possui atualmente?',
    desc: 'Cada banco você tem conta melhora seu relacionamento com o sistema financeiro.',
    type: 'range',
    options: ['0', '1-5', '6-10', '10+'],
    labels: ['Nenhuma', '1 a 5', '6 a 10', 'Mais de 10'],
  },
  {
    id: 'has_auto_debit',
    text: 'Tem contas em débito automático?',
    desc: 'Luz, água, internet em débito automático demonstra organização financeira.',
    type: 'bool',
  },
  {
    id: 'has_investments',
    text: 'Possui algum investimento atualmente?',
    desc: 'Qualquer investimento — poupança, Tesouro Direto, CDB — conta positivamente.',
    type: 'bool',
  },
  {
    id: 'has_insurance',
    text: 'Tem algum seguro ativo (vida, auto, residencial)?',
    desc: 'Seguros demonstram planejamento financeiro e são valorizados pelos bancos.',
    type: 'bool',
  },
];

export default function HealthQuizPage() {
  const { user, theme, refreshUser } = useAuth();
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<QuizData>({
    has_positive_score: null,
    bank_accounts_range: '',
    has_auto_debit: null,
    has_investments: null,
    has_insurance: null,
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof calculateCreditHealth> | null>(null);

  const q = questions[current];

  const answer = (val: boolean | string) => {
    const key = q.id as keyof QuizData;
    const updated = { ...answers, [key]: val };
    setAnswers(updated);

    if (current < questions.length - 1) {
      setTimeout(() => setCurrent(c => c + 1), 300);
    } else {
      submitQuiz(updated);
    }
  };

  const submitQuiz = async (data: QuizData) => {
    if (!user) return;
    setLoading(true);

    const health = calculateCreditHealth({
      has_positive_score: data.has_positive_score ?? false,
      bank_accounts_range: data.bank_accounts_range || '0',
      has_auto_debit: data.has_auto_debit ?? false,
      has_investments: data.has_investments ?? false,
      has_insurance: data.has_insurance ?? false,
    });

    await fetch(`/api/users/${user.username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credit_health_completed: true,
        credit_health: {
          ...health,
          last_calculated: new Date().toISOString(),
          initial_data: data,
        },
      }),
    });

    await refreshUser();
    setResult(health);
    setDone(true);
    setLoading(false);
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
            <span style={{ color: 'var(--gold)', fontSize: '0.82rem', fontWeight: 600 }}>Score de Saúde Financeira</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Diagnóstico de Hábitos
          </h1>
          <p style={{ color: 'var(--text-sec)', marginTop: '8px', fontSize: '0.9rem' }}>
            {!done ? `Pergunta ${current + 1} de ${questions.length}` : 'Análise concluída!'}
          </p>
        </div>

        {/* Progress bar */}
        {!done && (
          <div className="progress-bar" style={{ marginBottom: '28px' }}>
            <div className="progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
          </div>
        )}

        <div className="card" style={{ padding: '32px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-sec)' }}>Calculando seu Score de Saúde...</p>
            </div>
          )}

          {!loading && done && result && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto',
                background: `linear-gradient(135deg, ${result.level_color}, ${result.level_color}99)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 32px ${result.level_color}44`,
              }}>
                <Award size={36} color="#fff" />
              </div>
              <div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: result.level_color, letterSpacing: '-1px' }}>
                  {result.score}
                </h2>
                <p style={{ color: 'var(--text-sec)', fontSize: '0.875rem' }}>pontos de Saúde Financeira</p>
                <div style={{ marginTop: '8px' }}>
                  <span className="badge" style={{ background: `${result.level_color}22`, color: result.level_color, borderColor: `${result.level_color}44` }}>
                    Nível: {result.level}
                  </span>
                </div>
              </div>

              <div className="progress-bar" style={{ height: '12px' }}>
                <div className="progress-fill" style={{ width: `${result.percentage}%`, background: `linear-gradient(90deg, ${result.level_color}99, ${result.level_color})` }} />
              </div>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.875rem' }}>{result.percentage}% do score máximo possível</p>

              <button className="btn btn-primary btn-full btn-lg" onClick={() => router.push('/theme-select')}>
                <ChevronRight size={18} /> Ir para o Dashboard
              </button>
            </div>
          )}

          {!loading && !done && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  {q.text}
                </h2>
                <p style={{ color: 'var(--text-sec)', fontSize: '0.875rem', lineHeight: 1.6 }}>{q.desc}</p>
              </div>

              {q.type === 'bool' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[{ val: true, label: 'Sim ✓' }, { val: false, label: 'Não ✗' }].map(o => (
                    <button key={String(o.val)} className="btn btn-lg"
                      onClick={() => answer(o.val)}
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'range' && q.options && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {q.options.map((opt, i) => (
                    <button key={opt} className="btn"
                      onClick={() => answer(opt)}
                      style={{ justifyContent: 'flex-start', padding: '14px 18px', background: 'var(--bg-input)' }}>
                      <span style={{ color: 'var(--gold)', fontWeight: 700, minWidth: '28px' }}>{i + 1}.</span>
                      {q.labels?.[i] || opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
