-- ============================================================
--  On The Go Juice — Dynamic Product Catalogue
--  Prices and names can now be edited from the admin panel.
--  category values: 'juice' | 'milk' | 'shot'
-- ============================================================

CREATE TABLE IF NOT EXISTS public.products (
  id          INTEGER     PRIMARY KEY,
  name        TEXT        NOT NULL,
  category    TEXT        NOT NULL CHECK (category IN ('juice', 'milk', 'shot')),
  price_pence INTEGER     NOT NULL CHECK (price_pence > 0),
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row Level Security ─────────────────────────────────────────────
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public (anon) can read active products — used by the shop & checkout
CREATE POLICY "anon_read_active_products"
  ON public.products FOR SELECT TO anon
  USING (active = true);

-- Service role (server-side API) can do everything
CREATE POLICY "service_role_all_products"
  ON public.products FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated admin can do everything
CREATE POLICY "auth_all_products"
  ON public.products FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Seed data ─────────────────────────────────────────────────────
--   Core Wellness Line  (juice)  £3.99 = 399 pence
--   Creamy Nutrition Line (milk) £4.99 = 499 pence
--   Functional Shot Line  (shot) £2.99 = 299 pence
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.products (id, name, category, price_pence, active) VALUES
  (1,  'Carrot and Milk Juice Drink (No Added Sugar)',          'milk',  499, true),
  (2,  'Carrot, Beetroot & Milk Juice Drink (No Added Sugar)',  'milk',  499, true),
  (3,  'Mango & Milk Juice Drink',                              'milk',  499, true),
  (4,  'Carrot, Beetroot & Milk Juice Drink (Lactose Free)',    'milk',  499, true),
  (5,  'Carrot, Beetroot & Milk Juice Drink',                   'milk',  499, true),
  (6,  'Mango & Ginger Juice Drink',                            'juice', 399, true),
  (7,  'Carrot & Milk Juice Drink (Lactose Free)',               'milk',  499, true),
  (8,  'Sorrel Juice Drink',                                    'juice', 399, true),
  (9,  'GO SHOT Apple Ginger',                                  'shot',  299, true),
  (10, 'Carrot and Lemon Juice Drink',                          'juice', 399, true),
  (11, 'Breadfruit and Milk Juice Drink',                       'milk',  499, true),
  (12, 'Carrot & Grapefruit Juice Drink',                       'juice', 399, true),
  (13, 'Carrot and Ginger Juice Drink',                         'juice', 399, true),
  (14, 'Beetroot & Apple Juice Drink',                          'juice', 399, true),
  (15, 'Beetroot & Milk Juice Drink',                           'milk',  499, true),
  (16, 'Carrot and Lime Juice Drink',                           'juice', 399, true),
  (17, 'GO Shot Pineapple Ginger',                              'shot',  299, true),
  (18, 'Ginger and Turmeric Go Shot',                           'shot',  299, true),
  (19, 'Carrot and Milk Juice Drink',                           'milk',  499, true)
ON CONFLICT (id) DO NOTHING;
