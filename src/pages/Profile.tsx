import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { getLevelProgress, LEVEL_THRESHOLDS, getLevel } from '@/lib/xp';
import Navbar from '@/components/Navbar';
import { Progress } from '@/components/ui/progress';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalReps, setTotalReps] = useState(0);
  const [totalCorrectReps, setTotalCorrectReps] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (user.isGuest) { setLoading(false); return; }

    const fetchStats = async () => {
      const { data } = await supabase
        .from('workout_logs')
        .select('total_reps, correct_reps')
        .eq('user_id', user.id);

      if (data) {
        setTotalWorkouts(data.length);
        setTotalReps(data.reduce((sum, w) => sum + (w.total_reps || 0), 0));
        setTotalCorrectReps(data.reduce((sum, w) => sum + (w.correct_reps || 0), 0));
      }
      setLoading(false);
    };
    fetchStats();
  }, [user, navigate]);

  if (!user) return null;

  const levelProgress = getLevelProgress(user.total_xp || 0);
  const currentLevel = user.level || getLevel(user.total_xp || 0);
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const xpInLevel = (user.total_xp || 0) - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const accuracy = totalReps > 0 ? Math.round((totalCorrectReps / totalReps) * 100) : 0;
  const completedLevelsCount = (() => {
    const saved = localStorage.getItem(`powerup-levels-${user.id}`);
    return saved ? JSON.parse(saved).length : 0;
  })();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">
        {/* Profile header */}
        <div className="glass-card p-8 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary mx-auto flex items-center justify-center">
            <span className="text-3xl font-display font-bold text-primary">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">{user.username}</h1>
            {user.isGuest && <span className="text-xs text-muted-foreground">(Guest)</span>}
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-primary">{currentLevel}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Level</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-accent">{(user.total_xp || 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total XP</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-foreground">🔥 {user.streak || 0}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Streak</p>
            </div>
          </div>
        </div>

        {/* Level progress */}
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Level {currentLevel} → {currentLevel + 1}</span>
            <span className="text-sm text-muted-foreground">{xpInLevel}/{xpNeeded} XP</span>
          </div>
          <Progress value={levelProgress * 100} className="h-3" />
        </div>

        {/* Stats grid */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-5 text-center">
              <p className="text-2xl font-display font-bold text-foreground">{totalWorkouts}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total Workouts</p>
            </div>
            <div className="glass-card p-5 text-center">
              <p className="text-2xl font-display font-bold text-foreground">{totalReps.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total Reps</p>
            </div>
            <div className="glass-card p-5 text-center">
              <p className="text-2xl font-display font-bold text-foreground">{accuracy}%</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Accuracy</p>
            </div>
            <div className="glass-card p-5 text-center">
              <p className="text-2xl font-display font-bold text-foreground">{completedLevelsCount}/20</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Levels Cleared</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
