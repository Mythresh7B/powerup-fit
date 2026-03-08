import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { getXPProgress, getLevel, getLevelTitle, getHP } from '@/lib/xp';
import Navbar from '@/components/Navbar';
import CharacterDisplay from '@/components/CharacterDisplay';
import StatBar from '@/components/StatBar';
import StatsBreakdownTable from '@/components/StatsBreakdownTable';
import BossDefeatBadges from '@/components/BossDefeatBadges';
import XPRing from '@/components/XPRing';
import { Progress } from '@/components/ui/progress';

interface ProfileStats {
  stat_attack: number;
  stat_defence: number;
  stat_focus: number;
  stat_agility: number;
}

interface BossProgressRecord {
  boss_index: number;
  defeated: boolean;
  first_defeated_at: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [workouts, setWorkouts] = useState<Array<{ exercise: string; total_reps: number | null; correct_reps: number | null }>>([]);
  const [stats, setStats] = useState<ProfileStats>({ stat_attack: 0, stat_defence: 0, stat_focus: 0, stat_agility: 0 });
  const [bossProgress, setBossProgress] = useState<BossProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (user.isGuest) { setLoading(false); return; }

    const fetchAll = async () => {
      const [workoutRes, profileRes, bossRes] = await Promise.all([
        supabase.from('workout_logs').select('exercise, total_reps, correct_reps').eq('user_id', user.id),
        supabase.from('profiles').select('stat_attack, stat_defence, stat_focus, stat_agility').eq('id', user.id).single(),
        supabase.from('boss_progress').select('boss_index, defeated, first_defeated_at').eq('user_id', user.id),
      ]);

      if (workoutRes.data) {
        setWorkouts(workoutRes.data);
        setTotalWorkouts(workoutRes.data.length);
      }
      if (profileRes.data) {
        setStats(profileRes.data as unknown as ProfileStats);
      }
      if (bossRes.data) {
        setBossProgress(bossRes.data as BossProgressRecord[]);
      }
      setLoading(false);
    };
    fetchAll();
  }, [user, navigate]);

  if (!user) return null;

  const currentLevel = user.level || getLevel(user.total_xp || 0);
  const xpProgress = getXPProgress(user.total_xp || 0);
  const hp = getHP(currentLevel);
  const totalReps = workouts.reduce((s, w) => s + (w.total_reps || 0), 0);
  const totalCorrect = workouts.reduce((s, w) => s + (w.correct_reps || 0), 0);
  const accuracy = totalReps > 0 ? Math.round((totalCorrect / totalReps) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 p-4 max-w-5xl mx-auto w-full space-y-6">
        {user.isGuest && (
          <div className="glass-card p-3 text-center text-xs font-mono text-warning border-warning/30">
            Sign in to save your progress permanently.
          </div>
        )}

        {/* Top: Character + Stats side by side */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Character */}
          <div className="flex-1 glass-card p-6 flex flex-col items-center justify-center">
            {loading ? (
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <CharacterDisplay level={currentLevel} username={user.username} />
            )}
          </div>

          {/* Right: Stats panel */}
          <div className="flex-1 glass-card p-6 space-y-4">
            <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">
              Character Stats
            </h3>

            {/* HP at top */}
            <StatBar icon="❤️" label="HP" value={hp} color="#EC4899" mastery={false} />

            <div className="border-t border-border/30 pt-3 space-y-3">
              <StatBar icon="⚔️" label="ATTACK" value={stats.stat_attack} color="#EF4444" mastery={stats.stat_attack >= 500} />
              <StatBar icon="🛡️" label="DEFENCE" value={stats.stat_defence} color="#3B82F6" mastery={stats.stat_defence >= 500} />
              <StatBar icon="🎯" label="FOCUS" value={stats.stat_focus} color="#8B5CF6" mastery={stats.stat_focus >= 500} />
              <StatBar icon="💨" label="AGILITY" value={stats.stat_agility} color="#10B981" mastery={stats.stat_agility >= 500} />
            </div>

            {(stats.stat_attack >= 500 || stats.stat_defence >= 500 || stats.stat_focus >= 500 || stats.stat_agility >= 500) && (
              <p className="text-xs font-mono text-warning">✨ Mastery achieved on one or more stats!</p>
            )}
          </div>
        </div>

        {/* XP Progress */}
        <div className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6">
          <XPRing totalXp={user.total_xp || 0} />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm font-mono">
              <span className="text-muted-foreground">Level {xpProgress.level} → {Math.min(xpProgress.level + 1, 20)}</span>
              <span className="text-muted-foreground">{xpProgress.xpThisLevel}/{xpProgress.xpNeeded} XP</span>
            </div>
            <Progress value={xpProgress.progress * 100} className="h-3" />
            <p className="text-xs font-mono text-muted-foreground">Total XP: {(user.total_xp || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-mono font-bold text-foreground">{totalWorkouts}</p>
            <p className="text-xs text-muted-foreground font-mono uppercase mt-1">Workouts</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-mono font-bold text-foreground">{totalReps.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground font-mono uppercase mt-1">Total Reps</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-mono font-bold text-foreground">{accuracy}%</p>
            <p className="text-xs text-muted-foreground font-mono uppercase mt-1">Accuracy</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-2xl font-mono font-bold text-foreground">🔥 {user.streak || 0}</p>
            <p className="text-xs text-muted-foreground font-mono uppercase mt-1">Streak</p>
          </div>
        </div>

        {/* Exercise breakdown */}
        <StatsBreakdownTable workouts={workouts} />

        {/* Boss defeat badges */}
        <BossDefeatBadges progress={bossProgress} />
      </div>
    </div>
  );
};

export default Profile;
