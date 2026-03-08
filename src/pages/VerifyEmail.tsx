import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const MAX_RESENDS = 3;
const COOLDOWN_SECONDS = 60;

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || sessionStorage.getItem('verify_email') || '';
  const errorParam = searchParams.get('error');

  const [resendCount, setResendCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [status, setStatus] = useState<'waiting' | 'verified' | 'error'>('waiting');

  // Save email for persistence across refreshes
  useEffect(() => {
    if (email) sessionStorage.setItem('verify_email', email);
  }, [email]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Poll for verification status
  useEffect(() => {
    if (!email || status === 'verified') return;
    const interval = setInterval(async () => {
      // Try signing in to check if email is confirmed
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.email_confirmed_at) {
        setStatus('verified');
        clearInterval(interval);
        setTimeout(() => navigate('/menu'), 2000);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [email, status, navigate]);

  const handleResend = async () => {
    if (resendCount >= MAX_RESENDS || cooldown > 0) return;
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (!error) {
      setResendCount(c => c + 1);
      setCooldown(COOLDOWN_SECONDS);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="glass-card p-8 max-w-md w-full text-center space-y-4">
        {errorParam === 'invalid_token' && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 text-sm font-mono text-destructive">
            This verification link has expired or is invalid. Please request a new one.
          </div>
        )}

        {status === 'verified' ? (
          <>
            <div className="text-5xl">✅</div>
            <h1 className="text-xl font-mono font-bold text-foreground">Email Verified!</h1>
            <p className="text-sm font-mono text-muted-foreground">Redirecting to the app...</p>
          </>
        ) : (
          <>
            <div className="text-5xl">📧</div>
            <h1 className="text-xl font-mono font-bold text-foreground">Check your inbox</h1>
            <p className="text-sm font-mono text-muted-foreground">
              We sent a verification link to:
            </p>
            <p className="text-sm font-mono text-primary font-bold">{email}</p>
            <p className="text-xs font-mono text-muted-foreground">
              Click the link in the email to activate your PowerUp account.
            </p>

            {resendCount >= MAX_RESENDS ? (
              <p className="text-xs font-mono text-muted-foreground">
                Maximum resends reached. Check spam or contact support.
              </p>
            ) : (
              <Button
                variant="outline"
                onClick={handleResend}
                disabled={cooldown > 0}
                className="font-mono"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s...` : 'Resend verification email'}
              </Button>
            )}

            <div className="border-t border-border pt-4">
              <button
                onClick={() => navigate('/')}
                className="text-sm font-mono text-primary hover:underline"
              >
                Already verified? Log in
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
