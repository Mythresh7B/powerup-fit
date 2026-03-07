import AuthCard from '@/components/AuthCard';
import { useAuthStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Index = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/menu');
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/10 blur-[128px] pointer-events-none" />

      <div className="flex flex-col items-center gap-8 relative z-10">
        <div className="text-center space-y-4 animate-fade-in-up">
          <h1 className="text-6xl md:text-7xl font-display font-extrabold gradient-text">
            PowerUp
          </h1>
          <p className="text-xl text-muted-foreground max-w-md">
            AI Fitness. No Equipment. Just You.
          </p>
        </div>
        <AuthCard />
      </div>
    </div>
  );
};

export default Index;
