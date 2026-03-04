import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles' as any).insert({
            id: data.user.id,
            username,
          });
          setUser({
            id: data.user.id,
            username,
            level: 1,
            total_xp: 0,
            streak: 0,
          });
          toast.success('Account created! Welcome to PowerUp.');
          navigate('/dashboard');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles' as any)
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
            });
          }
          toast.success('Welcome back!');
          navigate('/dashboard');
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
    navigate('/dashboard');
  };

  return (
    <div className="glass-card p-8 w-full max-w-md animate-fade-in-up">
      <div className="flex gap-1 mb-6 p-1 bg-secondary rounded-lg">
        <button
          onClick={() => setMode('login')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            mode === 'login' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setMode('register')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            mode === 'register' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="powerlifter99"
              required
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>
        <Button type="submit" variant="brand" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={handleGuest}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Try as Guest →
        </button>
      </div>
    </div>
  );
};

export default AuthCard;
