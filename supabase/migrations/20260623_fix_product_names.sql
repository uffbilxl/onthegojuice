-- ============================================================
--  On The Go Juice — Product Name Fixes (Phase 34)
--  Run in Supabase SQL Editor to apply to live database.
--  Rules applied:
--    1. Remove "Juice" from milk drink names
--    2. Remove duplicate word in GO Shot Pineapple
--    3. Ensure "Carrot and Watermelon" has "Juice" in title
-- ============================================================

UPDATE public.products SET name = 'Carrot and Milk Drink (No Added Sugar)'       WHERE id = 1;
UPDATE public.products SET name = 'Carrot, Beetroot & Milk Drink (No Added Sugar)' WHERE id = 2;
UPDATE public.products SET name = 'Mango & Milk Drink'                            WHERE id = 3;
UPDATE public.products SET name = 'Carrot, Beetroot & Milk Drink (Lactose Free)'  WHERE id = 4;
UPDATE public.products SET name = 'Carrot, Beetroot & Milk Drink'                 WHERE id = 5;
UPDATE public.products SET name = 'Carrot & Milk Drink (Lactose Free)'            WHERE id = 7;
UPDATE public.products SET name = 'Breadfruit and Milk Drink'                     WHERE id = 11;
UPDATE public.products SET name = 'Beetroot & Milk Drink'                         WHERE id = 15;
UPDATE public.products SET name = 'Carrot and Milk Drink'                         WHERE id = 19;
UPDATE public.products SET name = 'Ginger and Pineapple Go Shot'                  WHERE id = 17;
UPDATE public.products SET name = 'Carrot and Watermelon Juice'                   WHERE id = 22;
