-- Phase 35: Written reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id            BIGSERIAL PRIMARY KEY,
  customer_name TEXT     NOT NULL,
  rating        SMALLINT NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  review_text   TEXT     NOT NULL,
  flavor        TEXT,
  status        TEXT     NOT NULL DEFAULT 'approved'
                CHECK (status IN ('approved', 'pending', 'rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public can read approved reviews
CREATE POLICY "anon_read_approved_reviews"
  ON public.reviews FOR SELECT TO anon
  USING (status = 'approved');

-- Service role (admin) can do everything
CREATE POLICY "service_role_all_reviews"
  ON public.reviews FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_reviews_status_created
  ON public.reviews (status, created_at DESC);
