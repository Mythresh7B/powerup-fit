import { useSessionStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const RepCounterDisplay = () => {
  const { repCount, targetReps } = useSessionStore();

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Reps</span>
      <div className="relative">
        <span
          key={repCount}
          className={cn(
            "text-7xl font-display font-bold text-foreground tabular-nums",
            repCount > 0 && "rep-pop"
          )}
        >
          {repCount}
        </span>
      </div>
      <span className="text-sm text-muted-foreground">/ {targetReps} target</span>
    </div>
  );
};

export default RepCounterDisplay;
