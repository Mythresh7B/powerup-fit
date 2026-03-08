import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { getXPProgress, getLevel, getLevelTitle, getHP } from '@/lib/xp';
import GlobalHeader from '@/components/GlobalHeader';
import CharacterViewer from '@/components/CharacterViewer';
import StatBar from '@/components/StatBar';
import StatsBreakdownTable from '@/components/StatsBreakdownTable';
import BossDefeatBadges from '@/components/BossDefeatBadges';
import XPRing from '@/components/XPRing';
import AvatarCircle from '@/components/AvatarCircle';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBackLock } from '@/hooks/useBackLock';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ProfileStats {
  stat_attack: number;
  stat_defence: number;
  stat_focus: number;
  stat_agility: number;
  bio: string | null;
  avatar_url: string | null;
  last_username_change: string | null;
}

interface BossProgressRecord {
  boss_index: number;
  defeated: boolean;
  attempts: number;
  first_defeated_at: string | null;
}

interface WorkoutRecord {
  exercise: string;
  total_reps: number | null;
  correct_reps: number | null;
  xp_earned: number | null;
  created_at: string | null;
}

const DONUT_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#8B5CF6'];

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser, updateAvatar, updateBio, updateUsername } = useAuthStore();
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [stats, setStats] = useState<ProfileStats>({ stat_attack: 0, stat_defence: 0, stat_focus: 0, stat_agility: 0, bio: null, avatar_url: null, last_username_change: null });
  const [bossProgress, setBossProgress] = useState<BossProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'history' | 'breakdown' | 'bosses'>('history');
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useBackLock();

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (user.isGuest) { setLoading(false); return; }

    const fetchAll = async () => {
      const [workoutRes, profileRes, bossRes] = await Promise.all([
        supabase.from('workout_logs').select('exercise, total_reps, correct_reps, xp_earned, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('stat_attack, stat_defence, stat_focus, stat_agility, bio, avatar_url, last_username_change').eq('id', user.id).single(),
        supabase.from('boss_progress').select('boss_index, defeated, attempts, first_defeated_at').eq('user_id', user.id),
      ]);
      if (workoutRes.data) setWorkouts(workoutRes.data as unknown as WorkoutRecord[]);
      if (profileRes.data) setStats(profileRes.data as unknown as ProfileStats);
      if (bossRes.data) setBossProgress(bossRes.data as BossProgressRecord[]);
      setLoading(false);
    };
    fetchAll();
  }, [user, navigate]);

  // Username check
  useEffect(() => {
    if (!user || !editingUsername || newUsername.length < 3) { setUsernameAvailable(null); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('id').ilike('username', newUsername).neq('id', user.id).limit(1);
      setUsernameAvailable(!data || data.length === 0);
    }, 500);
    return () => clearTimeout(timer);
  }, [newUsername, editingUsername, user]);

  if (!user) return null;

  const currentLevel = user.level || getLevel(user.total_xp || 0);
  const xpProgress = getXPProgress(user.total_xp || 0);
  const hp = getHP(currentLevel);
  const title = getLevelTitle(currentLevel);
  const totalPower = (stats.stat_attack || 0) + (stats.stat_defence || 0) + (stats.stat_focus || 0) + (stats.stat_agility || 0);

  const handleSaveUsername = async () => {
    if (!usernameAvailable || !newUsername.match(/^[a-zA-Z0-9_]{3,20}$/)) {
      toast.error('Invalid username');
      return;
    }
    if (stats.last_username_change) {
      const daysSince = (Date.now() - new Date(stats.last_username_change).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) {
        toast.error(`Username can be changed in ${Math.ceil(30 - daysSince)} days`);
        return;
      }
    }
    const { error } = await supabase.from('profiles').update({
      username: newUsername,
      last_username_change: new Date().toISOString(),
    }).eq('id', user!.id);
    if (error) {
      toast.error('Failed to update username');
    } else {
      updateUsername(newUsername);
      setEditingUsername(false);
      toast.success('Username updated!');
    }
  };

  const handleSaveBio = async () => {
    const trimmed = newBio.trim().slice(0, 100);
    const { error } = await supabase.from('profiles').update({ bio: trimmed }).eq('id', user!.id);
    if (error) {
      toast.error('Failed to update bio');
    } else {
      updateBio(trimmed);
      setStats(s => ({ ...s, bio: trimmed }));
      setEditingBio(false);
      toast.success('Bio updated!');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Only JPG, PNG, WebP'); return; }

    const filePath = `${user!.id}/avatar.jpg`;
    const { error: uploadErr } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadErr) { toast.error('Upload failed'); return; }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl + '?t=' + Date.now();

    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user!.id);
    updateAvatar(publicUrl);
    setStats(s => ({ ...s, avatar_url: publicUrl }));
    toast.success('Avatar updated!');
  };

  // Chart data
  const xpChartData = workouts.slice(0, 10).reverse().map(w => ({
    date: w.created_at ? new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
    xp: w.xp_earned || 0,
  }));

  const exerciseCounts: Record<string, number> = {};
  workouts.forEach(w => { exerciseCounts[w.exercise] = (exerciseCounts[w.exercise] || 0) + (w.total_reps || 0); });
  const donutData = Object.entries(exerciseCounts).map(([name, value]) => ({ name, value }));

  const tabs = [
    { key: 'history' as const, label: 'History' },
    { key: 'breakdown' as const, label: 'Breakdown' },
    { key: 'bosses' as const, label: 'Boss Progress' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalHeader />
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />

      <div className="flex-1 p-4 max-w-5xl mx-auto w-full space-y-6">
        {user.isGuest && (
          <div className="glass-card p-3 text-center text-xs font-mono text-warning border-warning/30">
            Sign in to save your progress permanently.
          </div>
        )}

        {/* Hero Card */}
        <div className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6">
          <AvatarCircle
            avatarUrl={user.avatar_url || stats.avatar_url}
            username={user.username}
            size={120}
            level={currentLevel}
            showUploadHint={!user.isGuest}
            onClick={() => !user.isGuest && fileInputRef.current?.click()}
          />
          <div className="flex-1 space-y-2 text-center sm:text-left">
            {editingUsername ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="font-mono max-w-[200px]"
                  maxLength={20}
                />
                {usernameAvailable === true && <span className="text-emerald-400 text-sm">✓</span>}
                {usernameAvailable === false && <span className="text-destructive text-sm">✗</span>}
                <Button size="sm" variant="brand" onClick={handleSaveUsername}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingUsername(false)}>Cancel</Button>
              </div>
            ) : (
              <h2 className="text-xl font-mono font-bold text-foreground group cursor-pointer" onClick={() => { setEditingUsername(true); setNewUsername(user.username); }}>
                {user.username} <span className="text-muted-foreground opacity-0 group-hover:opacity-100 text-sm">✏️</span>
              </h2>
            )}

            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className={`inline-block px-3 py-1 rounded-md text-xs font-mono font-bold tracking-wider uppercase ${
                currentLevel >= 20 ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'
              }`}>
                LEVEL {currentLevel}
              </span>
              <span className="text-sm font-mono text-muted-foreground">{title}</span>
            </div>

            {editingBio ? (
              <div className="space-y-1">
                <textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value.slice(0, 100))}
                  className="w-full bg-secondary rounded-md p-2 text-sm font-mono text-foreground resize-none"
                  rows={2}
                  maxLength={100}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveBio(); } }}
                  onBlur={handleSaveBio}
                  autoFocus
                />
                <span className="text-[10px] font-mono text-muted-foreground">{newBio.length}/100</span>
              </div>
            ) : (
              <p
                className="text-xs font-mono text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => { setEditingBio(true); setNewBio(stats.bio || ''); }}
              >
                {stats.bio || 'Click to add a bio...'}
              </p>
            )}
          </div>
        </div>

        {/* Character + Stats */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 glass-card p-6 flex flex-col items-center justify-center">
            {loading ? (
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CharacterDisplay level={currentLevel} username={user.username} />
                <div className="mt-4">
                  <XPRing totalXp={user.total_xp || 0} />
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-2">
                  {xpProgress.level < 20 ? `${xpProgress.xpNeeded - xpProgress.xpThisLevel} XP to next level` : 'Max level reached!'}
                </p>
              </>
            )}
          </div>

          <div className="flex-1 glass-card p-6 space-y-4">
            <h3 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              ⚔️ Character Stats
            </h3>
            <StatBar icon="❤️" label="HP" value={hp} color="#EC4899" mastery={false} />
            <div className="border-t border-border/30 pt-3 space-y-3">
              <StatBar icon="⚔️" label="ATTACK" value={stats.stat_attack} color="#EF4444" mastery={stats.stat_attack >= 500} />
              <StatBar icon="🛡️" label="DEFENCE" value={stats.stat_defence} color="#3B82F6" mastery={stats.stat_defence >= 500} />
              <StatBar icon="🎯" label="FOCUS" value={stats.stat_focus} color="#8B5CF6" mastery={stats.stat_focus >= 500} />
              <StatBar icon="💨" label="AGILITY" value={stats.stat_agility} color="#10B981" mastery={stats.stat_agility >= 500} />
            </div>
            <p className="text-xs font-mono text-muted-foreground">Total Power: {totalPower.toLocaleString()}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary rounded-lg">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-sm font-mono rounded-md transition-all ${
                tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'history' && (
          <div className="space-y-4">
            {xpChartData.length > 0 && (
              <div className="glass-card p-6">
                <h4 className="text-sm font-mono font-bold text-foreground mb-3">XP Per Session</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={xpChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="xp" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="space-y-2">
              {workouts.slice(0, 10).map((w, i) => (
                <div key={i} className="glass-card p-4 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm text-foreground capitalize">{w.exercise.replace('_', ' ')}</span>
                    <p className="text-xs font-mono text-muted-foreground">
                      {w.correct_reps}/{w.total_reps} reps · {w.created_at ? new Date(w.created_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <span className="text-sm font-mono font-bold text-accent">+{w.xp_earned || 0} XP</span>
                </div>
              ))}
              {workouts.length === 0 && (
                <p className="text-sm font-mono text-muted-foreground text-center py-4">No workouts yet</p>
              )}
            </div>
          </div>
        )}

        {tab === 'breakdown' && (
          <div className="space-y-4">
            <StatsBreakdownTable workouts={workouts} />
            {donutData.length > 0 && (
              <div className="glass-card p-6">
                <h4 className="text-sm font-mono font-bold text-foreground mb-3">Rep Distribution</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name.replace('_', ' ')} (${value})`}>
                      {donutData.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {tab === 'bosses' && (
          <div className="space-y-4">
            <BossDefeatBadges progress={bossProgress} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bossProgress.map(bp => (
                <div key={bp.boss_index} className="glass-card p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono font-bold text-foreground">Boss {bp.boss_index}</span>
                    <span className={`text-xs font-mono ${bp.defeated ? 'text-warning' : 'text-muted-foreground'}`}>
                      {bp.defeated ? '✅ Defeated' : '❌ Not yet'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">Attempts: {bp.attempts}</p>
                  {bp.first_defeated_at && (
                    <p className="text-xs font-mono text-muted-foreground">
                      Defeated: {new Date(bp.first_defeated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
