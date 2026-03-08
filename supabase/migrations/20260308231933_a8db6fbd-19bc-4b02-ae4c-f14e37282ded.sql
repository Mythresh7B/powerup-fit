-- Drop the old permissive leaderboard policy that ignores profile_visibility
DROP POLICY IF EXISTS "Public leaderboard read" ON public.profiles;

-- Create a new policy that respects profile_visibility
CREATE POLICY "Public leaderboard read" ON public.profiles
  FOR SELECT TO anon, authenticated
  USING (profile_visibility = 'public' OR auth.uid() = id);