-- ============================================
-- Epic Scraper — Database Schema
-- Migration: 20260228000000_scraper_tables.sql
-- ============================================

-- ============================================
-- 1. TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.scraper_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366F1',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scraper_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'website','youtube','twitter','instagram','tiktok','facebook',
    'linkedin','github','google_doc','google_drive','pdf','markdown',
    'rss','article','unknown'
  )),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued','detecting','scraping','processing','complete','error','cancelled'
  )),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  config JSONB NOT NULL DEFAULT '{
    "depth":0,
    "max_pages":1,
    "include_images":true,
    "include_videos":true,
    "include_files":true,
    "include_source":true,
    "include_metadata":true,
    "render_js":false
  }'::jsonb,
  items_found INTEGER DEFAULT 0,
  assets_found INTEGER DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scraper_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.scraper_jobs(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL,
  collection_id UUID REFERENCES public.scraper_collections(id) ON DELETE SET NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_domain TEXT,
  title TEXT,
  description TEXT,
  body_text TEXT,
  body_html TEXT,
  raw_source TEXT,
  content_type TEXT NOT NULL DEFAULT 'page' CHECK (content_type IN (
    'page','article','video','image','document','repository',
    'social_post','feed','file','audio','table_data'
  )),
  tables_json JSONB,
  links_json JSONB,
  headings_json JSONB,
  structured_data_json JSONB,
  tags TEXT[] DEFAULT '{}',
  is_starred BOOLEAN DEFAULT false,
  notes TEXT,
  word_count INTEGER,
  asset_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scraper_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.scraper_items(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.scraper_jobs(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'image','video','audio','document','file','thumbnail','avatar','screenshot'
  )),
  original_url TEXT,
  file_name TEXT,
  mime_type TEXT,
  file_size_bytes BIGINT,
  storage_path TEXT,
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  duration_seconds INTEGER,
  transcript TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scraper_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.scraper_items(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  value_json JSONB,
  category TEXT DEFAULT 'general' CHECK (category IN (
    'general','seo','social','technical','author','media','engagement','platform'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(item_id, key)
);

-- ============================================
-- 2. INDEXES (in same migration per pearl)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_scraper_jobs_org ON public.scraper_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_scraper_jobs_status ON public.scraper_jobs(status) WHERE status IN ('queued','scraping','processing');
CREATE INDEX IF NOT EXISTS idx_scraper_items_org ON public.scraper_items(org_id);
CREATE INDEX IF NOT EXISTS idx_scraper_items_job ON public.scraper_items(job_id);
CREATE INDEX IF NOT EXISTS idx_scraper_items_collection ON public.scraper_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_scraper_items_type ON public.scraper_items(content_type);
CREATE INDEX IF NOT EXISTS idx_scraper_items_source_type ON public.scraper_items(source_type);
CREATE INDEX IF NOT EXISTS idx_scraper_items_domain ON public.scraper_items(source_domain);
CREATE INDEX IF NOT EXISTS idx_scraper_items_search ON public.scraper_items USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body_text,'')));
CREATE INDEX IF NOT EXISTS idx_scraper_items_tags ON public.scraper_items USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_scraper_items_starred ON public.scraper_items(org_id) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_scraper_assets_item ON public.scraper_assets(item_id);
CREATE INDEX IF NOT EXISTS idx_scraper_assets_type ON public.scraper_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_scraper_metadata_item ON public.scraper_metadata(item_id);

-- ============================================
-- 3. UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION scraper_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_scraper_jobs_updated_at BEFORE UPDATE ON public.scraper_jobs
  FOR EACH ROW EXECUTE FUNCTION scraper_update_timestamp();
CREATE TRIGGER trg_scraper_items_updated_at BEFORE UPDATE ON public.scraper_items
  FOR EACH ROW EXECUTE FUNCTION scraper_update_timestamp();
CREATE TRIGGER trg_scraper_collections_updated_at BEFORE UPDATE ON public.scraper_collections
  FOR EACH ROW EXECUTE FUNCTION scraper_update_timestamp();

-- ============================================
-- 4. ROW LEVEL SECURITY (open policies — matches Epic Dash convention)
-- ============================================

ALTER TABLE public.scraper_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to scraper_collections" ON public.scraper_collections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to scraper_jobs" ON public.scraper_jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to scraper_items" ON public.scraper_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to scraper_assets" ON public.scraper_assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to scraper_metadata" ON public.scraper_metadata FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 5. REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.scraper_jobs;

-- ============================================
-- 6. STORAGE BUCKET (shared by Scraper + Remix, PRIVATE)
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'epic-assets', 'epic-assets', false, 524288000,
  ARRAY[
    'video/mp4','video/webm',
    'image/jpeg','image/png','image/webp','image/gif','image/svg+xml',
    'audio/mpeg','audio/mp3','audio/wav',
    'application/pdf',
    'text/plain','text/html','text/css','text/csv','text/vtt','text/markdown',
    'application/json','application/xml',
    'application/octet-stream'
  ]
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "epic_assets_read" ON storage.objects FOR SELECT USING (bucket_id = 'epic-assets' AND auth.role() = 'authenticated');
CREATE POLICY "epic_assets_write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'epic-assets' AND auth.role() = 'authenticated');
CREATE POLICY "epic_assets_update" ON storage.objects FOR UPDATE USING (bucket_id = 'epic-assets' AND auth.role() = 'authenticated');
CREATE POLICY "epic_assets_delete" ON storage.objects FOR DELETE USING (bucket_id = 'epic-assets' AND auth.role() = 'authenticated');

NOTIFY pgrst, 'reload schema';
