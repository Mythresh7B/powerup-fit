import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/store';
import { supabase } from '@/integrations/supabase/client';
import { getLevel, getLevelTitle } from '@/lib/xp';
import GlobalHeader from '@/components/GlobalHeader';
import AvatarCircle from '@/components/AvatarCircle';
import PlayerProfileSheet from '@/components/PlayerProfileSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBackLock } from '@/hooks/useBackLock';
import { toast } from 'sonner';

interface PlayerResult {
  id: string;
  username: string;
  level: number;
  avatar_url: string | null;
}

interface FriendRequest {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  profiles?: PlayerResult;
}

const Social = () => {
  const navigate = useNavigate();
  const { user, setPendingRequests } = useAuthStore();
  const [tab, setTab] = useState<'discover' | 'friends' | 'requests'>('discover');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlayerResult[]>([]);
  const [friends, setFriends] = useState<PlayerResult[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useBackLock();

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    if (user.isGuest) return;
    loadFriends();
    loadRequests();
  }, [user]);

  const loadFriends = async () => {
    if (!user || user.isGuest) return;
    const { data } = await supabase
      .from('friendships')
      .select('requester_id, receiver_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (data) {
      const friendIds = data.map((f: any) =>
        f.requester_id === user.id ? f.receiver_id : f.requester_id
      );
      if (friendIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, level, avatar_url')
          .in('id', friendIds);
        setFriends((profiles as unknown as PlayerResult[]) || []);
      }
    }
  };

  const loadRequests = async () => {
    if (!user || user.isGuest) return;
    // Incoming
    const { data: inc } = await supabase
      .from('friendships')
      .select('id, requester_id, receiver_id, status, created_at')
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (inc && inc.length > 0) {
      const requesterIds = inc.map((r: any) => r.requester_id);
      const { data: profiles } = await supabase.from('profiles').select('id, username, level, avatar_url').in('id', requesterIds);
      const enriched = inc.map((r: any) => ({
        ...r,
        profiles: (profiles as any[])?.find((p: any) => p.id === r.requester_id),
      }));
      setIncoming(enriched);
      setPendingRequests(enriched.length);
    } else {
      setIncoming([]);
      setPendingRequests(0);
    }

    // Outgoing
    const { data: out } = await supabase
      .from('friendships')
      .select('id, requester_id, receiver_id, status, created_at')
      .eq('requester_id', user.id)
      .eq('status', 'pending');

    if (out && out.length > 0) {
      const receiverIds = out.map((r: any) => r.receiver_id);
      const { data: profiles } = await supabase.from('profiles').select('id, username, level, avatar_url').in('id', receiverIds);
      const enriched = out.map((r: any) => ({
        ...r,
        profiles: (profiles as any[])?.find((p: any) => p.id === r.receiver_id),
      }));
      setOutgoing(enriched);
    } else {
      setOutgoing([]);
    }
  };

  const handleSearch = useCallback(async (q: string) => {
    if (!user || user.isGuest || q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, level, avatar_url')
      .ilike('username', `%${q}%`)
      .neq('id', user.id)
      .limit(20);
    setSearchResults((data as unknown as PlayerResult[]) || []);
    setSearching(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(query), 400);
    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const handleAccept = async (friendshipId: string) => {
    await supabase.from('friendships').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', friendshipId);
    toast.success('Friend added!');
    loadFriends();
    loadRequests();
  };

  const handleDecline = async (friendshipId: string) => {
    await supabase.from('friendships').update({ status: 'declined', updated_at: new Date().toISOString() }).eq('id', friendshipId);
    loadRequests();
  };

  const handleCancel = async (friendshipId: string) => {
    await supabase.from('friendships').delete().eq('id', friendshipId);
    loadRequests();
  };

  if (!user) return null;

  if (user.isGuest) {
    return (
      <div className="min-h-screen flex flex-col">
        <GlobalHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="glass-card p-8 text-center max-w-md">
            <h2 className="text-2xl font-mono font-bold text-foreground mb-2">🌐 Social Zone</h2>
            <p className="text-sm font-mono text-muted-foreground mb-4">
              Join PowerUp to connect with other players.
            </p>
            <Button variant="brand" onClick={() => { useAuthStore.getState().logout(); navigate('/'); }}>
              Create Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'discover' as const, label: 'Discover' },
    { key: 'friends' as const, label: `Friends (${friends.length})` },
    { key: 'requests' as const, label: `Requests${incoming.length > 0 ? ` (${incoming.length})` : ''}` },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalHeader />
      {selectedPlayer && (
        <PlayerProfileSheet playerId={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}

      <div className="flex-1 p-4 max-w-3xl mx-auto w-full space-y-4">
        <h1 className="text-3xl font-mono font-extrabold tracking-tighter text-foreground">
          🌐 SOCIAL <span className="gradient-text">ZONE</span>
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-secondary rounded-lg">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-sm font-mono rounded-md transition-all ${
                tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Discover */}
        {tab === 'discover' && (
          <div className="space-y-3">
            <Input
              placeholder="Search players by username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="font-mono"
            />
            {searching && <p className="text-xs font-mono text-muted-foreground">Searching...</p>}
            {searchResults.map(p => {
              const lvl = p.level || 1;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayer(p.id)}
                  className="glass-card p-4 w-full text-left flex items-center gap-3 hover:ring-1 hover:ring-primary/50 transition-all"
                >
                  <AvatarCircle avatarUrl={p.avatar_url} username={p.username} size={40} level={lvl} />
                  <div>
                    <span className="text-sm font-mono font-bold text-foreground">{p.username}</span>
                    <p className="text-xs font-mono text-muted-foreground">Level {lvl} · {getLevelTitle(lvl)}</p>
                  </div>
                </button>
              );
            })}
            {query.length >= 2 && !searching && searchResults.length === 0 && (
              <p className="text-sm font-mono text-muted-foreground text-center py-4">No players found</p>
            )}
          </div>
        )}

        {/* Friends */}
        {tab === 'friends' && (
          <div className="space-y-2">
            {friends.length === 0 ? (
              <p className="text-sm font-mono text-muted-foreground text-center py-8">No friends yet. Find players in Discover.</p>
            ) : (
              friends.map(f => {
                const lvl = f.level || 1;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedPlayer(f.id)}
                    className="glass-card p-4 w-full text-left flex items-center gap-3 hover:ring-1 hover:ring-primary/50 transition-all"
                  >
                    <AvatarCircle avatarUrl={f.avatar_url} username={f.username} size={40} level={lvl} />
                    <div className="flex-1">
                      <span className="text-sm font-mono font-bold text-foreground">{f.username}</span>
                      <p className="text-xs font-mono text-muted-foreground">Level {lvl} · {getLevelTitle(lvl)}</p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">View →</span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Requests */}
        {tab === 'requests' && (
          <div className="space-y-4">
            {incoming.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">Incoming</h3>
                {incoming.map(r => {
                  const p = r.profiles;
                  if (!p) return null;
                  return (
                    <div key={r.id} className="glass-card p-4 flex items-center gap-3">
                      <AvatarCircle avatarUrl={p.avatar_url} username={p.username} size={40} level={p.level || 1} />
                      <div className="flex-1">
                        <span className="text-sm font-mono font-bold text-foreground">{p.username}</span>
                        <p className="text-xs font-mono text-muted-foreground">Level {p.level || 1}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="brand" size="sm" className="font-mono text-xs" onClick={() => handleAccept(r.id)}>Accept</Button>
                        <Button variant="outline" size="sm" className="font-mono text-xs" onClick={() => handleDecline(r.id)}>Decline</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {outgoing.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">Outgoing</h3>
                {outgoing.map(r => {
                  const p = r.profiles;
                  if (!p) return null;
                  return (
                    <div key={r.id} className="glass-card p-4 flex items-center gap-3">
                      <AvatarCircle avatarUrl={p.avatar_url} username={p.username} size={40} level={p.level || 1} />
                      <div className="flex-1">
                        <span className="text-sm font-mono font-bold text-foreground">{p.username}</span>
                        <p className="text-xs font-mono text-muted-foreground">Pending</p>
                      </div>
                      <Button variant="ghost" size="sm" className="font-mono text-xs" onClick={() => handleCancel(r.id)}>Cancel</Button>
                    </div>
                  );
                })}
              </div>
            )}

            {incoming.length === 0 && outgoing.length === 0 && (
              <p className="text-sm font-mono text-muted-foreground text-center py-8">No pending requests</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Social;
