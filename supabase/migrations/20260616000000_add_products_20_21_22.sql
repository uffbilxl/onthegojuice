-- Add 3 new SKUs introduced in the June 2026 product expansion
INSERT INTO public.products (id, name, category, price_pence, active) VALUES
  (20, 'Carrot & Mango Juice Drink',        'juice', 399, true),
  (21, 'Tropical Fruit Punch Juice Drink',  'juice', 399, true),
  (22, 'Carrot and Watermelon Juice Drink', 'juice', 399, true)
ON CONFLICT (id) DO NOTHING;
