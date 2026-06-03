-- Phase 8: Add first_name & last_name to profiles

-- 1. Add columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name  TEXT;

-- 2. Update the signup trigger to populate names from auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Backfill existing users from their stored auth metadata
UPDATE public.profiles p
SET
  first_name = u.raw_user_meta_data->>'first_name',
  last_name  = u.raw_user_meta_data->>'last_name'
FROM auth.users u
WHERE p.id = u.id
  AND p.first_name IS NULL;
