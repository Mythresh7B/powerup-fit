import { useEffect, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useSessionStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { calculateXP, getLevel } from '@/lib/xp';
import type { Exercise } from '@/lib/pose';
import GlobalHeader from '@/components/GlobalHeader';
import PoseCamera from '@/components/PoseCamera';
import RepCounterDisplay from '@/components/RepCounter';
import FatigueBar from '@/components/FatigueBar';
import XPRing from '@/components/XPRing';
import PostureAlert from '@/components/PostureAlert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useBackLock } from '@/hooks/useBackLock';

const exercises: { label: string; value: Exercise }[] = [
  { label: '💪 Bicep Curl', value: 'bicep_curl' },
  { label: '🏋️ Shoulder Press', value: 'shoulder_press' },
  { label: '🦵 Squat', value: 'squat' },
  { label: '🧘 Plank', value: 'plank' },
];

/* ── Isolated sub-components that subscribe to only what they need ── */

const PostureAlertConnected = memo(() => {
  const posture = useSessionStore((s) => s.postureLabel);
  return <PostureAlert posture={posture} />;
});
PostureAlertConnected.displayName = 'PostureAlertConnected';

const FatigueBarConnected = memo(() => {
  const score = useSessionStore((s) => s.fatigueIndex);
  return <FatigueBar score={score} />;
});
FatigueBarConnected.displayName = 'FatigueBarConnected';

const XPRingConnected = memo(() => {
  const totalXp = useAuthStore((s) => s.user?.total_xp ?? 0);
  const sessionXp = useSessionStore((s) => s.xp);
  return <XPRing totalXp={totalXp} sessionXp={sessionXp} />;
});
XPRingConnected.displayName = 'XPRingConnected';

const ExercisePicker = memo(() => {
  const exercise = useSessionStore((s) => s.exercise);
  const isActive = useSessionStore((s) => s.isActive);
  const setExercise = useSessionStore((s) => s.setExercise);

  return (
    <div className="glass-card p-4">
      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 block">Exercise</span>
      <div className="flex flex-wrap gap-2">
        {exercises.map((ex) => (
          <Button
            key={ex.value}
            variant={exercise === ex.value ? 'pill-active' : 'pill'}
            size="sm"
            onClick={() => !isActive && setExercise(ex.value)}
            disabled={isActive}
          >
            {ex.label}
          </Button>
        ))}
      </div>
    </div>
  );
});
ExercisePicker.displayName = 'ExercisePicker';

const TargetRepsInput = memo(() => {
  const isActive = useSessionStore((s) => s.isActive);
  const targetReps = useSessionStore((s) => s.targetReps);
  const setTargetReps = useSessionStore((s) => s.setTargetReps);

  if (isActive) return null;

  return (
    <div className="mt-4 flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Target:</span>
      <Input
        type="number"
        value={targetReps}
        onChange={(e) => setTargetReps(Number(e.target.value))}
        className="w-20 text-center"
        min={1}
        max={100}
      />
    </div>
  );
});
TargetRepsInput.displayName = 'TargetRepsInput';

/* ── Main Dashboard ── */

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const isActive = useSessionStore((s) => s.isActive);
  const sessionStartRef = useRef<number>(0);

  useBackLock();

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  if (!user) return null;

  const handleStartSession = () => {
    useSessionStore.getState().startSession();
    sessionStartRef.current = Date.now();
    toast.info('Session started! Get into position.');
  };

  const handleEndSession = async () => {
    // Snapshot values before resetting
    const { exercise, repCount, correctReps, fatigueIndex } = useSessionStore.getState();
    useSessionStore.getState().endSession();
    const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);

    if (!user.isGuest) {
      try {
        const { data, error } = await supabase.functions.invoke('complete-workout', {
          body: {
            exercise,
            total_reps: repCount,
            correct_reps: correctReps,
            fatigue_score: fatigueIndex,
            duration_seconds: durationSeconds,
          },
        });

        if (error) {
          console.error('Complete workout error:', error);
          toast.error('Failed to save workout');
        } else {
          setUser({ ...user, total_xp: data.total_xp, level: data.level });
          toast.success(`Session complete! +${data.xp_earned} XP earned 🎉`);
        }
      } catch (err) {
        console.error('Save error:', err);
        toast.error('Failed to save workout');
      }
    } else {
      const accuracy = repCount > 0 ? correctReps / repCount : 0;
      const xpEarned = calculateXP(correctReps, accuracy, fatigueIndex, user.streak);
      const newTotalXp = (user.total_xp || 0) + xpEarned;
      setUser({ ...user, total_xp: newTotalXp, level: getLevel(newTotalXp) });
      toast.success(`Session complete! +${xpEarned} XP earned 🎉`);
    }

    useSessionStore.getState().resetSession();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalHeader />
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        <div className="flex-[2] min-h-[400px] lg:min-h-0">
          <PoseCamera />
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <ExercisePicker />

          <div className="glass-card p-6 flex flex-col items-center">
            <RepCounterDisplay />
            <TargetRepsInput />
          </div>

          <div className="glass-card p-4 space-y-4">
            <FatigueBarConnected />
            <PostureAlertConnected />
          </div>

          <div className="glass-card p-4 flex justify-center">
            <XPRingConnected />
          </div>

          <Button
            variant={isActive ? 'destructive' : 'brand'}
            size="lg"
            className="w-full"
            onClick={isActive ? handleEndSession : handleStartSession}
          >
            {isActive ? '⏹ End Session' : '▶ Start Session'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
