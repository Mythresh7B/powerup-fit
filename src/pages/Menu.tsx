import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { useEffect } from 'react';
import ProfileWidget from '@/components/ProfileWidget';
import { Button } from '@/components/ui/button';
import TechFrame from '@/components/TechFrame';

const menuItems = [
  { label: '🏋️ Practice', path: '/practice', description: 'Free practice with AI pose tracking' },
  { label: '⚔️ Levels', path: '/levels', description: 'Battle monsters by completing rep challenges' },
  { label: '🗡️ Boss Zone', path: '/boss-zone', description: 'Fight legendary bosses with your character stats' },
  { label: '📖 Instructions', path: '/instructions', description: 'Learn proper form for each exercise' },
  { label: '📊 History', path: '/history', description: 'View your past workout sessions' },
  { label: '🏆 Leaderboard', path: '/leaderboard', description: 'Compete with other players' },
  { label: '👤 Profile', path: '/profile', description: 'View your RPG character sheet & stats' },
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
    <TechFrame>
      {/* Floating profile widget */}
      <ProfileWidget />

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {/* Background effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[128px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-[128px] pointer-events-none" />

        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 bg-primary" />
          <div className="w-8 h-px bg-primary/50" />
        </div>
        <h1 className="text-5xl md:text-6xl font-mono font-extrabold tracking-tighter text-foreground mb-1">
          POWER<span className="gradient-text">UP</span>
        </h1>
        <p className="text-sm font-mono text-muted-foreground mb-10 tracking-wide">
          Welcome back, <span className="text-primary">{user.username}</span>
        </p>

        <div className="grid gap-3 w-full max-w-md">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="glass-card p-5 text-left hover:ring-1 hover:ring-primary/50 transition-all group"
            >
              <span className="text-lg font-mono font-semibold text-foreground group-hover:text-primary transition-colors">
                {item.label}
              </span>
              <p className="text-xs font-mono text-muted-foreground mt-1">{item.description}</p>
            </button>
          ))}
        </div>

        <Button variant="ghost" size="sm" className="mt-8 font-mono" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </TechFrame>
  );
};

export default Menu;
