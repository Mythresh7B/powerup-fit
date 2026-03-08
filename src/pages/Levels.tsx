import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useSessionStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { calculateXP, getLevel } from '@/lib/xp';
import GlobalHeader from '@/components/GlobalHeader';
import PoseCamera from '@/components/PoseCamera';
import RepCounterDisplay from '@/components/RepCounter';
import FatigueBar from '@/components/FatigueBar';
import PostureAlert from '@/components/PostureAlert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useBackLock } from '@/hooks/useBackLock';

interface LevelDef {
  level: number;
  repsRequired: number;
  monster: string;
  monsterName: string;
  xpReward: number;
  exercise: 'bicep_curl' | 'shoulder_press' | 'squat' | 'plank';
}

const LEVELS: LevelDef[] = Array.from({ length: 20 }, (_, i) => {
  const lvl = i + 1;
  const exercises: LevelDef['exercise'][] = ['bicep_curl', 'shoulder_press', 'squat', 'plank'];
  const monsters = [
    { emoji: '🐀', name: 'Sewer Rat' }, { emoji: '🦇', name: 'Cave Bat' },
    { emoji: '🐍', name: 'Venom Snake' }, { emoji: '🕷️', name: 'Shadow Spider' },
    { emoji: '🐺', name: 'Dire Wolf' }, { emoji: '🦂', name: 'Sand Scorpion' },
    { emoji: '🐗', name: 'Iron Boar' }, { emoji: '🦅', name: 'Storm Eagle' },
    { emoji: '🐊', name: 'Swamp Croc' }, { emoji: '🦁', name: 'Golden Lion' },
    { emoji: '🐻', name: 'Mountain Bear' }, { emoji: '🦖', name: 'Thunder Rex' },
    { emoji: '🐉', name: 'Fire Drake' }, { emoji: '🦑', name: 'Kraken Jr.' },
    { emoji: '👹', name: 'Oni Demon' }, { emoji: '🧟', name: 'Bone Revenant' },
    { emoji: '🐲', name: 'Elder Dragon' }, { emoji: '👻', name: 'Phantom Lord' },
    { emoji: '💀', name: 'Death Knight' }, { emoji: '🔥', name: 'Inferno Titan' },
  ];
  return {
    level: lvl, repsRequired: 5 + lvl * 3,
    monster: monsters[i].emoji, monsterName: monsters[i].name,
    xpReward: 50 + lvl * 25, exercise: exercises[i % 4],
  };
});

const exerciseLabels: Record<string, string> = {
  bicep_curl: '💪 Bicep Curl', shoulder_press: '🏋️ Shoulder Press',
  squat: '🦵 Squat', plank: '🧘 Plank',
};

