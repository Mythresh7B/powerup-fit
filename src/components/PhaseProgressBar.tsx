interface PhaseProgressBarProps {
  totalPhases: number;
  currentPhase: number;
  phasesComplete: boolean[];
}

const PhaseProgressBar = ({ totalPhases, currentPhase, phasesComplete }: PhaseProgressBarProps) => {
  return (
    <div className="flex items-center gap-2 justify-center">
      {Array.from({ length: totalPhases }, (_, i) => {
        const phaseNum = i + 1;
        const isComplete = phasesComplete[i];
        const isCurrent = phaseNum === currentPhase && !isComplete;
        const isLocked = phaseNum > currentPhase && !isComplete;

        return (
          <div key={phaseNum} className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-mono font-bold transition-all ${
                isComplete
                  ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50'
                  : isCurrent
                  ? 'bg-primary/20 text-primary border-2 border-primary animate-pulse'
                  : 'bg-muted/30 text-muted-foreground border-2 border-border/30'
              }`}
            >
              {isComplete ? '✓' : phaseNum}
            </div>
            {i < totalPhases - 1 && (
              <div className={`w-8 h-0.5 ${isComplete ? 'bg-emerald-500/50' : 'bg-border/30'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PhaseProgressBar;
