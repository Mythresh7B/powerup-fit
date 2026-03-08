import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const AVATAR_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'];

function getLevelBorderColor(level: number): string {
  if (level >= 20) return 'linear-gradient(135deg, #F59E0B, #EA580C, #EF4444)';
  if (level >= 15) return '#F59E0B';
  if (level >= 10) return '#7C3AED';
  if (level >= 5) return '#3B82F6';
  return '#9CA3AF';
}

interface AvatarCircleProps {
  avatarUrl: string | null;
  username: string;
  size: number;
  level?: number;
  showUploadHint?: boolean;
  onClick?: () => void;
}

const AvatarCircle = ({ avatarUrl, username, size, level = 1, showUploadHint, onClick }: AvatarCircleProps) => {
  const [loaded, setLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const colorIndex = username.charCodeAt(0) % AVATAR_COLORS.length;
  const bgColor = AVATAR_COLORS[colorIndex];
  const borderColor = getLevelBorderColor(level);
  const isGradientBorder = level >= 20;

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    position: 'relative',
    cursor: onClick ? 'pointer' : 'default',
    flexShrink: 0,
    ...(isGradientBorder
      ? { background: borderColor, padding: 2 }
      : { border: `2px solid ${borderColor}` }),
  };

  const innerStyle: React.CSSProperties = isGradientBorder
    ? { width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }
    : { width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' };

  const showFallback = !avatarUrl || imgError;

  return (
    <div style={containerStyle} onClick={onClick} className="group">
      <div style={innerStyle}>
        {showFallback ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: bgColor }}
          >
            <span
              className="font-mono font-bold text-primary-foreground"
              style={{ fontSize: size * 0.4 }}
            >
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : (
          <>
            {!loaded && <Skeleton className="w-full h-full rounded-full" />}
            <img
              src={avatarUrl}
              alt={username}
              loading="lazy"
              className="w-full h-full object-cover"
              style={{ display: loaded ? 'block' : 'none', borderRadius: '50%' }}
              onLoad={() => setLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        )}
      </div>

      {showUploadHint && (
        <div className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-foreground" style={{ fontSize: size * 0.25 }}>📷</span>
        </div>
      )}
    </div>
  );
};

export default AvatarCircle;
