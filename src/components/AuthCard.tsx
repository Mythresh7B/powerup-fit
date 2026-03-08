import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DotLoader } from '@/components/ui/dot-loader';

const loaderFrames = [
  [14, 7, 0, 8, 6, 13, 20], [14, 7, 13, 20, 16, 27, 21],
  [14, 20, 27, 21, 34, 24, 28], [27, 21, 34, 28, 41, 32, 35],
  [34, 28, 41, 35, 48, 40, 42], [34, 28, 41, 35, 48, 42, 46],
  [34, 28, 41, 35, 48, 42, 38], [34, 28, 41, 35, 48, 30, 21],
  [34, 28, 41, 48, 21, 22, 14], [34, 28, 41, 21, 14, 16, 27],
  [34, 28, 21, 14, 10, 20, 27], [28, 21, 14, 4, 13, 20, 27],
  [28, 21, 14, 12, 6, 13, 20], [28, 21, 14, 6, 13, 20, 11],
  [28, 21, 14, 6, 13, 20, 10], [14, 6, 13, 20, 9, 7, 21],
];

const AuthCard = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setGuest } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (data.user) {
          // Profile is auto-created by trigger, but also try manual insert
          await supabase.from('profiles').upsert({
            id: data.user.id,
            username,
          } as any);

          // If email confirmation is required, Supabase returns identities=[] or email_confirmed_at=null
          if (!data.user.email_confirmed_at && data.user.identities?.length === 0) {
            toast.error('An account with this email already exists.');
          } else if (!data.session) {
            // Email confirmation required — redirect to verify page
            sessionStorage.setItem('verify_email', email);
            navigate(`/verify-email?email=${encodeURIComponent(email)}`);
          } else {
            // Auto-confirmed (e.g. if confirm email is disabled in Supabase)
            setUser({
              id: data.user.id,
              username,
              level: 1,
              total_xp: 0,
              streak: 0,
            });
            toast.success('Account created! Welcome to PowerUp.');
            navigate('/menu');
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();
          if (profile) {
            setUser({
              id: data.user.id,
              username: (profile as any).username || 'User',
              level: (profile as any).level || 1,
              total_xp: (profile as any).total_xp || 0,
              streak: (profile as any).streak || 0,
              stat_attack: (profile as any).stat_attack || 0,
              stat_defence: (profile as any).stat_defence || 0,
              stat_focus: (profile as any).stat_focus || 0,
              stat_agility: (profile as any).stat_agility || 0,
              avatar_url: (profile as any).avatar_url || null,
              bio: (profile as any).bio || null,
            });
          }
          toast.success('Welcome back!');
          navigate('/menu');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    setGuest();
    navigate('/menu');
  };

  return (
    <div className="glass-card p-8 w-full max-w-md animate-fade-in-up">
      <div className="flex gap-1 mb-6 p-1 bg-secondary rounded-lg">
        <button onClick={() => setMode('login')}
          className={`flex-1 py-2 text-sm font-mono font-medium rounded-md transition-all ${mode === 'login' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
          Sign In
        </button>
        <button onClick={() => setMode('register')}
          className={`flex-1 py-2 text-sm font-mono font-medium rounded-md transition-all ${mode === 'register' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div className="space-y-2">
            <Label htmlFor="username" className="font-mono text-xs uppercase tracking-wider">Username</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="powerlifter99" className="font-mono" required />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wider">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="font-mono" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wider">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="font-mono" required minLength={6} />
        </div>
        <Button type="submit" variant="brand" size="lg" className="w-full font-mono uppercase tracking-wider" disabled={loading}>
          {loading ? (
            <div className="flex items-center gap-3">
              <DotLoader frames={loaderFrames} className="w-8 h-8" />
              <span>Loading...</span>
            </div>
          ) : mode === 'login' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <button onClick={handleGuest} className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors">
          Try as Guest →
        </button>
      </div>
    </div>
  );
};

export default AuthCard;
