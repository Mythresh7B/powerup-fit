
-- Drop the permissive UPDATE policy that allows writing any column
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a restricted RPC for metadata-only updates (username, bio, avatar_url)
CREATE OR REPLACE FUNCTION public.update_profile_metadata(
  p_username text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_last_username_change timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    username = COALESCE(p_username, username),
    bio = COALESCE(p_bio, bio),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    last_username_change = COALESCE(p_last_username_change, last_username_change),
    updated_at = now()
  WHERE id = auth.uid();
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.update_profile_metadata TO authenticated;
