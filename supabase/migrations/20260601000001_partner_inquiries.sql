  -- ============================================================
  --  On The Go Juice — Partner / B2B Inquiries
  -- ============================================================

  CREATE TABLE IF NOT EXISTS public.partner_inquiries (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name  TEXT        NOT NULL,
    contact_name   TEXT        NOT NULL,
    email          TEXT        NOT NULL,
    phone          TEXT        NOT NULL,
    org_type       TEXT        NOT NULL CHECK (org_type IN ('gym', 'cafe', 'corporate', 'other')),
    weekly_volume  TEXT        NOT NULL CHECK (weekly_volume IN ('1-20', '21-50', '51-100', '100+')),
    message        TEXT,
    status         TEXT        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'active', 'declined')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS idx_partner_inquiries_status
    ON public.partner_inquiries (status);

  CREATE INDEX IF NOT EXISTS idx_partner_inquiries_created_at
    ON public.partner_inquiries (created_at DESC);

  -- ── Row Level Security ────────────────────────────────────────
  ALTER TABLE public.partner_inquiries ENABLE ROW LEVEL SECURITY;

  -- Public can submit inquiries
  CREATE POLICY "anon_insert_partner_inquiries"
    ON public.partner_inquiries
    FOR INSERT
    TO anon
    WITH CHECK (true);

  -- Only authenticated admin can read and update inquiries
  CREATE POLICY "auth_read_partner_inquiries"
    ON public.partner_inquiries
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "auth_update_partner_inquiries"
    ON public.partner_inquiries
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);
