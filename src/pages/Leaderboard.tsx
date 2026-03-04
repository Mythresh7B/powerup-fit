import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  username: string;
  level: number;
  total_xp: number;
  streak: number;
}

const MOCK_DATA: LeaderboardEntry[] = [
  { username: 'FitnessPro', level: 8, total_xp: 5200, streak: 14 },
  { username: 'IronWill', level: 6, total_xp: 3100, streak: 7 },
  { username: 'FlexMaster', level: 5, total_xp: 1800, streak: 21 },
  { username: 'RepQueen', level: 4, total_xp: 1200, streak: 5 },
  { username: 'GymRat', level: 3, total_xp: 600, streak: 3 },
];

const medals = ['🥇', '🥈', '🥉'];

const Leaderboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/'); return; }

    if (user.isGuest) {
      setEntries(MOCK_DATA);
      setLoading(false);
      return;
    }

    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from('profiles' as any)
        .select('username, level, total_xp, streak')
        .order('total_xp', { ascending: false })
        .limit(100);
      setEntries((data as any as LeaderboardEntry[]) || []);
      setLoading(false);
    };
    fetchLeaderboard();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-6">
        <h1 className="text-3xl font-display font-bold text-foreground">Leaderboard</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <div
                key={entry.username}
                className={cn(
                  "glass-card p-4 flex items-center gap-4 transition-all",
                  entry.username === user.username && "ring-1 ring-primary/50 glow-primary"
                )}
              >
                <span className="w-10 text-center text-lg font-bold">
                  {i < 3 ? medals[i] : <span className="text-muted-foreground">{i + 1}</span>}
                </span>
                <div className="flex-1">
                  <span className="font-medium text-foreground">{entry.username}</span>
                  <p className="text-sm text-muted-foreground">
                    Level {entry.level} · 🔥 {entry.streak} day streak
                  </p>
                </div>
                <span className="font-display font-bold text-accent">{entry.total_xp.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
