-- Hide Carrot, Beetroot & Milk Juice Drink (plain/regular) until a bottle image is available
UPDATE public.products
SET active = false
WHERE id = 5;
