-- ============================================================
--  On The Go Juice — Orders Schema
--  Run this in the Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name       TEXT,
  customer_email      TEXT,
  customer_phone      TEXT,
  delivery_method     TEXT CHECK (delivery_method IN ('local_delivery', 'pickup')),
  shipping_address    TEXT,
  postcode            TEXT,
  items               JSONB NOT NULL DEFAULT '[]',
  total_amount        NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_status      TEXT NOT NULL DEFAULT 'pending',
  fulfillment_status  TEXT NOT NULL DEFAULT 'processing',
  stripe_session_id   TEXT,   -- Stripe Checkout session ID (legacy flow)
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast webhook lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session
  ON public.orders (stripe_session_id);

-- ── Run this if the table already exists (adds payment-intent column) ──
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON public.orders (created_at DESC);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow the Stripe webhook (anon key) to insert new orders
CREATE POLICY "anon_insert_orders"
  ON public.orders
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only authenticated users (admin) can read orders
CREATE POLICY "auth_read_orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users (admin) can update fulfillment status
CREATE POLICY "auth_update_orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── Helpful view for the admin dashboard ─────────────────────
CREATE OR REPLACE VIEW public.orders_summary AS
SELECT
  id,
  customer_name,
  customer_email,
  customer_phone,
  delivery_method,
  postcode,
  items,
  total_amount,
  payment_status,
  fulfillment_status,
  stripe_session_id,
  created_at
FROM public.orders
ORDER BY created_at DESC;
