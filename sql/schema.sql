-- ============================================================
-- Dubkin CRM — PostgreSQL Schema
-- Technology Partner for Growing Businesses
-- ============================================================

-- Pipeline Stages (master table)
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  position    INTEGER NOT NULL,
  color       VARCHAR(7) DEFAULT '#6B7280',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO pipeline_stages (name, display_name, position, color) VALUES
  ('lead',        'צינון',       1, '#6B7280'),
  ('discovery',   'אפיון',       2, '#3B82F6'),
  ('pricing',     'מחירה',       3, '#F59E0B'),
  ('closing',     'סגירה',       4, '#8B5CF6'),
  ('active',      'לקוח פעיל',   5, '#10B981'),
  ('archive',     'ארכיון',      6, '#9CA3AF')
ON CONFLICT (name) DO NOTHING;

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  phone       VARCHAR(30),
  email       VARCHAR(255),
  company     VARCHAR(200),
  source      VARCHAR(100),   -- e.g. referral, whatsapp, website, cold-call
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Products / Services
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  price       NUMERIC(12, 2) NOT NULL DEFAULT 0,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO products (name, price, description) VALUES
  ('אוטומציה עסקית',     5000,  'בניית תהליכי אוטומציה מותאמים לעסק'),
  ('WhatsApp Bot',        3500,  'בוט וואטסאפ עם לוגיקה עסקית'),
  ('ניהול פרויקט (PM)',   8000,  'ניהול פרויקט מלא — תכנון, ביצוע, מסירה'),
  ('חבילת הכל כלול',    15000,  'אוטומציה + WhatsApp Bot + PM')
ON CONFLICT DO NOTHING;

-- Deals
CREATE TABLE IF NOT EXISTS deals (
  id              SERIAL PRIMARY KEY,
  contact_id      INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  stage_id        INTEGER REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  name            VARCHAR(300) NOT NULL,
  value           NUMERIC(12, 2) DEFAULT 0,   -- ILS ₪
  product_id      INTEGER REFERENCES products(id) ON DELETE SET NULL,
  notes           TEXT,
  expected_close  DATE,
  closed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Activities (call log, emails, whatsapp, meetings)
CREATE TABLE IF NOT EXISTS activities (
  id          SERIAL PRIMARY KEY,
  deal_id     INTEGER REFERENCES deals(id) ON DELETE CASCADE,
  contact_id  INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  type        VARCHAR(50) NOT NULL CHECK (type IN ('call','email','whatsapp','meeting','note','other')),
  description TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on contacts / deals / products
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'contacts_updated_at') THEN
    CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON contacts
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'deals_updated_at') THEN
    CREATE TRIGGER deals_updated_at BEFORE UPDATE ON deals
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'products_updated_at') THEN
    CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deals_stage       ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact     ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal   ON activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_contact ON activities(contact_id);
