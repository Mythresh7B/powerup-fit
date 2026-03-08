import { useEffect, useState } from 'react';

interface StatBarProps {
  icon: string;
  label: string;
  value: number;
  color: string;
  mastery: boolean;
}

const StatBar = ({ icon, label, value, color, mastery }: StatBarProps) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(Math.min((value / 500) * 100, 100));
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="flex items-center gap-3">
      <span className="text-lg w-6 text-center">{icon}</span>
      <span className="text-xs font-mono font-semibold text-muted-foreground uppercase tracking-wider w-20">
        {label}
      </span>
      <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-800 ease-out"
          style={{
            width: `${animatedWidth}%`,
            backgroundColor: color,
            boxShadow: mastery ? `0 0 12px ${color}, 0 0 24px ${color}40` : 'none',
            transition: 'width 0.8s ease-out',
          }}
        />
      </div>
      <span className={`text-sm font-mono font-bold w-14 text-right ${mastery ? 'text-warning' : 'text-foreground'}`}>
        {value}
      </span>
      {mastery && <span className="text-xs">✨</span>}
    </div>
  );
};

export default StatBar;
