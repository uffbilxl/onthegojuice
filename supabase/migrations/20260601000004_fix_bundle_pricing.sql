-- ============================================================
--  Fix bundle pricing: replace flat-price bundles with
--  "every 6th bottle free" (buy 6 pay for 5 @ £1.99 = £9.95)
-- ============================================================

-- Remove the old nonsense fixed-price bundles
DELETE FROM public.promotions_config
WHERE id IN ('bundle_3', 'bundle_5', 'bundle_7');

-- Insert the correct deal: 6 bottles for the price of 5
-- total_price_pence = 5 × 199 = 995  (£9.95 for 6 bottles)
-- The cascading algorithm then tiles this across larger orders:
--   12 bottles → 2 × deal = £19.90  (2 free)
--   16 bottles → 2 × deal + 4 singles = £27.86  (2 free)
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
    995,   -- 5 × £1.99
    1
  )
ON CONFLICT (id) DO UPDATE SET
  name               = EXCLUDED.name,
  description        = EXCLUDED.description,
  badge_text         = EXCLUDED.badge_text,
  min_qty            = EXCLUDED.min_qty,
  total_price_pence  = EXCLUDED.total_price_pence,
  sort_order         = EXCLUDED.sort_order;
