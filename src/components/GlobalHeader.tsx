import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { getLevelTitle, getLevel } from '@/lib/xp';
import AvatarCircle from './AvatarCircle';

const GlobalHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    if (!user?.isGuest) {
      await supabase.auth.signOut();
    }
    logout();
    navigate('/');
  };

  const handleMenu = () => {
    setOpen(false);
    if (location.pathname !== '/menu') {
      navigate('/menu');
    }
  };

  if (!user) return null;

  const level = user.level || getLevel(user.total_xp || 0);
  const title = getLevelTitle(level);
  const isOnMenu = location.pathname === '/menu';

  return (
    <div className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 glass-card border-b border-border/50">
      <span className="font-mono font-bold text-xl tracking-tighter text-foreground">
        POWER<span className="gradient-text">UP</span>
      </span>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary/30 transition-all p-0.5"
        >
          <AvatarCircle
            avatarUrl={user.avatar_url || null}
            username={user.username}
            size={36}
            level={level}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-12 w-64 glass-card border border-border/50 rounded-lg overflow-hidden animate-fade-in-up z-[60]"
            style={{ animationDuration: '150ms' }}
          >
            <div className="p-4 flex items-center gap-3 border-b border-border/30">
              <AvatarCircle
                avatarUrl={user.avatar_url || null}
                username={user.username}
                size={48}
                level={level}
              />
              <div>
                <p className="text-sm font-mono font-bold text-foreground">{user.username}</p>
                <p className="text-xs font-mono text-muted-foreground">
                  Level {level} · {title}
                </p>
              </div>
            </div>

            <button
              onClick={handleMenu}
              disabled={isOnMenu}
              className={`w-full px-4 py-3 text-left text-sm font-mono flex items-center gap-3 transition-colors ${
                isOnMenu
                  ? 'text-muted-foreground/50 cursor-not-allowed'
                  : 'text-foreground hover:bg-secondary'
              }`}
            >
              📋 Menu
            </button>

            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-sm font-mono flex items-center gap-3 text-destructive hover:bg-secondary transition-colors border-t border-border/30"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalHeader;
