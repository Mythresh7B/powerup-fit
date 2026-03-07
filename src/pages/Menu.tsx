import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { useEffect } from 'react';
import ProfileWidget from '@/components/ProfileWidget';
import { Button } from '@/components/ui/button';

const menuItems = [
  { label: '🏋️ Practice', path: '/practice', description: 'Free practice with AI pose tracking' },
  { label: '⚔️ Levels', path: '/levels', description: 'Battle monsters by completing rep challenges' },
  { label: '📊 History', path: '/history', description: 'View your past workout sessions' },
  { label: '🏆 Leaderboard', path: '/leaderboard', description: 'Compete with other players' },
  { label: '👤 Profile', path: '/profile', description: 'View your stats and achievements' },
];

const Menu = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Floating profile widget */}
      <ProfileWidget />

      {/* Background effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/10 blur-[128px] pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <h1 className="text-5xl md:text-6xl font-display font-extrabold gradient-text mb-2">
          PowerUp
        </h1>
        <p className="text-muted-foreground mb-10">Welcome back, {user.username}!</p>

        <div className="grid gap-3 w-full max-w-md">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="glass-card p-5 text-left hover:ring-1 hover:ring-primary/50 transition-all group"
            >
              <span className="text-lg font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                {item.label}
              </span>
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            </button>
          ))}
        </div>

        <Button variant="ghost" size="sm" className="mt-8" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Menu;
