-- ============================================================
--  On The Go Juice — Secure Rewards Schema v2
--
--  Changes:
--   1. Extend profiles with reward-tracking columns
--   2. Create user_rewards table (auth-linked, dashboard-visible)
--   3. Close the subscribe-exploit gap (handled at API layer)
-- ============================================================

-- ── 1. Extend profiles ────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_discount_claimed BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bottle_progress          INTEGER  NOT NULL DEFAULT 0 CHECK (bottle_progress >= 0 AND bottle_progress < 7),
  ADD COLUMN IF NOT EXISTS lifetime_bottles_bought  INTEGER  NOT NULL DEFAULT 0 CHECK (lifetime_bottles_bought >= 0);

-- ── 2. user_rewards — stores Stripe promo codes per verified user ─
--      Separate from discount_codes (which is the checkout validator).
--      This table is what the /account dashboard renders.
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT        NOT NULL,
  type              TEXT        NOT NULL CHECK (type IN ('welcome_20pct', 'free_bottle')),
  promo_code        TEXT        NOT NULL UNIQUE,
  stripe_coupon_id  TEXT,
  stripe_promo_id   TEXT,
  redeemed          BOOLEAN     NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- Users can only see their own unused rewards
CREATE POLICY "users_own_rewards_select"
  ON public.user_rewards FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Service role has full access (webhook + claim endpoint)
CREATE POLICY "service_role_all_rewards"
  ON public.user_rewards FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id   ON public.user_rewards (user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_promo_code ON public.user_rewards (promo_code);
