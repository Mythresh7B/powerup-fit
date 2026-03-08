import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useSessionStore, useGauntletStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { BOSSES, EXERCISE_LABELS } from '@/lib/bosses';
import { getLevel, getHP, calculateXP, calculateStatDeltas } from '@/lib/xp';
import GlobalHeader from '@/components/GlobalHeader';
import BossCard from '@/components/BossCard';
import BattleResultModal from '@/components/BattleResultModal';
import PhaseProgressBar from '@/components/PhaseProgressBar';
import PoseCamera from '@/components/PoseCamera';
import RepCounterDisplay from '@/components/RepCounter';
import FatigueBar from '@/components/FatigueBar';
import PostureAlert from '@/components/PostureAlert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useBackLock } from '@/hooks/useBackLock';
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
  const gauntlet = useGauntletStore();
  const [bossProgress, setBossProgress] = useState<BossProgressRecord[]>([]);
  const [selectedBoss, setSelectedBoss] = useState<number | null>(null);
  const [battling, setBattling] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [phaseComplete, setPhaseComplete] = useState(false);
  const phaseRepsAccumulated = useRef<Record<number, number>>({});
  const phaseStatDeltas = useRef<StatDeltas>({ attack: 0, defence: 0, focus: 0, agility: 0 });

  useBackLock();

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

  // Watch for phase completion
  useEffect(() => {
    if (!battling || !selectedBoss || !gauntlet.isActive) return;
    const boss = BOSSES.find(b => b.index === selectedBoss);
    const phaseData = boss?.phases[gauntlet.currentPhase - 1];
    if (!phaseData) return;
    if (session.correctReps >= phaseData.repsRequired && !phaseComplete) {
      setPhaseComplete(true);
    }
  }, [session.correctReps, battling, selectedBoss, gauntlet.isActive, gauntlet.currentPhase, phaseComplete]);

  useEffect(() => {
    if (!phaseComplete || !selectedBoss) return;
    const bossData = BOSSES.find(b => b.index === selectedBoss);
    const phaseData = bossData?.phases[gauntlet.currentPhase - 1];
    if (!bossData || !phaseData) return;

    const phaseNum = gauntlet.currentPhase;
    phaseRepsAccumulated.current[phaseNum] = session.correctReps;

    const deltas = calculateStatDeltas(phaseData.exercise, session.correctReps);
    phaseStatDeltas.current.attack += deltas.attack;
    phaseStatDeltas.current.defence += deltas.defence;
    phaseStatDeltas.current.focus += deltas.focus;
    phaseStatDeltas.current.agility += deltas.agility;

    gauntlet.completePhase(phaseNum, session.correctReps);

    const allComplete = gauntlet.phasesComplete.filter(Boolean).length + 1 >= bossData.phases.length;

    if (allComplete) {
      setTimeout(() => handleBattleResolution(), 1000);
    } else {
      toast.success(`Phase ${phaseNum} complete!`);
      setTimeout(() => {
        const nextPhase = bossData.phases[phaseNum];
        if (nextPhase) {
          session.resetSession();
          session.setExercise(nextPhase.exercise as any);
          session.setTargetReps(nextPhase.repsRequired);
          session.startSession();
          setPhaseComplete(false);
        }
      }, 1500);
    }
    setPhaseComplete(false);
  }, [phaseComplete]);

  if (!user) return null;

  const userLevel = user.level || getLevel(user.total_xp || 0);
  const boss = selectedBoss ? BOSSES.find(b => b.index === selectedBoss) : null;
  const currentPhaseData = boss && gauntlet.isActive
    ? boss.phases[gauntlet.currentPhase - 1]
    : null;

  const isBossDefeated = (idx: number) => bossProgress.find(p => p.boss_index === idx)?.defeated ?? false;
  const isPreviousDefeated = (idx: number) => idx === 1 || isBossDefeated(idx - 1);

  const handleChallenge = (bossIndex: number) => {
    setSelectedBoss(bossIndex);
  };

  const handleStartGauntlet = () => {
    if (!boss) return;
    gauntlet.startGauntlet(boss.index, boss.phases.length);
    phaseRepsAccumulated.current = {};
    phaseStatDeltas.current = { attack: 0, defence: 0, focus: 0, agility: 0 };

    const firstPhase = boss.phases[0];
    session.setExercise(firstPhase.exercise as any);
    session.setTargetReps(firstPhase.repsRequired);
    session.startSession();
    setBattling(true);
    toast.info(`⚔️ Gauntlet: Phase 1 — ${EXERCISE_LABELS[firstPhase.exercise]} × ${firstPhase.repsRequired}`);
  };



  const handleBattleResolution = async () => {
    session.endSession();
    if (!boss) return;

    const totalCorrectReps = Object.values(phaseRepsAccumulated.current).reduce((s, v) => s + v, 0);

    if (!user.isGuest) {
      try {
        const { data, error } = await supabase.functions.invoke('boss-battle', {
          body: {
            boss_index: boss.index,
            correct_reps: totalCorrectReps,
            total_reps: totalCorrectReps,
            exercise: 'mixed',
            fatigue_score: session.fatigueIndex,
            phase_reps: phaseRepsAccumulated.current,
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
      const won = totalCorrectReps >= boss.phases.reduce((s, p) => s + p.repsRequired, 0);
      const xpEarned = Math.min(totalCorrectReps, 150) * 10 + (won ? boss.bonusXP : 0);
      const newTotalXp = (user.total_xp || 0) + xpEarned;
      setUser({ ...user, total_xp: newTotalXp, level: getLevel(newTotalXp) });
      setBattleResult({
        won, rounds: 5,
        playerDmgPerRound: 50, damageTakenPerRound: 20,
        critTriggered: false, dodgeTriggered: false,
        xpEarned, statDeltas: phaseStatDeltas.current,
        bossDefeatedFirstTime: won,
      });
    }

    session.resetSession();
    gauntlet.resetGauntlet();
    setBattling(false);
  };

  const handleAbortGauntlet = () => {
    session.endSession();
    session.resetSession();
    gauntlet.resetGauntlet();
    setBattling(false);
    setPhaseComplete(false);
  };

  const closeBattleResult = () => {
    setBattleResult(null);
    setSelectedBoss(null);
  };

  const repProgress = currentPhaseData
    ? Math.min(100, (session.correctReps / currentPhaseData.repsRequired) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalHeader />

      {battleResult && boss && (
        <BattleResultModal
          result={battleResult}
          bossName={boss.name}
          onClose={closeBattleResult}
        />
      )}

      {battling && boss ? (
        /* Full-screen gauntlet */
        <div className="flex-1 flex flex-col p-4 gap-4">
          {/* Boss info bar */}
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{boss.emoji}</span>
                <div>
                  <h2 className="text-lg font-mono font-bold text-foreground">{boss.name}</h2>
                  <p className="text-xs font-mono text-muted-foreground">{boss.lore}</p>
                </div>
              </div>
              <Button variant="destructive" size="sm" className="font-mono text-xs" onClick={handleAbortGauntlet}>
                Retreat
              </Button>
            </div>
            {/* Boss HP bar (decorative) */}
            <Progress value={80} className="h-2" />
          </div>

          {/* Phase progress */}
          <PhaseProgressBar
            totalPhases={boss.phases.length}
            currentPhase={gauntlet.currentPhase}
            phasesComplete={gauntlet.phasesComplete}
          />

          {/* Current phase info */}
          {currentPhaseData && (
            <div className="text-center">
              <span className="text-sm font-mono text-primary font-bold">
                Phase {gauntlet.currentPhase}: {EXERCISE_LABELS[currentPhaseData.exercise]}
              </span>
              <span className="text-xs font-mono text-muted-foreground ml-2">
                {session.correctReps}/{currentPhaseData.repsRequired} reps
              </span>
            </div>
          )}

          {/* Camera + HUD */}
          <div className="flex-1 flex flex-col lg:flex-row gap-4">
            <div className="flex-[2] min-h-[300px]">
              <PoseCamera />
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <div className="glass-card p-4">
                <Progress value={repProgress} className="h-3" />
              </div>
              <div className="glass-card p-6 flex flex-col items-center">
                <RepCounterDisplay />
              </div>
              <div className="glass-card p-4 space-y-3">
                <FatigueBar score={session.fatigueIndex} />
                <PostureAlert posture={session.postureLabel} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Boss selection */
        <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
          <div className="flex-[2]">
            <div className="space-y-4">
              <h1 className="text-3xl font-mono font-extrabold tracking-tighter text-foreground">
                BOSS <span className="text-warning">ZONE</span>
              </h1>
              <p className="text-sm font-mono text-muted-foreground">
                Complete multi-exercise gauntlets to defeat legendary bosses. HP: {getHP(userLevel)}
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
          </div>

          {/* Side panel */}
          <div className="flex-1 flex flex-col gap-4">
            {boss && (
              <div className="glass-card p-6 space-y-4">
                <div className="text-center">
                  <span className="text-5xl block mb-2">{boss.emoji}</span>
                  <h3 className="text-xl font-mono font-bold text-foreground">{boss.name}</h3>
                  <p className="text-xs font-mono text-muted-foreground mt-1">{boss.lore}</p>
                </div>

                {/* Phases */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">Gauntlet Phases</h4>
                  {boss.phases.map((p, i) => (
                    <div key={i} className="flex justify-between text-xs font-mono">
                      <span className="text-foreground">Phase {i + 1}: {EXERCISE_LABELS[p.exercise]}</span>
                      <span className="text-primary font-bold">{p.repsRequired} reps</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm font-mono">
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

                <Button variant="brand" size="lg" className="w-full font-mono uppercase" onClick={handleStartGauntlet}>
                  ⚔️ Begin Gauntlet
                </Button>
                <Button variant="ghost" size="sm" className="w-full font-mono" onClick={() => setSelectedBoss(null)}>
                  ← Back
                </Button>
              </div>
            )}

            {!boss && (
              <div className="glass-card p-6 text-center">
                <p className="text-muted-foreground font-mono text-sm">Select a boss to challenge!</p>
                <p className="text-xs text-muted-foreground font-mono mt-2">
                  Each boss has multiple exercise phases. Complete them all to fight.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BossZone;
