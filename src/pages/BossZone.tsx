import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useSessionStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { BOSSES, EXERCISE_LABELS } from '@/lib/bosses';
import { getLevel, getHP, calculateXP, calculateStatDeltas } from '@/lib/xp';
import Navbar from '@/components/Navbar';
import BossCard from '@/components/BossCard';
import BattleResultModal from '@/components/BattleResultModal';
import PoseCamera from '@/components/PoseCamera';
import RepCounterDisplay from '@/components/RepCounter';
import FatigueBar from '@/components/FatigueBar';
import PostureAlert from '@/components/PostureAlert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import type { StatDeltas } from '@/lib/xp';

interface BossProgressRecord {
  boss_index: number;
  defeated: boolean;
  attempts: number;
  first_defeated_at: string | null;
}

interface BattleResult {
  won: boolean;
  rounds: number;
  playerDmgPerRound: number;
  damageTakenPerRound: number;
  critTriggered: boolean;
  dodgeTriggered: boolean;
  xpEarned: number;
  statDeltas: StatDeltas;
  bossDefeatedFirstTime: boolean;
}

const BossZone = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const session = useSessionStore();
  const [bossProgress, setBossProgress] = useState<BossProgressRecord[]>([]);
  const [selectedBoss, setSelectedBoss] = useState<number | null>(null);
  const [battling, setBattling] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionStartRef = useRef(0);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (user.isGuest) { setLoading(false); return; }
    fetchProgress();
  }, [user, navigate]);

  const fetchProgress = async () => {
    const { data } = await supabase
      .from('boss_progress')
      .select('boss_index, defeated, attempts, first_defeated_at')
      .eq('user_id', user!.id);
    if (data) setBossProgress(data as BossProgressRecord[]);
    setLoading(false);
  };

  if (!user) return null;

  const userLevel = user.level || getLevel(user.total_xp || 0);
  const boss = selectedBoss ? BOSSES.find(b => b.index === selectedBoss) : null;

  const isBossDefeated = (idx: number) => bossProgress.find(p => p.boss_index === idx)?.defeated ?? false;
  const isPreviousDefeated = (idx: number) => idx === 1 || isBossDefeated(idx - 1);

  const handleChallenge = (bossIndex: number) => {
    setSelectedBoss(bossIndex);
  };

  const handleStartBattle = () => {
    if (!boss) return;
    const exercise = boss.exercise === 'mixed' ? 'bicep_curl' : boss.exercise;
    session.setExercise(exercise as any);
    session.setTargetReps(boss.repsRequired);
    session.startSession();
    sessionStartRef.current = Date.now();
    setBattling(true);
    toast.info(`⚔️ Battle against ${boss.name}! Do ${boss.repsRequired} ${EXERCISE_LABELS[boss.exercise]}!`);
  };

  const handleEndBattle = async () => {
    session.endSession();
    if (!boss) return;

    if (!user.isGuest) {
      try {
        const { data, error } = await supabase.functions.invoke('boss-battle', {
          body: {
            boss_index: boss.index,
            correct_reps: session.correctReps,
            total_reps: session.repCount,
            exercise: boss.exercise === 'mixed' ? 'bicep_curl' : boss.exercise,
            fatigue_score: session.fatigueIndex,
          },
        });

        if (error) {
          toast.error('Failed to resolve battle');
        } else {
          setBattleResult({
            won: data.won,
            rounds: data.rounds,
            playerDmgPerRound: data.player_dmg_per_round,
            damageTakenPerRound: data.damage_taken_per_round,
            critTriggered: data.crit_triggered,
            dodgeTriggered: data.dodge_triggered,
            xpEarned: data.xp_earned,
            statDeltas: data.stat_deltas,
            bossDefeatedFirstTime: data.boss_defeated_first_time,
          });
          setUser({ ...user, total_xp: data.total_xp, level: data.level });
          await fetchProgress();
        }
      } catch {
        toast.error('Battle error');
      }
    } else {
      // Guest mode - simple client-side resolution
      const won = session.correctReps >= boss.repsRequired;
      const statDeltas = calculateStatDeltas(
        boss.exercise === 'mixed' ? 'bicep_curl' : boss.exercise,
        session.correctReps
      );
      const accuracy = session.repCount > 0 ? session.correctReps / session.repCount : 0;
      let xpEarned = calculateXP(session.correctReps, accuracy, session.fatigueIndex, user.streak);
      if (won) xpEarned += boss.bonusXP;
      const newTotalXp = (user.total_xp || 0) + xpEarned;
      setUser({ ...user, total_xp: newTotalXp, level: getLevel(newTotalXp) });
      setBattleResult({
        won, rounds: 5,
        playerDmgPerRound: 50, damageTakenPerRound: 20,
        critTriggered: false, dodgeTriggered: false,
        xpEarned, statDeltas,
        bossDefeatedFirstTime: won,
      });
    }

    session.resetSession();
    setBattling(false);
  };

  const closeBattleResult = () => {
    setBattleResult(null);
    setSelectedBoss(null);
  };

  const repProgress = boss ? Math.min(100, (session.correctReps / boss.repsRequired) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {battleResult && boss && (
        <BattleResultModal
          result={battleResult}
          bossName={boss.name}
          onClose={closeBattleResult}
        />
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        {/* Main area */}
        <div className="flex-[2] min-h-[400px] lg:min-h-0">
          {battling ? (
            <div className="h-full flex flex-col gap-3">
              <div className="flex-1">
                <PoseCamera />
              </div>
              {boss && (
                <div className="glass-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono font-bold text-foreground">
                      {boss.emoji} {boss.name}
                    </span>
                    <span className="text-sm font-mono text-muted-foreground">
                      {session.correctReps}/{boss.repsRequired} reps
                    </span>
                  </div>
                  <Progress value={repProgress} className="h-3" />
                  <PostureAlert posture={session.postureLabel} />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 bg-warning" />
                <div className="w-8 h-px bg-warning/50" />
              </div>
              <h1 className="text-3xl font-mono font-extrabold tracking-tighter text-foreground">
                BOSS <span className="text-warning">ZONE</span>
              </h1>
              <p className="text-sm font-mono text-muted-foreground">
                Defeat 5 legendary bosses using your workout stats. HP: {getHP(userLevel)}
              </p>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {BOSSES.map(b => {
                    const progress = bossProgress.find(p => p.boss_index === b.index);
                    return (
                      <BossCard
                        key={b.index}
                        boss={b}
                        userLevel={userLevel}
                        defeated={progress?.defeated ?? false}
                        attempts={progress?.attempts ?? 0}
                        firstDefeatedAt={progress?.first_defeated_at}
                        previousBossDefeated={isPreviousDefeated(b.index)}
                        onChallenge={() => handleChallenge(b.index)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="flex-1 flex flex-col gap-4">
          {boss && !battling && (
            <div className="glass-card p-6 space-y-4">
              <div className="text-center">
                <span className="text-5xl block mb-2">{boss.emoji}</span>
                <h3 className="text-xl font-mono font-bold text-foreground">{boss.name}</h3>
                <p className="text-xs font-mono text-muted-foreground mt-1">{boss.lore}</p>
              </div>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exercise</span>
                  <span className="text-foreground">{EXERCISE_LABELS[boss.exercise]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reps Required</span>
                  <span className="text-foreground font-bold">{boss.repsRequired}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Boss HP</span>
                  <span className="text-destructive font-bold">{boss.bossHP}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">XP Bonus</span>
                  <span className="text-accent font-bold">+{boss.bonusXP}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weakness</span>
                  <span className="text-warning font-bold">{boss.weakness}</span>
                </div>
              </div>
              <Button variant="brand" size="lg" className="w-full font-mono uppercase" onClick={handleStartBattle}>
                ⚔️ Begin Battle
              </Button>
              <Button variant="ghost" size="sm" className="w-full font-mono" onClick={() => setSelectedBoss(null)}>
                ← Back
              </Button>
            </div>
          )}

          {battling && (
            <>
              <div className="glass-card p-6 flex flex-col items-center">
                <RepCounterDisplay />
              </div>
              <div className="glass-card p-4">
                <FatigueBar score={session.fatigueIndex} />
              </div>
              <Button variant="destructive" size="lg" className="w-full font-mono" onClick={handleEndBattle}>
                ⏹ End Battle
              </Button>
            </>
          )}

          {!boss && !battling && (
            <div className="glass-card p-6 text-center">
              <p className="text-muted-foreground font-mono text-sm">Select a boss to challenge!</p>
              <p className="text-xs text-muted-foreground font-mono mt-2">
                Your stats determine battle outcome. Train in Practice mode to power up.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BossZone;
