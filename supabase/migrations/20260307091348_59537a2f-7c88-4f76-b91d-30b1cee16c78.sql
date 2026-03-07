
-- Drop foreign keys referencing users table
ALTER TABLE IF EXISTS public.achievements DROP CONSTRAINT IF EXISTS achievements_user_id_fkey;
ALTER TABLE IF EXISTS public.xp_progress DROP CONSTRAINT IF EXISTS xp_progress_user_id_fkey;
ALTER TABLE IF EXISTS public.workouts DROP CONSTRAINT IF EXISTS workouts_user_id_fkey;
ALTER TABLE IF EXISTS public.fatigue_logs DROP CONSTRAINT IF EXISTS fatigue_logs_workout_id_fkey;
ALTER TABLE IF EXISTS public.rep_logs DROP CONSTRAINT IF EXISTS rep_logs_workout_id_fkey;

-- Drop the legacy tables that are unused and contain sensitive data
DROP TABLE IF EXISTS public.fatigue_logs;
DROP TABLE IF EXISTS public.rep_logs;
DROP TABLE IF EXISTS public.achievements;
DROP TABLE IF EXISTS public.xp_progress;
DROP TABLE IF EXISTS public.workouts;
DROP TABLE IF EXISTS public.users;
