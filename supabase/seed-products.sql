-- ============================================================
--  On The Go Juice — Product Seed
--  Paste this into Supabase SQL Editor AFTER running the
--  master schema script.
-- ============================================================

INSERT INTO public.products
  (id, name, description, price_pence, wholesale_price_pence, image_url, category, active)
OVERRIDING SYSTEM VALUE
VALUES
  -- ── Milk Blends (£4.99) ────────────────────────────────────
  (1,  'Carrot and Milk Juice Drink (No Added Sugar)',
       'Carrot, Whole Milk, Nutmeg, Vanilla',
       499, 349, 'images/products/carrot-milk-no-sugar.png',        'milk', true),

  (2,  'Carrot, Beetroot & Milk Juice Drink (No Added Sugar)',
       'Carrot, Beetroot, Whole Milk, Nutmeg, Vanilla',
       499, 349, 'images/products/carrot-beetroot-milk-no-sugar.png','milk', true),

  (3,  'Mango & Milk Juice Drink',
       'Mango, Whole Milk',
       499, 349, 'images/products/mango-milk.png',                  'milk', true),

  (4,  'Carrot, Beetroot & Milk Juice Drink (Lactose Free)',
       'Carrot, Beetroot, Lactose Free Whole Milk, Nutmeg, Vanilla, Sugar',
       499, 349, 'images/products/carrot-beetroot-milk-lactose-free.png','milk', true),

  (5,  'Carrot, Beetroot & Milk Juice Drink',
       'Carrot, Beetroot, Whole Milk, Nutmeg, Vanilla, Sugar',
       499, 349, 'images/products/carrot-beetroot-milk.png',        'milk', true),

  (7,  'Carrot & Milk Juice Drink (Lactose Free)',
       'Carrot, Lactose Free Whole Milk, Nutmeg, Vanilla, Sugar',
       499, 349, 'images/products/carrot-milk-lactose-free.png',    'milk', true),

  (11, 'Breadfruit and Milk Juice Drink',
       'Breadfruit, Whole Milk, Nutmeg, Vanilla, Sugar',
       499, 349, 'images/products/breadfruit-milk.png',             'milk', true),

  (15, 'Beetroot & Milk Juice Drink',
       'Beetroot, Whole Milk, Nutmeg, Vanilla, Sugar',
       499, 349, 'images/products/beetroot-milk.png',               'milk', true),

  (19, 'Carrot and Milk Juice Drink',
       'Carrot, Whole Milk, Nutmeg, Vanilla, Sugar',
       499, 349, 'images/products/carrot-milk.png',                 'milk', true),

  -- ── Juices (£3.99) ─────────────────────────────────────────
  (6,  'Mango & Ginger Juice Drink',
       'Mango, Ginger, Sugar, Water',
       399, 279, 'images/products/mango-ginger.png',                'juice', true),

  (8,  'Sorrel Juice Drink',
       'Sorrel, Cinnamon, Pimento, Sugar, Water',
       399, 279, 'images/products/sorrel.png',                      'juice', true),

  (10, 'Carrot and Lemon Juice Drink',
       'Carrot, Lemon, Sugar, Water',
       399, 279, 'images/products/carrot-lemon.png',                'juice', true),

  (12, 'Carrot & Grapefruit Juice Drink',
       'Carrot, Grapefruit, Sugar, Water',
       399, 279, 'images/products/carrot-grapefruit.png',           'juice', true),

  (13, 'Carrot and Ginger Juice Drink',
       'Carrot, Ginger, Sugar, Water',
       399, 279, 'images/products/carrot-ginger.png',               'juice', true),

  (14, 'Beetroot & Apple Juice Drink',
       'Beetroot, Apple, Sugar, Water',
       399, 279, 'images/products/beetroot-apple.png',              'juice', true),

  (16, 'Carrot and Lime Juice Drink',
       'Lime, Sugar, Water',
       399, 279, 'images/products/carrot-lime.png',                 'juice', true),

  -- ── Go Shots (£2.99) ───────────────────────────────────────
  (9,  'GO Shot Apple Ginger',
       'Apple, Lemon, Ginger',
       299, 209, 'images/products/go-shot-apple-ginger.png',        'shot', true),

  (17, 'GO Shot Pineapple Ginger',
       'Pineapple, Lemon, Ginger',
       299, 209, 'images/products/go-shot-pineapple-ginger.png',    'shot', true),

  (18, 'Ginger and Turmeric Go Shot',
       'Ginger, Turmeric, Lemon',
       299, 209, 'images/products/go-shot-turmeric.png',            'shot', true)

ON CONFLICT (id) DO NOTHING;

-- Reset the sequence so future SERIAL inserts start after 19
SELECT setval('public.products_id_seq', 19);
