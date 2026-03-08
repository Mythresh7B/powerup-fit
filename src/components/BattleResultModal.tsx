import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { StatDeltas } from '@/lib/xp';

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

interface BattleResultModalProps {
  result: BattleResult;
  bossName: string;
  onClose: () => void;
}

const BattleResultModal = ({ result, bossName, onClose }: BattleResultModalProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
  }, []);

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 ${
      visible ? 'opacity-100' : 'opacity-0'
    }`}>
      {/* Background flash */}
      <div className={`absolute inset-0 ${
        result.won ? 'bg-warning/10' : 'bg-destructive/10'
      } backdrop-blur-sm`} />

      <div className="relative glass-card p-8 max-w-md w-full mx-4 text-center space-y-4 animate-fade-in-up">
        <h2 className={`text-4xl font-mono font-extrabold tracking-tighter ${
          result.won ? 'text-warning' : 'text-destructive'
        }`}>
          {result.won ? '⚔️ VICTORY!' : '💀 DEFEATED...'}
        </h2>

        <p className="text-sm font-mono text-muted-foreground">
          {result.won
            ? `You defeated ${bossName} in ${result.rounds} rounds!`
            : `${bossName} was too strong this time. Keep training!`}
        </p>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Your DMG/Round</span>
            <span className="text-foreground">{Math.round(result.playerDmgPerRound)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Damage Taken/Round</span>
            <span className="text-destructive">{Math.round(result.damageTakenPerRound)}</span>
          </div>
          {result.critTriggered && (
            <div className="text-accent font-bold">🎯 Critical Hit!</div>
          )}
          {result.dodgeTriggered && (
            <div className="text-accent font-bold">💨 Dodge Activated!</div>
          )}
        </div>

        <div className="border-t border-border/50 pt-4 space-y-2">
          <div className="text-lg font-mono font-bold text-primary">+{result.xpEarned} XP</div>
          {result.bossDefeatedFirstTime && (
            <div className="text-sm font-mono text-warning font-bold">🏆 First Defeat Bonus +200 XP!</div>
          )}
          <div className="flex justify-center gap-4 text-xs font-mono">
            {result.statDeltas.attack > 0 && <span className="text-destructive">+{result.statDeltas.attack} ATK</span>}
            {result.statDeltas.defence > 0 && <span className="text-primary">+{result.statDeltas.defence} DEF</span>}
            {result.statDeltas.focus > 0 && <span className="text-purple-400">+{result.statDeltas.focus} FOC</span>}
            {result.statDeltas.agility > 0 && <span className="text-emerald-400">+{result.statDeltas.agility} AGI</span>}
          </div>
        </div>

        <Button variant="brand" size="lg" className="w-full font-mono uppercase" onClick={onClose}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default BattleResultModal;
