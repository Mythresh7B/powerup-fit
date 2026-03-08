// Single source of truth for XP thresholds — used by ALL components
export const LEVEL_XP_THRESHOLDS = [
  0, 200, 500, 1000, 1750, 2800, 4200, 6000,
  8300, 11100, 14500, 18500, 23200, 28700,
  35100, 42500, 51000, 60700, 71700, 84200,
];

export function getLevel(totalXp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_XP_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_XP_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return Math.min(level, 20);
}

export interface XPProgress {
  level: number;
  currentXp: number;
  xpThisLevel: number;
  xpNeeded: number;
  progress: number;
}

export function getXPProgress(totalXp: number): XPProgress {
  const level = getLevel(totalXp);
  if (level >= 20) {
    return { level: 20, currentXp: totalXp, xpThisLevel: 0, xpNeeded: 0, progress: 1.0 };
  }
  const currentThreshold = LEVEL_XP_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_XP_THRESHOLDS[level];
  const xpThisLevel = totalXp - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  return {
    level,
    currentXp: totalXp,
    xpThisLevel,
    xpNeeded,
    progress: Math.round((xpThisLevel / xpNeeded) * 10000) / 10000,
  };
}

// Keep old names for backward compat
export function getLevelProgress(totalXp: number): number {
  return getXPProgress(totalXp).progress;
}

// Kept for backward compat — old threshold array alias
export const LEVEL_THRESHOLDS = LEVEL_XP_THRESHOLDS;

export function calculateXP(correctReps: number, accuracy: number, fatigue: number, streak: number): number {
  const base = Math.min(correctReps, 100) * 10;
  const bonus = accuracy > 0.90 ? 20 : 0;
  const penalty = fatigue > 0.60 ? 10 : 0;
  const streakMult = streak >= 30 ? 1.5 : streak >= 7 ? 1.25 : streak >= 3 ? 1.1 : 1.0;
  return Math.max(0, Math.min(Math.floor((base + bonus - penalty) * streakMult), 1500));
}

// Level titles
export function getLevelTitle(level: number): string {
  if (level >= 20) return 'PowerUp Legend';
  if (level >= 19) return 'Transcendent';
  if (level >= 17) return 'Apex Predator';
  if (level >= 15) return 'Mythic Warrior';
  if (level >= 13) return 'Legendary Fighter';
  if (level >= 11) return 'War Champion';
  if (level >= 9) return 'Elite Guardian';
  if (level >= 7) return 'Battle Hardened';
  if (level >= 5) return 'Steel Knight';
  if (level >= 3) return 'Iron Fist';
  return 'Rookie Warrior';
}

// Stat calculation
export interface StatDeltas {
  attack: number;
  defence: number;
  focus: number;
  agility: number;
}

export function calculateStatDeltas(exercise: string, correctReps: number): StatDeltas {
  const deltas: StatDeltas = { attack: 0, defence: 0, focus: 0, agility: 0 };
  switch (exercise) {
    case 'bicep_curl':
      deltas.attack += correctReps * 2;
      break;
    case 'shoulder_press':
      deltas.defence += correctReps * 2;
      deltas.attack += correctReps * 1;
      break;
    case 'squat':
      deltas.agility += correctReps * 2;
      deltas.defence += correctReps * 1;
      break;
    case 'plank':
      deltas.focus += correctReps * 3;
      deltas.agility += correctReps * 1;
      break;
  }
  return deltas;
}

// HP derived from level
export function getHP(level: number): number {
  return 100 + level * 25;
}

// Achievement system (kept for backward compat)
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
