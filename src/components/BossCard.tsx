import { BossDefinition, EXERCISE_LABELS } from '@/lib/bosses';
import { Button } from '@/components/ui/button';

interface BossCardProps {
  boss: BossDefinition;
  userLevel: number;
  defeated: boolean;
  attempts: number;
  firstDefeatedAt?: string | null;
  previousBossDefeated: boolean;
  onChallenge: () => void;
}

const BossCard = ({ boss, userLevel, defeated, attempts, firstDefeatedAt, previousBossDefeated, onChallenge }: BossCardProps) => {
  const unlocked = userLevel >= boss.levelRequired && previousBossDefeated;
  const locked = !unlocked;

  return (
    <div className={`glass-card p-5 space-y-3 transition-all ${
      defeated ? 'border-warning/40' :
      unlocked ? 'border-primary/40 hover:ring-1 hover:ring-primary/50' :
      'opacity-50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{boss.emoji}</span>
          <div>
            <h3 className="text-sm font-mono font-bold text-foreground">{boss.name}</h3>
            <span className="text-xs font-mono text-muted-foreground">
              {defeated ? '✅ Defeated' : locked ? '🔒 Locked' : '⚔️ Ready'}
            </span>
          </div>
        </div>
        <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${
          userLevel >= boss.levelRequired ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
        }`}>
          LVL {boss.levelRequired}+
        </span>
      </div>

      <p className="text-xs font-mono text-muted-foreground leading-relaxed">{boss.lore}</p>

      {/* Phases preview */}
      <div className="flex gap-1">
        {boss.phases.map((p, i) => (
          <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
            {EXERCISE_LABELS[p.exercise]?.split(' ')[0]} ×{p.repsRequired}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Boss HP</span>
          <span className="text-destructive">{boss.bossHP}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Weakness</span>
          <span className="text-accent">{boss.weakness}</span>
        </div>
      </div>

      {defeated && firstDefeatedAt && (
        <p className="text-xs font-mono text-warning">
          First defeated: {new Date(firstDefeatedAt).toLocaleDateString()}
        </p>
      )}

      {attempts > 0 && (
        <p className="text-xs font-mono text-muted-foreground">Attempts: {attempts}</p>
      )}

      {locked ? (
        <div className="text-center py-2">
          <span className="text-xs font-mono text-muted-foreground">
            {userLevel < boss.levelRequired
              ? `Reach Level ${boss.levelRequired} to unlock`
              : 'Defeat previous boss first'}
          </span>
        </div>
      ) : (
        <Button
          variant={defeated ? 'outline' : 'brand'}
          size="sm"
          className="w-full font-mono text-xs uppercase tracking-wider"
          onClick={onChallenge}
        >
          {defeated ? '🔄 Rematch' : '⚔️ Challenge'}
        </Button>
      )}
    </div>
  );
};

export default BossCard;
