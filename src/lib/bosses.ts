export interface BossDefinition {
  index: number;
  name: string;
  levelRequired: number;
  exercise: string;
  repsRequired: number;
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
    exercise: 'bicep_curl',
    repsRequired: 10,
    bossHP: 200,
    bossAttack: 15,
    bossDefence: 10,
    weakness: 'ATTACK',
    lore: 'An ancient training dummy brought to life by cursed iron. Slow and clumsy but tough.',
    emoji: '🗿',
    bonusXP: 150,
  },
  {
    index: 2,
    name: 'Stoneback Titan',
    levelRequired: 3,
    exercise: 'shoulder_press',
    repsRequired: 15,
    bossHP: 400,
    bossAttack: 28,
    bossDefence: 25,
    weakness: 'DEFENCE',
    lore: 'A boulder-shouldered giant who tests your upper-body endurance above all else.',
    emoji: '🪨',
    bonusXP: 250,
  },
  {
    index: 3,
    name: 'Shadow Sprinter',
    levelRequired: 6,
    exercise: 'squat',
    repsRequired: 20,
    bossHP: 650,
    bossAttack: 45,
    bossDefence: 20,
    weakness: 'AGILITY',
    lore: 'A blur of motion that attacks from every angle. Only the swift survive.',
    emoji: '👤',
    bonusXP: 350,
  },
  {
    index: 4,
    name: 'The Iron Monk',
    levelRequired: 10,
    exercise: 'plank',
    repsRequired: 8,
    bossHP: 900,
    bossAttack: 60,
    bossDefence: 50,
    weakness: 'FOCUS',
    lore: 'A silent warrior who meditates through your attacks. Mental fortitude is the only weapon.',
    emoji: '🧘',
    bonusXP: 450,
  },
  {
    index: 5,
    name: 'Apex Warlord',
    levelRequired: 15,
    exercise: 'mixed',
    repsRequired: 25,
    bossHP: 1500,
    bossAttack: 90,
    bossDefence: 70,
    weakness: 'ALL',
    lore: 'The final guardian. Defeated only by those who have mastered every discipline.',
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
