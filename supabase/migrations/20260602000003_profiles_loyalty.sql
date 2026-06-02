-- ============================================================
--  On The Go Juice — User Profiles & Loyalty Points
--  Linked to Supabase Auth. Auto-created on signup via trigger.
--  Loyalty rate: £1 spent = 10 points. 100 points = £1 off.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          TEXT        UNIQUE NOT NULL,
  loyalty_points INTEGER     NOT NULL DEFAULT 0 CHECK (loyalty_points >= 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Auto-create profile row when a user registers ────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Row Level Security ─────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile only
CREATE POLICY "users_own_profile_select"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile only
CREATE POLICY "users_own_profile_update"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Service role (webhook, server-side) has full access to award/deduct points
CREATE POLICY "service_role_all_profiles"
  ON public.profiles FOR ALL TO service_role
  USING (true) WITH CHECK (true);
