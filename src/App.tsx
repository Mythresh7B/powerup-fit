import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Menu from "./pages/Menu";
import Dashboard from "./pages/Dashboard";
import Levels from "./pages/Levels";
import BossZone from "./pages/BossZone";
import History from "./pages/History";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Instructions from "./pages/Instructions";
import Social from "./pages/Social";
import VerifyEmail from "./pages/VerifyEmail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RouteGuard({ children, guestAllowed = false }: { children: React.ReactNode; guestAllowed?: boolean }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/" replace />;
  if (user.isGuest && !guestAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-card p-8 text-center max-w-md">
          <h2 className="text-xl font-mono font-bold text-foreground mb-2">🔒 Account Required</h2>
          <p className="text-sm font-mono text-muted-foreground mb-4">Create a free account to access this feature.</p>
          <button
            onClick={() => { useAuthStore.getState().logout(); window.location.href = '/'; }}
            className="text-primary font-mono text-sm hover:underline"
          >
            Sign Up →
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function AuthListener() {
  const { setUser, user } = useAuthStore();

  useEffect(() => {
    // Set up listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (profile) {
            setUser({
              id: session.user.id,
              username: (profile as any).username || 'User',
              level: (profile as any).level || 1,
              total_xp: (profile as any).total_xp || 0,
              streak: (profile as any).streak || 0,
              stat_attack: (profile as any).stat_attack || 0,
              stat_defence: (profile as any).stat_defence || 0,
              stat_focus: (profile as any).stat_focus || 0,
              stat_agility: (profile as any).stat_agility || 0,
              avatar_url: (profile as any).avatar_url || null,
              bio: (profile as any).bio || null,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="dark">
          <AuthListener />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/menu" element={<RouteGuard guestAllowed><Menu /></RouteGuard>} />
            <Route path="/practice" element={<RouteGuard guestAllowed><Dashboard /></RouteGuard>} />
            <Route path="/levels" element={<RouteGuard guestAllowed><Levels /></RouteGuard>} />
            <Route path="/boss-zone" element={<RouteGuard><BossZone /></RouteGuard>} />
            <Route path="/instructions" element={<RouteGuard guestAllowed><Instructions /></RouteGuard>} />
            <Route path="/history" element={<RouteGuard><History /></RouteGuard>} />
            <Route path="/leaderboard" element={<RouteGuard><Leaderboard /></RouteGuard>} />
            <Route path="/profile" element={<RouteGuard><Profile /></RouteGuard>} />
            <Route path="/social" element={<RouteGuard><Social /></RouteGuard>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
