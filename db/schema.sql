-- Content OS — monitenantti skeema. Idempotentti.
-- Kaikki data eristetty organization_id-avaimella.
-- RLS/Auth tulee myöhemmässä vaiheessa; eristys nyt sovelluskerroksessa.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_members (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','admin','editor','reviewer','viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

CREATE TABLE IF NOT EXISTS brand_brains (
  org_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  writing_style TEXT,
  tone_of_voice TEXT,
  values TEXT,
  services JSONB NOT NULL DEFAULT '[]'::JSONB,
  target_audiences JSONB NOT NULL DEFAULT '[]'::JSONB,
  ctas JSONB NOT NULL DEFAULT '[]'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('image','video')),
  title TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::JSONB,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  thumbnail_url TEXT NOT NULL,
  duration_seconds INTEGER,
  analysis_status TEXT NOT NULL DEFAULT 'pending' CHECK (analysis_status IN ('pending','processing','done','error')),
  analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_review','approved','scheduled','published','archived')),
  media_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  series_name TEXT,
  channels JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('tiktok','instagram','facebook','linkedin','blog')),
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('tiktok','instagram','facebook','linkedin','blog')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('draft','scheduled','published')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  thumbnail_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_folders_org ON folders(org_id);
CREATE INDEX IF NOT EXISTS idx_media_org ON media_assets(org_id);
CREATE INDEX IF NOT EXISTS idx_content_org ON content_items(org_id);
CREATE INDEX IF NOT EXISTS idx_calendar_org ON calendar_events(org_id);

-- Vaihe 13: kalenteri + ajastus. Additiiviset ALTER-lauseet olemassa oleviin
-- tauluihin. IF NOT EXISTS pitää ajot idempotentteina — käynnistys ei kaadu
-- vaikka sarakkeet olisivat jo olemassa.
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS content_variant_id UUID REFERENCES content_variants(id) ON DELETE SET NULL;
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_calendar_variant ON calendar_events(content_variant_id) WHERE content_variant_id IS NOT NULL;

-- Vaihe 16: analytics_metrics — v3 KPI:t, top-aiheet ja top-videot.
-- Rivit voivat olla per-julkaisu (content_variant_id) tai aihe-tason yhteenveto
-- (content_variant_id NULL, topic asetettu). Osittainen unique-indeksi estää
-- tuplaamisen kun content_variant_id on olemassa.
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content_variant_id UUID REFERENCES content_variants(id) ON DELETE SET NULL,
  channel TEXT CHECK (channel IN ('tiktok','instagram','facebook','linkedin','blog')),
  metric_date DATE NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  engagement INTEGER NOT NULL DEFAULT 0,
  watch_time_seconds NUMERIC(10,2) NOT NULL DEFAULT 0,
  topic TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_org ON analytics_metrics(org_id);
CREATE INDEX IF NOT EXISTS idx_analytics_org_date ON analytics_metrics(org_id, metric_date);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_analytics_variant_date
  ON analytics_metrics(content_variant_id, metric_date)
  WHERE content_variant_id IS NOT NULL;

-- Vaihe 19: käyttäjät + istunto. users-taulu on uusi; organization_members.user_id
-- ja .role olivat jo olemassa (TEXT), joten ALTER-lauseet ovat käytännössä no-op
-- IF NOT EXISTSin ansiosta. user_id säilyy TEXTinä; users.id on UUID ja tallennetaan
-- TEXTinä organization_members-tauluun. Ei destruktiivista.
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'editor';
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
