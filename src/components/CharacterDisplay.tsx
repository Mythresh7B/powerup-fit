import { getLevelTitle } from '@/lib/xp';

interface CharacterDisplayProps {
  level: number;
  username: string;
}

const getColorScheme = (level: number) => {
  if (level >= 20) return { primary: '#F59E0B', secondary: '#EA580C', accent: '#EF4444', glow: true };
  if (level >= 15) return { primary: '#F59E0B', secondary: '#FFFFFF', accent: '#FDE68A', glow: false };
  if (level >= 10) return { primary: '#7C3AED', secondary: '#1E1B4B', accent: '#A78BFA', glow: false };
  if (level >= 5) return { primary: '#3B82F6', secondary: '#E5E7EB', accent: '#93C5FD', glow: false };
  return { primary: '#9CA3AF', secondary: '#92400E', accent: '#D1D5DB', glow: false };
};

const CharacterDisplay = ({ level, username }: CharacterDisplayProps) => {
  const colors = getColorScheme(level);
  const title = getLevelTitle(level);

  return (
    <div className="flex flex-col items-center gap-3">
      <h2 className="text-xl font-mono font-bold text-foreground">{username}</h2>

      <div className="relative w-[200px] h-[280px] animate-breathe">
        {/* Glow aura for level 20 */}
        {colors.glow && (
          <div className="absolute inset-0 rounded-full blur-2xl opacity-40 animate-pulse"
            style={{ background: `radial-gradient(circle, ${colors.primary}, ${colors.accent}, transparent)` }}
          />
        )}

        <svg viewBox="0 0 200 280" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Helmet */}
          <ellipse cx="100" cy="50" rx="35" ry="40" fill={colors.primary} />
          <rect x="70" y="42" width="60" height="8" rx="2" fill={colors.secondary} opacity="0.7" />
          {/* Visor slit */}
          <rect x="80" y="44" width="40" height="4" rx="1" fill="hsl(var(--background))" />

          {/* Neck */}
          <rect x="90" y="85" width="20" height="15" fill={colors.secondary} />

          {/* Body / Torso */}
          <rect x="60" y="100" width="80" height="80" rx="8" fill={colors.primary} />
          {/* Armour plate lines */}
          <line x1="100" y1="105" x2="100" y2="175" stroke={colors.secondary} strokeWidth="2" opacity="0.5" />
          <line x1="65" y1="130" x2="135" y2="130" stroke={colors.secondary} strokeWidth="1.5" opacity="0.4" />
          <line x1="65" y1="155" x2="135" y2="155" stroke={colors.secondary} strokeWidth="1.5" opacity="0.4" />
          {/* Chest emblem */}
          <circle cx="100" cy="125" r="10" fill={colors.accent} opacity="0.6" />

          {/* Left Arm */}
          <rect x="35" y="105" width="22" height="55" rx="6" fill={colors.primary} />
          {/* Left Gauntlet */}
          <rect x="33" y="155" width="26" height="18" rx="4" fill={colors.secondary} />

          {/* Right Arm */}
          <rect x="143" y="105" width="22" height="55" rx="6" fill={colors.primary} />
          {/* Right Gauntlet */}
          <rect x="141" y="155" width="26" height="18" rx="4" fill={colors.secondary} />

          {/* Shield (left side) */}
          <ellipse cx="30" cy="140" rx="18" ry="22" fill={colors.secondary} stroke={colors.accent} strokeWidth="2" />
          <line x1="30" y1="122" x2="30" y2="158" stroke={colors.accent} strokeWidth="1.5" />
          <line x1="14" y1="140" x2="46" y2="140" stroke={colors.accent} strokeWidth="1.5" />

          {/* Sword (right side) */}
          <line x1="175" y1="95" x2="185" y2="175" stroke={colors.accent} strokeWidth="4" strokeLinecap="round" />
          {/* Crossguard */}
          <line x1="170" y1="105" x2="190" y2="105" stroke={colors.secondary} strokeWidth="4" strokeLinecap="round" />
          {/* Pommel */}
          <circle cx="174" cy="92" r="4" fill={colors.accent} />

          {/* Left Leg */}
          <rect x="65" y="182" width="28" height="55" rx="6" fill={colors.secondary} />
          {/* Left Boot */}
          <rect x="60" y="230" width="38" height="18" rx="5" fill={colors.primary} />

          {/* Right Leg */}
          <rect x="107" y="182" width="28" height="55" rx="6" fill={colors.secondary} />
          {/* Right Boot */}
          <rect x="102" y="230" width="38" height="18" rx="5" fill={colors.primary} />

          {/* Level-based wing effects for 15+ */}
          {level >= 15 && (
            <>
              <path d="M55 110 Q20 80 10 50" fill="none" stroke={colors.accent} strokeWidth="2" opacity="0.6" />
              <path d="M55 120 Q15 95 5 65" fill="none" stroke={colors.accent} strokeWidth="1.5" opacity="0.4" />
              <path d="M145 110 Q180 80 190 50" fill="none" stroke={colors.accent} strokeWidth="2" opacity="0.6" />
              <path d="M145 120 Q185 95 195 65" fill="none" stroke={colors.accent} strokeWidth="1.5" opacity="0.4" />
            </>
          )}
        </svg>
      </div>

      <div className="text-center">
        <span className={`inline-block px-3 py-1 rounded-md text-xs font-mono font-bold tracking-wider uppercase ${
          level >= 20 ? 'bg-warning/20 text-warning animate-pulse' : 'bg-primary/20 text-primary'
        }`}>
          LEVEL {level}
        </span>
        <p className={`text-sm font-mono mt-1 ${
          level >= 20 ? 'text-warning font-bold' : 'text-muted-foreground'
        }`}>
          {title}
        </p>
      </div>
    </div>
  );
};

export default CharacterDisplay;
