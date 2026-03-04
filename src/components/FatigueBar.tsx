import { cn } from '@/lib/utils';

interface FatigueBarProps {
  score: number; // 0 to 1
}

const FatigueBar = ({ score }: FatigueBarProps) => {
  const percentage = Math.round(score * 100);
  const getColor = () => {
    if (score < 0.3) return 'bg-success';
    if (score < 0.6) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Fatigue</span>
        <span className={cn(
          "text-sm font-semibold",
          score < 0.3 ? "text-success" : score < 0.6 ? "text-warning" : "text-destructive"
        )}>
          {percentage}%
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default FatigueBar;
