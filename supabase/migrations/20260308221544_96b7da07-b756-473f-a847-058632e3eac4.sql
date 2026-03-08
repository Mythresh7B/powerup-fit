ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_created_email_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN NOT NULL DEFAULT false;