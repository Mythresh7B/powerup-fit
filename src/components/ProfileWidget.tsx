import { useAuthStore } from '@/lib/store';
import { getLevelProgress } from '@/lib/xp';
import { useNavigate } from 'react-router-dom';

const ProfileWidget = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null;

  const progress = getLevelProgress(user.total_xp || 0) * 100;

  return (
    <button
      onClick={() => navigate('/profile')}
      className="fixed top-12 right-4 z-50 glass-card px-4 py-2 flex items-center gap-3 hover:ring-1 hover:ring-primary/50 transition-all"
    >
      <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary flex items-center justify-center">
        <span className="text-sm font-mono font-bold text-primary">
          {user.username.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="text-left">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-foreground">{user.username}</span>
          <span className="text-xs font-mono font-bold text-primary">Lv.{user.level || 1}</span>
        </div>
        <div className="w-20 h-1.5 rounded-full bg-secondary mt-1 overflow-hidden">
          <div
            className="h-full rounded-full gradient-bg transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </button>
  );
};

export default ProfileWidget;
