-- Fix product 7 name to include Lactose Free label (matches bottle image)
UPDATE public.products
SET name = 'Carrot & Milk Juice Drink (Lactose Free)'
WHERE id = 7 AND name = 'Carrot & Milk Juice Drink';
