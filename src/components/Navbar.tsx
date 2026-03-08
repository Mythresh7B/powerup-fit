import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Practice', path: '/practice' },
  { label: 'Levels', path: '/levels' },
  { label: 'Instructions', path: '/instructions' },
  { label: 'History', path: '/history' },
  { label: 'Leaderboard', path: '/leaderboard' },
  { label: 'Profile', path: '/profile' },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    if (!user?.isGuest) {
      await supabase.auth.signOut();
    }
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-border/50 px-4 py-3 flex items-center justify-between">
      <Link to="/menu" className="font-mono font-bold text-xl tracking-tighter text-foreground">
        POWER<span className="gradient-text">UP</span>
      </Link>
      <div className="flex items-center gap-1 overflow-x-auto">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant={location.pathname === item.path ? 'pill-active' : 'pill'}
              size="sm"
              className="font-mono text-xs"
            >
              {item.label}
            </Button>
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
          {user?.username}
        </span>
        <Button variant="ghost" size="sm" className="font-mono text-xs" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
