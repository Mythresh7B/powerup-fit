import { useEffect, useState } from 'react';
import type { PostureLabel } from '@/lib/pose';
import { cn } from '@/lib/utils';

interface PostureAlertProps {
  posture: PostureLabel;
}

const POSTURE_MESSAGES: Record<PostureLabel, { text: string; type: 'success' | 'warning' }> = {
  correct: { text: '✅ Great form!', type: 'success' },
  elbow_swing: { text: '⚠️ Keep elbows steady', type: 'warning' },
  shoulder_shrug: { text: '⚠️ Relax your shoulders', type: 'warning' },
  knee_cave: { text: '⚠️ Knees over toes', type: 'warning' },
  forward_lean: { text: '⚠️ Keep chest up', type: 'warning' },
  hip_deviation: { text: '⚠️ Keep hips aligned', type: 'warning' },
};

const PostureAlert = ({ posture }: PostureAlertProps) => {
  const [visible, setVisible] = useState(false);
  const msg = POSTURE_MESSAGES[posture];

  useEffect(() => {
    if (posture !== 'correct') {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [posture]);

  if (!visible && posture === 'correct') return null;

  return (
    <div className={cn(
      "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
      visible ? "animate-slide-in-right opacity-100" : "opacity-0",
      msg.type === 'success' ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
    )}>
      {msg.text}
    </div>
  );
};

export default PostureAlert;
