-- ============================================================
--  On The Go Juice — Event Configuration
-- ============================================================

CREATE TABLE IF NOT EXISTS public.event_config (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL DEFAULT 'Upcoming Event',
  description   TEXT,
  event_date    TIMESTAMPTZ NOT NULL,
  location_name TEXT        NOT NULL DEFAULT 'Birmingham City Centre',
  address       TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS event_config_updated_at ON public.event_config;
CREATE TRIGGER event_config_updated_at
  BEFORE UPDATE ON public.event_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Row Level Security ─────────────────────────────────────────────
ALTER TABLE public.event_config ENABLE ROW LEVEL SECURITY;

-- Public can read active events (used by events.html)
CREATE POLICY "anon_read_active_events"
  ON public.event_config
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Authenticated admin can do everything
CREATE POLICY "auth_all_event_config"
  ON public.event_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Seed the first event (matches the current hardcoded date on events.html)
INSERT INTO public.event_config (name, description, event_date, location_name, address, is_active)
VALUES (
  'Birmingham City Centre Soft Launch',
  'Our first public event — free tastings, launch-day deals, and a chance to meet the founder behind every bottle. Come and try the full range of cold-pressed juices, milk blends, and wellness shots.',
  '2026-07-05T10:00:00+01:00',
  'Birmingham City Centre',
  'Birmingham City Centre, Birmingham, B1 1BB',
  true
);
