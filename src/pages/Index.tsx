import AuthCard from '@/components/AuthCard';
import { useAuthStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import TechFrame from '@/components/TechFrame';

const Index = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/menu');
  }, [user, navigate]);

  return (
    <TechFrame>
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[128px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-[128px] pointer-events-none" />

        <div className="flex flex-col items-center gap-10 relative z-10 max-w-lg w-full">
          {/* Top decorative line */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-[10px] font-mono text-muted-foreground/40">001</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          {/* Title */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-2 h-2 bg-primary" />
              <div className="w-8 h-px bg-primary/50" />
            </div>
            <h1 className="text-6xl md:text-7xl font-mono font-extrabold tracking-tighter text-foreground">
              POWER
              <span className="block gradient-text">UP</span>
            </h1>
          </div>

          {/* Decorative dots pattern */}
          <div className="hidden md:flex flex-wrap gap-2 justify-center max-w-[200px]">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="w-0.5 h-0.5 rounded-full bg-muted-foreground/20"
              />
            ))}
          </div>

          {/* Description */}
          <div className="relative text-center space-y-3">
            <p className="text-sm md:text-base font-mono text-muted-foreground leading-relaxed tracking-wide">
              Train Hard, Level Up.
            </p>
            {/* Technical corner accent */}
            <div className="hidden md:block absolute -right-8 -top-2">
              <div className="w-4 h-4 border-t border-r border-border/30" />
            </div>
          </div>

          {/* Auth Card */}
          <AuthCard />

          {/* Bottom technical notation */}
          <div className="hidden md:flex items-center gap-3 text-[10px] font-mono text-muted-foreground/30">
            <span>∞</span>
            <div className="w-12 h-px bg-border/20" />
            <span>POWERUP</span>
          </div>
        </div>
      </div>
    </TechFrame>
  );
};

export default Index;
