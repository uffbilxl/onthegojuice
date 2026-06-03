-- Phase 7: Role-based profiles and wholesale pricing

-- 1. Extend profiles with role and company_name
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer'
    CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'corporate', 'admin')),
  ADD COLUMN IF NOT EXISTS company_name TEXT;

-- 2. Wholesale price column on products (default: 30% off retail)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS wholesale_price_pence INTEGER;

UPDATE public.products
SET wholesale_price_pence = ROUND(price_pence * 0.70)::INTEGER
WHERE wholesale_price_pence IS NULL;

-- 3. RLS on profiles (re-create cleanly)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Each user may only read their own row
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Each user may update their own row; role is only changed via service-role key in API routes
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK  (auth.uid() = id);

-- Service-role key bypasses RLS automatically — no extra policy needed for admin role assignment
