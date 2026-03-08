
-- Backfill profiles for any existing auth users that don't have one
INSERT INTO public.profiles (id, username, level, total_xp, streak, stat_attack, stat_defence, stat_focus, stat_agility)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', split_part(u.email::text, '@', 1)),
  1, 0, 0, 0, 0, 0, 0
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;
