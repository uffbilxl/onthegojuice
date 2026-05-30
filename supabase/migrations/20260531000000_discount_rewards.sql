-- Discount codes (welcome 20% + free bottle rewards)
CREATE TABLE IF NOT EXISTS discount_codes (
  id                   UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  code                 TEXT    UNIQUE NOT NULL,
  email                TEXT    NOT NULL,
  type                 TEXT    NOT NULL DEFAULT 'welcome', -- 'welcome' | 'free_bottle'
  discount_percent     INTEGER,           -- 20 for 20%
  discount_fixed_pence INTEGER,           -- 199 for free £1.99 bottle
  min_order_pence      INTEGER NOT NULL DEFAULT 0,
  used                 BOOLEAN NOT NULL DEFAULT FALSE,
  used_at              TIMESTAMPTZ,
  used_by_order        TEXT,              -- stripe payment_intent id
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Customer rewards (track cumulative bottles for 7→1-free)
CREATE TABLE IF NOT EXISTS customer_rewards (
  id                 UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  email              TEXT    UNIQUE NOT NULL,
  bottles_purchased  INTEGER NOT NULL DEFAULT 0,
  rewards_sent       INTEGER NOT NULL DEFAULT 0,
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: only service_role (server-side) can access these tables
ALTER TABLE discount_codes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_rewards ENABLE ROW LEVEL SECURITY;
