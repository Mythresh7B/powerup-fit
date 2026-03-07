import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useSessionStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { calculateXP, getLevel } from '@/lib/xp';
import type { Exercise } from '@/lib/pose';
import Navbar from '@/components/Navbar';
import PoseCamera from '@/components/PoseCamera';
import RepCounterDisplay from '@/components/RepCounter';
import FatigueBar from '@/components/FatigueBar';
import XPRing from '@/components/XPRing';
import PostureAlert from '@/components/PostureAlert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const exercises: { label: string; value: Exercise }[] = [
  { label: '💪 Bicep Curl', value: 'bicep_curl' },
  { label: '🏋️ Shoulder Press', value: 'shoulder_press' },
  { label: '🦵 Squat', value: 'squat' },
  { label: '🧘 Plank', value: 'plank' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const session = useSessionStore();
  const sessionStartRef = useRef<number>(0);

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  if (!user) return null;

  const handleStartSession = () => {
    session.startSession();
    sessionStartRef.current = Date.now();
    toast.info('Session started! Get into position.');
  };

  const handleEndSession = async () => {
    session.endSession();
    const accuracy = session.repCount > 0 ? session.correctReps / session.repCount : 0;
    const xpEarned = calculateXP(session.correctReps, accuracy, session.fatigueIndex, user.streak);
    const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);

    if (!user.isGuest) {
      try {
        // Insert workout log
        await supabase.from('workout_logs').insert({
          user_id: user.id,
          exercise: session.exercise,
          duration_seconds: durationSeconds,
          total_reps: session.repCount,
          correct_reps: session.correctReps,
          xp_earned: xpEarned,
          fatigue_score: session.fatigueIndex,
        });

        // Update profile XP and level
        const newTotalXp = (user.total_xp || 0) + xpEarned;
        const newLevel = getLevel(newTotalXp);

        await supabase.from('profiles').update({
          total_xp: newTotalXp,
          level: newLevel,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id);

        setUser({ ...user, total_xp: newTotalXp, level: newLevel });
      } catch (err) {
        console.error('Save error:', err);
      }
    } else {
      const newTotalXp = (user.total_xp || 0) + xpEarned;
      setUser({ ...user, total_xp: newTotalXp, level: getLevel(newTotalXp) });
    }

    toast.success(`Session complete! +${xpEarned} XP earned 🎉`);
    session.resetSession();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Camera panel */}
        <div className="flex-[2] min-h-[400px] lg:min-h-0">
          <PoseCamera />
        </div>

        {/* HUD panel */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Exercise selector */}
          <div className="glass-card p-4">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 block">
              Exercise
            </span>
            <div className="flex flex-wrap gap-2">
              {exercises.map((ex) => (
                <Button
                  key={ex.value}
                  variant={session.exercise === ex.value ? 'pill-active' : 'pill'}
                  size="sm"
                  onClick={() => !session.isActive && session.setExercise(ex.value)}
                  disabled={session.isActive}
                >
                  {ex.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Rep counter + target */}
          <div className="glass-card p-6 flex flex-col items-center">
            <RepCounterDisplay />
            {!session.isActive && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Target:</span>
                <Input
                  type="number"
                  value={session.targetReps}
                  onChange={(e) => session.setTargetReps(Number(e.target.value))}
                  className="w-20 text-center"
                  min={1}
                  max={100}
                />
              </div>
            )}
          </div>

          {/* Fatigue + Posture */}
          <div className="glass-card p-4 space-y-4">
            <FatigueBar score={session.fatigueIndex} />
            <PostureAlert posture={session.postureLabel} />
          </div>

          {/* XP Ring */}
          <div className="glass-card p-4 flex justify-center">
            <XPRing totalXp={user.total_xp} sessionXp={session.xp} />
          </div>

          {/* Level display */}
          <div className="glass-card p-3 text-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Level</span>
            <p className="text-2xl font-bold text-primary">{user.level}</p>
            <p className="text-xs text-muted-foreground">{user.total_xp} XP total</p>
          </div>

          {/* Start/End button */}
          <Button
            variant={session.isActive ? 'destructive' : 'brand'}
            size="lg"
            className="w-full"
            onClick={session.isActive ? handleEndSession : handleStartSession}
          >
            {session.isActive ? '⏹ End Session' : '▶ Start Session'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
