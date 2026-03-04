import { getLevelProgress, getLevel } from '@/lib/xp';

interface XPRingProps {
  totalXp: number;
  sessionXp?: number;
}

const XPRing = ({ totalXp, sessionXp = 0 }: XPRingProps) => {
  const level = getLevel(totalXp);
  const progress = getLevelProgress(totalXp);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Level</span>
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="url(#xpGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700"
          />
          <defs>
            <linearGradient id="xpGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--accent))" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-display font-bold text-foreground">{level}</span>
          <span className="text-xs text-muted-foreground">{totalXp} XP</span>
        </div>
      </div>
      {sessionXp > 0 && (
        <span className="text-sm font-semibold text-accent">+{sessionXp} XP</span>
      )}
    </div>
  );
};

export default XPRing;
