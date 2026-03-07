import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Practice', path: '/practice' },
  { label: 'Levels', path: '/levels' },
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
      <Link to="/menu" className="font-display font-bold text-xl gradient-text">
        PowerUp
      </Link>
      <div className="flex items-center gap-1">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant={location.pathname === item.path ? 'pill-active' : 'pill'}
              size="sm"
            >
              {item.label}
            </Button>
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {user?.username}
        </span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
