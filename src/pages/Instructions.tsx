import Navbar from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { useEffect } from 'react';

const exercises = [
  {
    name: 'Bicep Curl',
    emoji: '💪',
    steps: [
      'Stand straight with arms fully extended at your sides.',
      'Keep your elbows pinned to your torso — do not let them drift forward.',
      'Curl your forearm upward until the angle is less than 50°.',
      'Lower back down slowly until the arm is nearly straight (>150°).',
      'Each full up-and-down counts as 1 rep.',
    ],
    tips: [
      'The AI tracks your elbow angle — keep it tight to your body.',
      'Avoid swinging or using momentum.',
      'Control the descent for maximum rep quality.',
    ],
  },
  {
    name: 'Shoulder Press',
    emoji: '🏋️',
    steps: [
      'Start with arms bent at 90° at shoulder height (like a goalpost).',
      'Press both arms straight up overhead until fully extended.',
      'Lower back to the 90° starting position.',
      'Each full press counts as 1 rep.',
    ],
    tips: [
      'Keep your core tight and back straight.',
      'The AI checks your shoulder-to-wrist angle.',
      'Don\'t lock out your elbows aggressively at the top.',
    ],
  },
  {
    name: 'Squat',
    emoji: '🦵',
    steps: [
      'Stand with feet shoulder-width apart.',
      'Lower your body by bending your knees until thighs are parallel to the floor.',
      'Keep your back straight and chest up throughout.',
      'Push back up to standing position.',
      'Each full down-and-up counts as 1 rep.',
    ],
    tips: [
      'The AI tracks your hip and knee angles.',
      'Don\'t let your knees go past your toes.',
      'Go deep enough — shallow squats won\'t count.',
    ],
  },
  {
    name: 'Plank',
    emoji: '🧘',
    steps: [
      'Get into a push-up position with arms straight.',
      'Keep your body in a straight line from head to heels.',
      'Hold the position — the AI tracks your alignment.',
      'Duration-based: maintain form for as long as possible.',
    ],
    tips: [
      'Don\'t let your hips sag or pike up.',
      'The AI monitors your torso angle for straightness.',
      'Breathe steadily — don\'t hold your breath.',
    ],
  },
];

const Instructions = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-mono font-bold text-foreground tracking-tight">
            // WORKOUT_PROTOCOLS
          </h1>
          <p className="text-sm font-mono text-muted-foreground">
            Follow these instructions for valid rep detection by the AI pose engine.
          </p>
        </div>

        {/* General tips */}
        <div className="glass-card p-6 space-y-3 border-l-2 border-primary/50">
          <h2 className="text-sm font-mono uppercase tracking-wider text-primary">
            &gt; GENERAL_SETUP
          </h2>
          <ul className="space-y-2 text-sm font-mono text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">01</span>
              <span>Position your camera so your full body is visible.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">02</span>
              <span>Ensure good lighting — the AI needs to see your joints clearly.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">03</span>
              <span>Wear fitted clothing for better pose detection accuracy.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">04</span>
              <span>Stand ~6 feet from the camera for optimal tracking.</span>
            </li>
          </ul>
        </div>

        {/* Exercise cards */}
        {exercises.map((ex, idx) => (
          <div key={ex.name} className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{ex.emoji}</span>
              <div>
                <h2 className="text-lg font-mono font-bold text-foreground">
                  {ex.name}
                </h2>
                <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">
                  PROTOCOL_{String(idx + 1).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-primary">
                &gt; STEPS
              </h3>
              <ol className="space-y-1.5">
                {ex.steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm font-mono text-muted-foreground">
                    <span className="text-primary shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-2 border-t border-border/30 pt-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-accent">
                &gt; TIPS
              </h3>
              <ul className="space-y-1.5">
                {ex.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm font-mono text-muted-foreground">
                    <span className="text-accent">→</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Instructions;
