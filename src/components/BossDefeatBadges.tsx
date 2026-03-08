import { BOSSES } from '@/lib/bosses';

interface BossProgress {
  boss_index: number;
  defeated: boolean;
  first_defeated_at: string | null;
}

interface BossDefeatBadgesProps {
  progress: BossProgress[];
}

const BossDefeatBadges = ({ progress }: BossDefeatBadgesProps) => {
  const getProgress = (bossIndex: number) =>
    progress.find(p => p.boss_index === bossIndex);

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider mb-3">
        Boss Defeats
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {BOSSES.map(boss => {
          const bp = getProgress(boss.index);
          const defeated = bp?.defeated ?? false;
          return (
            <div key={boss.index} className={`flex-shrink-0 w-20 text-center p-2 rounded-lg border ${
              defeated ? 'border-warning/40 bg-warning/5' : 'border-border/30 bg-muted/20'
            }`}>
              <span className={`text-2xl block ${defeated ? '' : 'opacity-30 grayscale'}`}>
                {defeated ? boss.emoji : '❓'}
              </span>
              <span className={`text-[10px] font-mono block mt-1 ${
                defeated ? 'text-warning' : 'text-muted-foreground'
              }`}>
                {defeated ? boss.name.split(' ').pop() : '???'}
              </span>
              {defeated && bp?.first_defeated_at && (
                <span className="text-[8px] font-mono text-muted-foreground block">
                  {new Date(bp.first_defeated_at).toLocaleDateString()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BossDefeatBadges;
