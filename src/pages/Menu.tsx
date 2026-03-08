import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { useEffect } from 'react';
import GlobalHeader from '@/components/GlobalHeader';
import TechFrame from '@/components/TechFrame';
import { useBackLock } from '@/hooks/useBackLock';

const menuItems = [
  { label: '🏋️ Practice Mode', path: '/practice', description: 'Train your skills. Earn XP and build your stats.' },
  { label: '⚔️ Boss Zone', path: '/boss-zone', description: 'Take on 5 powerful bosses. Complete multi-exercise gauntlets.' },
  { label: '⚔️ Levels', path: '/levels', description: 'Battle monsters by completing rep challenges.' },
  { label: '🌐 Social Zone', path: '/social', description: 'Connect with other players. Compare stats and make friends.', badgeKey: 'pendingRequests' as const },
  { label: '🏆 Leaderboard', path: '/leaderboard', description: 'See where you rank globally and this week.' },
  { label: '👤 Profile', path: '/profile', description: 'View your character, stats, and workout history.' },
  { label: '📖 Instructions', path: '/instructions', description: 'Learn proper form for each exercise.' },
  { label: '📊 History', path: '/history', description: 'View your past workout sessions.' },
];

const Menu = () => {
  const navigate = useNavigate();
  const { user, pendingRequests } = useAuthStore();

  useBackLock();

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GlobalHeader />

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Background effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[128px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-[128px] pointer-events-none" />

        <div className="flex items-center gap-3 mb-2 relative z-10">
          <div className="w-2 h-2 bg-primary" />
          <div className="w-8 h-px bg-primary/50" />
        </div>
        <h1 className="text-5xl md:text-6xl font-mono font-extrabold tracking-tighter text-foreground mb-1 relative z-10">
          POWER<span className="gradient-text">UP</span>
        </h1>
        <p className="text-sm font-mono text-muted-foreground mb-10 tracking-wide relative z-10">
          Welcome back, <span className="text-primary">{user.username}</span>
        </p>

        <div className="grid gap-3 w-full max-w-md relative z-10">
          {menuItems.map((item, i) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="glass-card p-5 text-left hover:ring-1 hover:ring-primary/50 transition-all group animate-fade-in-up"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-mono font-semibold text-foreground group-hover:text-primary transition-colors">
                  {item.label}
                </span>
                <div className="flex items-center gap-2">
                  {'badgeKey' in item && item.badgeKey === 'pendingRequests' && pendingRequests > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-xs font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {pendingRequests}
                    </span>
                  )}
                  <span className="text-muted-foreground group-hover:text-primary transition-colors">→</span>
                </div>
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-1">{item.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Menu;
