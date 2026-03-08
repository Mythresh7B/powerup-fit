export interface BossPhase {
  exercise: string;
  repsRequired: number;
}

export interface BossDefinition {
  index: number;
  name: string;
  levelRequired: number;
  phases: BossPhase[];
  bossHP: number;
  bossAttack: number;
  bossDefence: number;
  weakness: string;
  lore: string;
  emoji: string;
  bonusXP: number;
}

export const BOSSES: BossDefinition[] = [
  {
    index: 1,
    name: 'The Rusted Golem',
    levelRequired: 1,
    phases: [
      { exercise: 'bicep_curl', repsRequired: 12 },
      { exercise: 'squat', repsRequired: 10 },
    ],
    bossHP: 250,
    bossAttack: 18,
    bossDefence: 12,
    weakness: 'ATTACK',
    lore: 'An ancient training dummy brought to life by cursed iron. Slow but resilient.',
    emoji: '🗿',
    bonusXP: 150,
  },
  {
    index: 2,
    name: 'Stoneback Titan',
    levelRequired: 4,
    phases: [
      { exercise: 'shoulder_press', repsRequired: 15 },
      { exercise: 'squat', repsRequired: 15 },
      { exercise: 'bicep_curl', repsRequired: 12 },
    ],
    bossHP: 500,
    bossAttack: 32,
    bossDefence: 30,
    weakness: 'DEFENCE',
    lore: 'A boulder-shouldered giant who has never lost a pushing contest.',
    emoji: '🪨',
    bonusXP: 250,
  },
  {
    index: 3,
    name: 'Shadow Sprinter',
    levelRequired: 7,
    phases: [
      { exercise: 'squat', repsRequired: 20 },
      { exercise: 'plank', repsRequired: 6 },
      { exercise: 'bicep_curl', repsRequired: 15 },
      { exercise: 'shoulder_press', repsRequired: 10 },
    ],
    bossHP: 750,
    bossAttack: 50,
    bossDefence: 25,
    weakness: 'AGILITY',
    lore: 'A blur of motion that attacks from every angle. Speed and endurance are the only answer.',
    emoji: '👤',
    bonusXP: 350,
  },
  {
    index: 4,
    name: 'The Iron Monk',
    levelRequired: 11,
    phases: [
      { exercise: 'plank', repsRequired: 10 },
      { exercise: 'shoulder_press', repsRequired: 20 },
      { exercise: 'squat', repsRequired: 20 },
      { exercise: 'plank', repsRequired: 8 },
    ],
    bossHP: 1100,
    bossAttack: 65,
    bossDefence: 55,
    weakness: 'FOCUS',
    lore: 'A silent warrior who meditates through pain. He will not fall to brute force alone.',
    emoji: '🧘',
    bonusXP: 450,
  },
  {
    index: 5,
    name: 'Apex Warlord',
    levelRequired: 15,
    phases: [
      { exercise: 'bicep_curl', repsRequired: 25 },
      { exercise: 'shoulder_press', repsRequired: 25 },
      { exercise: 'squat', repsRequired: 25 },
      { exercise: 'plank', repsRequired: 12 },
    ],
    bossHP: 2000,
    bossAttack: 95,
    bossDefence: 75,
    weakness: 'ALL',
    lore: 'The final guardian. A warrior who has mastered every discipline.',
    emoji: '⚔️',
    bonusXP: 550,
  },
];

export const EXERCISE_LABELS: Record<string, string> = {
  bicep_curl: '💪 Bicep Curl',
  shoulder_press: '🏋️ Shoulder Press',
  squat: '🦵 Squat',
  plank: '🧘 Plank',
  mixed: '🔄 Mixed',
};

export function getTotalRepsForBoss(boss: BossDefinition): number {
  return boss.phases.reduce((sum, p) => sum + p.repsRequired, 0);
}
