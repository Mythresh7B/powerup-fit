interface ExerciseBreakdown {
  exercise: string;
  label: string;
  icon: string;
  totalReps: number;
  correctReps: number;
  accuracy: number;
  statGained: string;
}

interface StatsBreakdownTableProps {
  workouts: Array<{
    exercise: string;
    total_reps: number | null;
    correct_reps: number | null;
  }>;
}

const EXERCISE_META: Record<string, { label: string; icon: string; stat: string; multiplier: number }> = {
  bicep_curl: { label: 'Bicep Curl', icon: '⚔️', stat: 'ATK', multiplier: 2 },
  shoulder_press: { label: 'Shoulder Press', icon: '🛡️', stat: 'DEF', multiplier: 2 },
  squat: { label: 'Squat', icon: '💨', stat: 'AGI', multiplier: 2 },
  plank: { label: 'Plank', icon: '🎯', stat: 'FOC', multiplier: 3 },
};

const StatsBreakdownTable = ({ workouts }: StatsBreakdownTableProps) => {
  const grouped: Record<string, { totalReps: number; correctReps: number }> = {};

  workouts.forEach(w => {
    if (!grouped[w.exercise]) grouped[w.exercise] = { totalReps: 0, correctReps: 0 };
    grouped[w.exercise].totalReps += w.total_reps || 0;
    grouped[w.exercise].correctReps += w.correct_reps || 0;
  });

  const rows: ExerciseBreakdown[] = Object.entries(EXERCISE_META).map(([key, meta]) => {
    const data = grouped[key] || { totalReps: 0, correctReps: 0 };
    return {
      exercise: key,
      label: meta.label,
      icon: meta.icon,
      totalReps: data.totalReps,
      correctReps: data.correctReps,
      accuracy: data.totalReps > 0 ? Math.round((data.correctReps / data.totalReps) * 1000) / 10 : 0,
      statGained: `+${data.correctReps * meta.multiplier} ${meta.stat}`,
    };
  });

  return (
    <div className="glass-card p-4 overflow-x-auto">
      <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider mb-3">
        Exercise Breakdown
      </h3>
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="text-muted-foreground border-b border-border/50">
            <th className="text-left py-2 pr-3">Exercise</th>
            <th className="text-right py-2 px-2">Total</th>
            <th className="text-right py-2 px-2">Correct</th>
            <th className="text-right py-2 px-2">Accuracy</th>
            <th className="text-right py-2 pl-2">Stat Gained</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.exercise} className="border-b border-border/20">
              <td className="py-2 pr-3 text-foreground">{row.icon} {row.label}</td>
              <td className="py-2 px-2 text-right text-foreground">{row.totalReps}</td>
              <td className="py-2 px-2 text-right text-foreground">{row.correctReps}</td>
              <td className="py-2 px-2 text-right text-foreground">{row.accuracy}%</td>
              <td className="py-2 pl-2 text-right text-accent font-bold">{row.statGained}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StatsBreakdownTable;
