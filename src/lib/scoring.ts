import { Stage, User, Badge, BadgesData } from './types';

/**
 * Calcula o progresso global do usuário (0-100)
 */
export function calculateProgress(user: User, stages: Stage[]): number {
  const allMandatoryTasks = stages.flatMap(s =>
    s.tasks.filter(t => t.mandatory)
  );
  if (allMandatoryTasks.length === 0) return 0;
  const doneTasks = allMandatoryTasks.filter(t => user.progress?.[t.id]?.done);
  return Math.round((doneTasks.length / allMandatoryTasks.length) * 100);
}

/**
 * Determina quais fases estão desbloqueadas para o usuário
 */
export function getUnlockedStages(user: User, stages: Stage[]): Set<string> {
  const unlocked = new Set<string>();
  for (const stage of stages) {
    if (stage.order === 1) {
      unlocked.add(stage.id);
      continue;
    }
    // Verifica se todas as tarefas obrigatórias da fase anterior foram concluídas
    const prevStage = stages.find(s => s.order === stage.order - 1);
    if (!prevStage) continue;
    const prevMandatory = prevStage.tasks.filter(t => t.mandatory);
    const allDone = prevMandatory.every(t => user.progress?.[t.id]?.done);
    if (allDone) unlocked.add(stage.id);
  }
  return unlocked;
}

/**
 * Verifica e retorna badges que o usuário deveria ganhar
 */
export function checkBadges(user: User, stages: Stage[], allBadges: Badge[]): string[] {
  const userBadges = new Set(user.badges || []);
  const newBadges: string[] = [];
  const unlockedStages = getUnlockedStages(user, stages);

  for (const badge of allBadges) {
    if (userBadges.has(badge.id)) continue;

    // Badge de primeiro acesso
    if (badge.id === 'badge_first_access') {
      newBadges.push(badge.id);
      continue;
    }

    // Badge por fase concluída
    if (badge.stage_required) {
      const stage = stages.find(s => s.id === badge.stage_required);
      if (stage) {
        const mandatoryTasks = stage.tasks.filter(t => t.mandatory);
        const allDone = mandatoryTasks.every(t => user.progress?.[t.id]?.done);
        if (allDone && unlockedStages.has(badge.stage_required)) {
          newBadges.push(badge.id);
        }
      }
    }

    // Badge por task específica
    if (badge.id === 'badge_cadastro_positivo' && user.progress?.['task_cadastro_positivo']?.done) {
      newBadges.push(badge.id);
    }
    if (badge.id === 'badge_investor' && user.progress?.['task_investimento']?.done) {
      newBadges.push(badge.id);
    }

    // Badge de streak
    if (badge.streak_days && user.streak_days >= badge.streak_days) {
      newBadges.push(badge.id);
    }
  }

  return newBadges;
}

/**
 * Calcula o Score de Saúde Financeira (portado do credit_health.py)
 */
export function calculateCreditHealth(initialData: {
  has_positive_score?: boolean;
  bank_accounts_range?: string;
  has_auto_debit?: boolean;
  has_investments?: boolean;
  has_insurance?: boolean;
}): { score: number; level: string; level_color: string; percentage: number; breakdown: Record<string, number> } {
  let score = 0;
  const breakdown: Record<string, number> = {};

  // Score Positivo: 200 pontos
  if (initialData.has_positive_score) {
    score += 200;
    breakdown.score_positivo = 200;
  } else {
    breakdown.score_positivo = 0;
  }

  // Contas bancárias: até 300 pontos
  const accountPoints: Record<string, number> = {
    '0': 0,
    '1-5': 150,
    '6-10': 250,
    '10+': 300,
  };
  const bankPts = accountPoints[initialData.bank_accounts_range || '0'] || 0;
  score += bankPts;
  breakdown.contas_bancarias = bankPts;

  // Débito automático: 150 pontos
  if (initialData.has_auto_debit) {
    score += 150;
    breakdown.debitos_automaticos = 150;
  } else {
    breakdown.debitos_automaticos = 0;
  }

  // Investimentos: 200 pontos
  if (initialData.has_investments) {
    score += 200;
    breakdown.investimentos = 200;
  } else {
    breakdown.investimentos = 0;
  }

  // Seguros: 150 pontos
  if (initialData.has_insurance) {
    score += 150;
    breakdown.seguros = 150;
  } else {
    breakdown.seguros = 0;
  }

  const maxScore = 1000;
  const pct = Math.min(100, Math.round((score / maxScore) * 100));

  let level = 'Iniciante';
  let level_color = '#FF5252';
  if (pct >= 80) { level = 'Mestre'; level_color = '#D4AF37'; }
  else if (pct >= 60) { level = 'Avançado'; level_color = '#66BB6A'; }
  else if (pct >= 40) { level = 'Intermediário'; level_color = '#26C6DA'; }
  else if (pct >= 20) { level = 'Aprendiz'; level_color = '#FF9800'; }

  return { score, level, level_color, percentage: pct, breakdown };
}

/**
 * Retorna mensagem de progresso adequada
 */
export function getProgressMessage(badgesData: BadgesData, pct: number): string {
  const messages = badgesData.progress_messages;
  if (pct >= 100) return messages['100'] || '';
  if (pct >= 76) return messages['76-99'] || '';
  if (pct >= 51) return messages['51-75'] || '';
  if (pct >= 26) return messages['26-50'] || '';
  return messages['0-25'] || '';
}
