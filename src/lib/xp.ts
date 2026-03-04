export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 900, 1500, 2400, 3700, 5500, 8000, 12000];

export function calculateXP(correctReps: number, accuracy: number, fatigue: number, streak: number): number {
  const base = correctReps * 10;
  const bonus = accuracy > 0.90 ? 20 : 0;
  const penalty = fatigue > 0.60 ? 10 : 0;
  const streakMult = streak >= 30 ? 1.5 : streak >= 7 ? 1.25 : streak >= 3 ? 1.1 : 1.0;
  return Math.max(0, Math.floor((base + bonus - penalty) * streakMult));
}

export function getLevel(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getLevelProgress(totalXp: number): number {
  const level = getLevel(totalXp);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return (totalXp - currentThreshold) / (nextThreshold - currentThreshold);
}

export function getAchievements(totalReps: number, correctReps: number, level: number): string[] {
  const achievements: string[] = [];
  if (totalReps >= 1) achievements.push('first_rep');
  if (correctReps >= 10) achievements.push('perfect_10');
  if (totalReps >= 100) achievements.push('century');
  if (level >= 5) achievements.push('level_5');
  if (level >= 10) achievements.push('level_10');
  return achievements;
}

export const ACHIEVEMENT_LABELS: Record<string, { name: string; emoji: string }> = {
  first_rep: { name: 'First Rep', emoji: '💪' },
  perfect_10: { name: 'Perfect 10', emoji: '🎯' },
  century: { name: 'Century Club', emoji: '💯' },
  level_5: { name: 'Rising Star', emoji: '⭐' },
  level_10: { name: 'Power Player', emoji: '🔥' },
};
