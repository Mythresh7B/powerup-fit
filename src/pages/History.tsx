import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WorkoutRecord {
  id: string;
  exercise: string;
  total_reps: number;
  correct_reps: number;
  xp_earned: number;
  created_at: string;
  fatigue_score: number;
}

const History = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (user.isGuest) { setLoading(false); return; }

    const fetchWorkouts = async () => {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) console.error('Fetch workouts error:', error);
      setWorkouts((data as WorkoutRecord[]) || []);
      setLoading(false);
    };
    fetchWorkouts();
  }, [user, navigate]);

  if (!user) return null;

  const xpChartData = workouts
    .slice(0, 14)
    .reverse()
    .map((w) => ({
      date: new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      xp: w.xp_earned,
    }));

  const accuracyData = workouts
    .slice(0, 14)
    .reverse()
    .map((w) => ({
      date: new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      accuracy: w.total_reps > 0 ? Math.round((w.correct_reps / w.total_reps) * 100) : 0,
    }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        <h1 className="text-3xl font-display font-bold text-foreground">Workout History</h1>

        {user.isGuest ? (
          <div className="glass-card p-12 text-center space-y-3">
            <p className="text-lg text-muted-foreground">Sign up to save your progress</p>
            <button onClick={() => navigate('/')} className="text-primary hover:underline text-sm">
              Create an account →
            </button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : workouts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-muted-foreground">No workouts yet. Start your first session!</p>
          </div>
        ) : (
          <>
            {/* XP Chart */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">XP Earned</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={xpChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line type="monotone" dataKey="xp" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Accuracy Chart */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">Rep Accuracy %</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={accuracyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="accuracy" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Session list */}
            <div className="space-y-3">
              <h2 className="text-lg font-display font-semibold text-foreground">Sessions</h2>
              {workouts.map((w) => (
                <div key={w.id} className="glass-card p-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-foreground capitalize">{w.exercise.replace('_', ' ')}</span>
                    <p className="text-sm text-muted-foreground">
                      {w.correct_reps}/{w.total_reps} reps · {new Date(w.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-accent">+{w.xp_earned} XP</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default History;
