  -- ============================================================
  --  On The Go Juice — Event RSVPs
  -- ============================================================

  CREATE TABLE IF NOT EXISTS public.event_rsvps (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    email       TEXT        NOT NULL,
    attendees   TEXT        NOT NULL,
    message     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  -- One registration per email address per event
  -- (For multi-event support later, replace this with a composite key on (email, event_id))
  CREATE UNIQUE INDEX IF NOT EXISTS idx_event_rsvps_email
    ON public.event_rsvps (email);

  CREATE INDEX IF NOT EXISTS idx_event_rsvps_created_at
    ON public.event_rsvps (created_at DESC);

  -- ── Row Level Security ────────────────────────────────────────
  ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

  -- Public can register (anon key used from the frontend form)
  CREATE POLICY "anon_insert_event_rsvps"
    ON public.event_rsvps
    FOR INSERT
    TO anon
    WITH CHECK (true);

  -- Only authenticated admin can read registrations
  CREATE POLICY "auth_read_event_rsvps"
    ON public.event_rsvps
    FOR SELECT
    TO authenticated
    USING (true);