const Levels = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const session = useSessionStore();
  const [selectedLevel, setSelectedLevel] = useState<LevelDef | null>(null);
  const [battling, setBattling] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());
  const sessionStartRef = useRef<number>(0);

  useBackLock();

  useEffect(() => { if (!user) navigate('/'); }, [user, navigate]);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`powerup-levels-${user.id}`);
      if (saved) setCompletedLevels(new Set(JSON.parse(saved)));
    }
  }, [user]);

  if (!user) return null;

  const handleStartBattle = () => {
    if (!selectedLevel) return;
    session.setExercise(selectedLevel.exercise);
    session.setTargetReps(selectedLevel.repsRequired);
    session.startSession();
    sessionStartRef.current = Date.now();
    setBattling(true);
    toast.info(`⚔️ Battle against ${selectedLevel.monsterName}!`);
  };

  const handleEndBattle = async () => {
    session.endSession();
    const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
    if (!selectedLevel) return;

    const won = session.correctReps >= selectedLevel.repsRequired;
    if (won) {
      const newCompleted = new Set(completedLevels);
      newCompleted.add(selectedLevel.level);
      setCompletedLevels(newCompleted);
      localStorage.setItem(`powerup-levels-${user.id}`, JSON.stringify([...newCompleted]));

      if (!user.isGuest) {
        try {
          const { data, error } = await supabase.functions.invoke('complete-workout', {
            body: { exercise: selectedLevel.exercise, total_reps: session.repCount, correct_reps: session.correctReps, fatigue_score: session.fatigueIndex, duration_seconds: durationSeconds },
          });
          if (!error && data) {
            const bonusXp = selectedLevel.xpReward;
            const totalWithBonus = data.total_xp + bonusXp;
            const newLevel = getLevel(totalWithBonus);
            await supabase.from('profiles').update({ total_xp: totalWithBonus, level: newLevel, updated_at: new Date().toISOString() }).eq('id', user.id);
            setUser({ ...user, total_xp: totalWithBonus, level: newLevel });
            toast.success(`🎉 ${selectedLevel.monsterName} defeated! +${data.xp_earned + bonusXp} XP!`);
          }
        } catch { toast.error('Failed to save workout'); }
      } else {
        const accuracy = session.repCount > 0 ? session.correctReps / session.repCount : 0;
        const xpEarned = calculateXP(session.correctReps, accuracy, session.fatigueIndex, user.streak) + selectedLevel.xpReward;
        const newTotalXp = (user.total_xp || 0) + xpEarned;
        setUser({ ...user, total_xp: newTotalXp, level: getLevel(newTotalXp) });
        toast.success(`🎉 ${selectedLevel.monsterName} defeated! +${xpEarned} XP!`);
      }
    } else {
      toast.error(`💀 ${selectedLevel.monsterName} survived! Try again!`);
    }

    session.resetSession();
    setBattling(false);
  };

  const repProgress = selectedLevel ? Math.min(100, (session.correctReps / selectedLevel.repsRequired) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalHeader />
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
        <div className="flex-[2] min-h-[400px] lg:min-h-0">
          {battling ? (
            <div className="h-full flex flex-col gap-3">
              <div className="flex-1"><PoseCamera /></div>
              {selectedLevel && (
                <div className="glass-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono font-bold text-foreground">{selectedLevel.monster} {selectedLevel.monsterName}</span>
                    <span className="text-sm font-mono text-muted-foreground">{session.correctReps}/{selectedLevel.repsRequired}</span>
                  </div>
                  <Progress value={repProgress} className="h-3" />
                  <PostureAlert posture={session.postureLabel} />
                </div>
              )}
            </div>
          ) : (
            <div className="h-full overflow-y-auto space-y-2 pr-2">
              <h2 className="text-2xl font-mono font-bold text-foreground mb-4">⚔️ Monster Levels</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {LEVELS.map((level) => {
                  const completed = completedLevels.has(level.level);
                  const isSelected = selectedLevel?.level === level.level;
                  return (
                    <button key={level.level} onClick={() => !battling && setSelectedLevel(level)}
                      className={cn("glass-card p-4 text-center transition-all hover:ring-1 hover:ring-primary/50",
                        isSelected && "ring-2 ring-primary glow-primary", completed && "opacity-70")}>
                      <span className="text-3xl block mb-1">{level.monster}</span>
                      <span className="text-xs font-medium text-foreground block">Lv.{level.level}</span>
                      <span className="text-xs text-muted-foreground block">{level.monsterName}</span>
                      {completed && <span className="text-xs text-accent block mt-1">✅ Cleared</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-4">
          {selectedLevel && !battling && (
            <div className="glass-card p-6 space-y-4">
              <div className="text-center">
                <span className="text-5xl block mb-2">{selectedLevel.monster}</span>
                <h3 className="text-xl font-mono font-bold text-foreground">{selectedLevel.monsterName}</h3>
              </div>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between"><span className="text-muted-foreground">Exercise</span><span className="text-foreground">{exerciseLabels[selectedLevel.exercise]}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reps Required</span><span className="text-foreground font-bold">{selectedLevel.repsRequired}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">XP Reward</span><span className="text-accent font-bold">+{selectedLevel.xpReward}</span></div>
              </div>
              <Button variant="brand" size="lg" className="w-full font-mono" onClick={handleStartBattle}>⚔️ Start Battle</Button>
            </div>
          )}
          {battling && (
            <>
              <div className="glass-card p-6 flex flex-col items-center"><RepCounterDisplay /></div>
              <div className="glass-card p-4"><FatigueBar score={session.fatigueIndex} /></div>
              <Button variant="destructive" size="lg" className="w-full font-mono" onClick={handleEndBattle}>⏹ End Battle</Button>
            </>
          )}
          {!selectedLevel && !battling && (
            <div className="glass-card p-6 text-center">
              <p className="text-muted-foreground font-mono text-sm">Select a monster to battle!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Levels;
