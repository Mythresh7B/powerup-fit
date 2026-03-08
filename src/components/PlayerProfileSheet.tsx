import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/lib/store';
import { getLevel, getLevelTitle, getHP, getXPProgress } from '@/lib/xp';
import AvatarCircle from './AvatarCircle';
import StatBar from './StatBar';
import CharacterDisplay from './CharacterDisplay';
import BossDefeatBadges from './BossDefeatBadges';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { toast } from 'sonner';

interface PlayerProfileSheetProps {
  playerId: string;
  onClose: () => void;
}

interface PlayerData {
  id: string;
  username: string;
  level: number;
  total_xp: number;
  avatar_url: string | null;
  bio: string | null;
  stat_attack: number;
  stat_defence: number;
  stat_focus: number;
  stat_agility: number;
}

const PlayerProfileSheet = ({ playerId, onClose }: PlayerProfileSheetProps) => {
  const { user } = useAuthStore();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [bossProgress, setBossProgress] = useState<Array<{ boss_index: number; defeated: boolean; first_defeated_at: string | null }>>([]);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [profileRes, bossRes] = await Promise.all([
        supabase.from('profiles').select('id, username, level, total_xp, avatar_url, bio, stat_attack, stat_defence, stat_focus, stat_agility').eq('id', playerId).single(),
        supabase.from('boss_progress').select('boss_index, defeated, first_defeated_at').eq('user_id', playerId),
      ]);
      if (profileRes.data) setPlayer(profileRes.data as unknown as PlayerData);
      if (bossRes.data) setBossProgress(bossRes.data as any);

      // Check friendship status
      if (user && !user.isGuest) {
        const { data: fs } = await supabase
          .from('friendships')
          .select('id, status, requester_id, receiver_id')
          .or(`and(requester_id.eq.${user.id},receiver_id.eq.${playerId}),and(requester_id.eq.${playerId},receiver_id.eq.${user.id})`)
          .limit(1);
        if (fs && fs.length > 0) {
          const f = fs[0] as any;
          setFriendshipId(f.id);
          if (f.status === 'accepted') setFriendshipStatus('friends');
          else if (f.status === 'pending' && f.requester_id === user.id) setFriendshipStatus('sent');
          else if (f.status === 'pending' && f.receiver_id === user.id) setFriendshipStatus('received');
          else if (f.status === 'blocked') setFriendshipStatus('blocked');
        }
      }
      setLoading(false);
    };
    fetch();
  }, [playerId, user]);

  const handleAddFriend = async () => {
    if (!user) return;
    const { error } = await supabase.from('friendships').insert({
      requester_id: user.id,
      receiver_id: playerId,
    });
    if (error) {
      toast.error('Could not send request');
    } else {
      setFriendshipStatus('sent');
      toast.success('Friend request sent!');
    }
  };

  const handleAccept = async () => {
    if (!friendshipId) return;
    await supabase.from('friendships').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', friendshipId);
    setFriendshipStatus('friends');
    toast.success('Friend request accepted!');
  };

  const handleDecline = async () => {
    if (!friendshipId) return;
    await supabase.from('friendships').update({ status: 'declined', updated_at: new Date().toISOString() }).eq('id', friendshipId);
    setFriendshipStatus(null);
    setFriendshipId(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-y-0 right-0 w-96 max-w-full z-[70] glass-card border-l border-border/50 animate-slide-in-right p-6">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
        </div>
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!player) return null;

  const level = player.level || getLevel(player.total_xp || 0);
  const title = getLevelTitle(level);
  const hp = getHP(level);
  const xpProgress = getXPProgress(player.total_xp || 0);

  return (
    <>
      <div className="fixed inset-0 z-[65] bg-background/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-96 max-w-full z-[70] glass-card border-l border-border/50 animate-slide-in-right overflow-y-auto">
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <AvatarCircle avatarUrl={player.avatar_url} username={player.username} size={80} level={level} />
              <div>
                <h3 className="text-lg font-mono font-bold text-foreground">{player.username}</h3>
                <span className="text-xs font-mono text-primary">Level {level} · {title}</span>
                {player.bio && <p className="text-xs font-mono text-muted-foreground mt-1">{player.bio}</p>}
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
          </div>

          {/* XP Progress bar (no exact numbers) */}
          <Progress value={xpProgress.progress * 100} className="h-2" />

          {/* Character */}
          <div className="flex justify-center">
            <CharacterDisplay level={level} username={player.username} />
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">Stats</h4>
            <StatBar icon="❤️" label="HP" value={hp} color="#EC4899" mastery={false} />
            <StatBar icon="⚔️" label="ATTACK" value={player.stat_attack} color="#EF4444" mastery={player.stat_attack >= 500} />
            <StatBar icon="🛡️" label="DEFENCE" value={player.stat_defence} color="#3B82F6" mastery={player.stat_defence >= 500} />
            <StatBar icon="🎯" label="FOCUS" value={player.stat_focus} color="#8B5CF6" mastery={player.stat_focus >= 500} />
            <StatBar icon="💨" label="AGILITY" value={player.stat_agility} color="#10B981" mastery={player.stat_agility >= 500} />
          </div>

          {/* Boss Defeats */}
          <BossDefeatBadges progress={bossProgress} />

          {/* Friend button */}
          {user && !user.isGuest && user.id !== playerId && (
            <div className="pt-2">
              {friendshipStatus === 'friends' && (
                <Button variant="outline" size="sm" className="w-full font-mono" disabled>
                  ✓ Friends
                </Button>
              )}
              {friendshipStatus === 'sent' && (
                <Button variant="outline" size="sm" className="w-full font-mono" disabled>
                  Request Sent
                </Button>
              )}
              {friendshipStatus === 'received' && (
                <div className="flex gap-2">
                  <Button variant="brand" size="sm" className="flex-1 font-mono" onClick={handleAccept}>Accept</Button>
                  <Button variant="outline" size="sm" className="flex-1 font-mono" onClick={handleDecline}>Decline</Button>
                </div>
              )}
              {!friendshipStatus && (
                <Button variant="brand" size="sm" className="w-full font-mono" onClick={handleAddFriend}>
                  Add Friend
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PlayerProfileSheet;
