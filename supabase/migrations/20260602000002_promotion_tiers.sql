-- ============================================================
--  On The Go Juice — Admin-Toggleable Bundle Tiers
--  Adds three new promotion tiers aligned to new product pricing.
--  Prices at these quantities save the customer vs. individual rates.
--  All start inactive — enable each from the Admin → Promotions tab.
-- ============================================================

INSERT INTO public.promotions_config
  (id, name, description, badge_text, is_active, min_qty, total_price_pence, sort_order)
VALUES
  (
    'bundle_3',
    '3 Bottles for £10.99',
    'Mix and match any 3 bottles and pay just £10.99. Save on individual prices.',
    '3 FOR £10.99',
    false,
    3,
    1099,
    10
  ),
  (
    'bundle_5',
    '5 Bottles for £17.99',
    'Choose any 5 bottles for only £17.99. A great way to stock up and save.',
    '5 FOR £17.99',
    false,
    5,
    1799,
    20
  ),
  (
    'bundle_7pack',
    '7-Day Wellness Pack',
    'A full week of wellness — any 7 bottles for £24.99. Perfect for daily drinkers.',
    '7-DAY PACK £24.99',
    false,
    7,
    2499,
    30
  )
ON CONFLICT (id) DO NOTHING;
