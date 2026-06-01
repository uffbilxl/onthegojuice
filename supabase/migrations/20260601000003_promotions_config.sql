-- ============================================================
--  On The Go Juice — Promotions Config
--  Admin-toggleable bundle / volume-deal offers
-- ============================================================

CREATE TABLE IF NOT EXISTS public.promotions_config (
  id                  TEXT        PRIMARY KEY,
  name                TEXT        NOT NULL,
  description         TEXT,
  badge_text          TEXT,
  is_active           BOOLEAN     NOT NULL DEFAULT false,
  min_qty             INTEGER     NOT NULL DEFAULT 1,
  total_price_pence   INTEGER     NOT NULL,
  sort_order          INTEGER     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS promotions_config_updated_at ON public.promotions_config;
CREATE TRIGGER promotions_config_updated_at
  BEFORE UPDATE ON public.promotions_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row Level Security ─────────────────────────────────────────────
ALTER TABLE public.promotions_config ENABLE ROW LEVEL SECURITY;

-- Public can read active promotions (used by the shop frontend)
CREATE POLICY "anon_read_active_promos"
  ON public.promotions_config
  FOR SELECT TO anon
  USING (is_active = true);

-- Service role / authenticated admin can do everything
CREATE POLICY "auth_all_promos"
  ON public.promotions_config
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Seed: buy 6 get 1 free (5 × £1.99 = £9.95 for 6 bottles) ─────
INSERT INTO public.promotions_config
  (id, name, description, badge_text, is_active, min_qty, total_price_pence, sort_order)
VALUES
  (
    'bundle_6for5',
    '6 for the Price of 5',
    'Buy 6 bottles and only pay for 5 — one bottle completely free. Stacks on larger orders.',
    'BUY 6 GET 1 FREE',
    false,
    6,
    995,
    1
  )
ON CONFLICT (id) DO NOTHING;
