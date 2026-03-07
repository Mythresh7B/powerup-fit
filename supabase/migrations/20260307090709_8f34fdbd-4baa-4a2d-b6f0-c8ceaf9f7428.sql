
-- Drop all restrictive policies and recreate as permissive

-- profiles: drop restrictive, create permissive
DROP POLICY IF EXISTS "Public leaderboard read" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Public leaderboard read" ON public.profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- workout_logs: drop restrictive, create permissive
DROP POLICY IF EXISTS "Users can insert own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Users can update own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Users can view own workout logs" ON public.workout_logs;

CREATE POLICY "Users can view own workout logs" ON public.workout_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workout logs" ON public.workout_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout logs" ON public.workout_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Remove deny policies from unused tables
DROP POLICY IF EXISTS "Deny all achievements" ON public.achievements;
DROP POLICY IF EXISTS "Deny all fatigue_logs" ON public.fatigue_logs;
DROP POLICY IF EXISTS "Deny all rep_logs" ON public.rep_logs;
DROP POLICY IF EXISTS "Deny all workouts" ON public.workouts;
DROP POLICY IF EXISTS "Deny all xp_progress" ON public.xp_progress;
DROP POLICY IF EXISTS "Deny all access to users" ON public.users;
DROP POLICY IF EXISTS "Deny delete to users" ON public.users;
DROP POLICY IF EXISTS "Deny insert to users" ON public.users;
DROP POLICY IF EXISTS "Deny update to users" ON public.users;

-- Lock down unused tables properly (keep RLS on, no permissive policies = no access)
