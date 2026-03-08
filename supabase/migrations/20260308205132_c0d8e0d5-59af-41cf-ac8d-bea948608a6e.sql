
-- Add stat columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stat_attack INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stat_defence INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stat_focus INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stat_agility INTEGER NOT NULL DEFAULT 0;

-- Create boss_progress table
CREATE TABLE public.boss_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  boss_index SMALLINT NOT NULL,
  defeated BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0,
  first_defeated_at TIMESTAMPTZ,
  last_attempted_at TIMESTAMPTZ,
  UNIQUE(user_id, boss_index)
);

-- Enable RLS on boss_progress
ALTER TABLE public.boss_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for boss_progress
CREATE POLICY "Users can view own boss progress"
  ON public.boss_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own boss progress"
  ON public.boss_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boss progress"
  ON public.boss_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
