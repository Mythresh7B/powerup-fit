
-- Profiles table extending auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE NOT NULL,
  level int DEFAULT 1,
  total_xp bigint DEFAULT 0,
  streak int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Workout logs table
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exercise text NOT NULL,
  duration_seconds int DEFAULT 0,
  total_reps int DEFAULT 0,
  correct_reps int DEFAULT 0,
  xp_earned int DEFAULT 0,
  fatigue_score float DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workout logs" ON public.workout_logs FOR ALL USING (auth.uid() = user_id);
