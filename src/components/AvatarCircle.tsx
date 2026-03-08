import { useState, useEffect, useCallback } from 'react';
import { getAvatarUrl } from '@/lib/avatar';

const AVATAR_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'];
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

function getLevelBorderColor(level: number): string {
  if (level >= 20) return 'linear-gradient(135deg, #F59E0B, #EA580C, #EF4444)';
  if (level >= 15) return '#F59E0B';
  if (level >= 10) return '#7C3AED';
  if (level >= 5) return '#3B82F6';
  return '#9CA3AF';
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

interface AvatarCircleProps {
  avatarUrl: string | null;
  username: string;
  size: number;
  level?: number;
  showUploadHint?: boolean;
  onClick?: () => void;
  priority?: boolean;
}

const AvatarCircle = ({ avatarUrl, username, size, level = 1, showUploadHint, onClick, priority }: AvatarCircleProps) => {
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  const colorIndex = username.charCodeAt(0) % AVATAR_COLORS.length;
  const bgColor = AVATAR_COLORS[colorIndex];
  const borderColor = getLevelBorderColor(level);
  const isGradientBorder = level >= 20;

  // Process URL when avatarUrl changes
  useEffect(() => {
    if (!avatarUrl) {
      setLoadState('idle');
      setCurrentUrl(null);
      return;
    }
    setRetryCount(0);
    setLoadState('loading');
    setCurrentUrl(getAvatarUrl(avatarUrl, size > 80 ? 256 : 128));
  }, [avatarUrl, size]);

  const handleError = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * (retryCount + 1);
      setTimeout(() => {
        setRetryCount(r => r + 1);
        // Cache-bust on retry
        setCurrentUrl(prev => {
          if (!prev) return prev;
          const base = prev.split('&retry=')[0];
          return `${base}&retry=${retryCount + 1}`;
        });
        setLoadState('loading');
      }, delay);
    } else {
      setLoadState('error');
    }
  }, [retryCount]);

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

  const innerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    overflow: 'hidden',
    position: 'relative',
  };

  const showFallback = !avatarUrl || loadState === 'error' || loadState === 'idle';

  const FallbackLetter = () => (
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
  );

  return (
    <div style={containerStyle} onClick={onClick} className="group">
      <div style={innerStyle}>
        {showFallback ? (
          <FallbackLetter />
        ) : (
          <>
            {/* Show letter avatar underneath while loading */}
            {loadState === 'loading' && (
              <div className="absolute inset-0">
                <FallbackLetter />
                {/* Shimmer overlay */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                    animation: 'shimmer 1.5s infinite',
                  }}
                />
              </div>
            )}
            <img
              src={currentUrl || ''}
              alt={`${username}'s avatar`}
              loading={priority ? 'eager' : 'lazy'}
              className="w-full h-full object-cover transition-opacity duration-300"
              style={{
                borderRadius: '50%',
                opacity: loadState === 'loaded' ? 1 : 0,
                position: loadState === 'loading' ? 'absolute' : 'relative',
                inset: 0,
              }}
              onLoad={() => setLoadState('loaded')}
              onError={handleError}
            />
          </>
        )}
      </div>

      {showUploadHint && (
        <div className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
          <span className="text-foreground" style={{ fontSize: size * 0.25 }}>📷</span>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default AvatarCircle;
