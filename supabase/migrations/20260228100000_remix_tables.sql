-- ============================================
-- EPIC REMIX — Database Migration
-- Must run AFTER scraper migration (FK to scraper_items)
-- ============================================

-- REMIX PROJECTS
CREATE TABLE IF NOT EXISTS public.remix_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'remixing', 'awaiting_approval', 'generating', 'assembling', 'complete', 'error'
  )),
  settings JSONB NOT NULL DEFAULT '{
    "aspect_ratio": "16:9",
    "voice_id": null,
    "avatar_id": null,
    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.5},
    "target_resolution": "1080p"
  }'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REMIX SOURCES (link between remix project and scraper items)
CREATE TABLE IF NOT EXISTS public.remix_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.remix_projects(id) ON DELETE CASCADE,
  scraper_item_id UUID NOT NULL REFERENCES public.scraper_items(id),
  cached_title TEXT,
  cached_transcript TEXT,
  cached_description TEXT,
  cached_video_path TEXT,
  cached_thumbnail_path TEXT,
  cached_audio_path TEXT,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, scraper_item_id)
);

-- REMIX TITLES (AI-generated title variations)
CREATE TABLE IF NOT EXISTS public.remix_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.remix_projects(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.remix_sources(id) ON DELETE CASCADE,
  style TEXT NOT NULL,
  title TEXT NOT NULL,
  reasoning TEXT,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REMIX THUMBNAILS (AI-generated thumbnail variations)
CREATE TABLE IF NOT EXISTS public.remix_thumbnails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.remix_projects(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.remix_sources(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  analysis TEXT,
  file_path TEXT NOT NULL,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REMIX SCRIPTS (AI-rewritten scripts)
CREATE TABLE IF NOT EXISTS public.remix_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.remix_projects(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.remix_sources(id) ON DELETE CASCADE,
  full_script TEXT NOT NULL,
  tone TEXT,
  target_audience TEXT,
  total_duration_seconds INTEGER,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REMIX SCENES (part of a remix script)
CREATE TABLE IF NOT EXISTS public.remix_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES public.remix_scripts(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  dialogue_line TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  broll_description TEXT NOT NULL,
  on_screen_text TEXT,
  audio_file_path TEXT,
  avatar_video_path TEXT,
  broll_video_path TEXT,
  audio_status TEXT DEFAULT 'pending' CHECK (audio_status IN ('pending', 'processing', 'complete', 'error')),
  avatar_status TEXT DEFAULT 'pending' CHECK (avatar_status IN ('pending', 'processing', 'complete', 'error')),
  broll_status TEXT DEFAULT 'pending' CHECK (broll_status IN ('pending', 'processing', 'complete', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(script_id, scene_number)
);

-- REMIX RENDERED VIDEOS (final output)
CREATE TABLE IF NOT EXISTS public.remix_rendered_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.remix_projects(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.remix_sources(id) ON DELETE CASCADE,
  script_id UUID NOT NULL REFERENCES public.remix_scripts(id),
  file_path TEXT NOT NULL,
  duration_seconds INTEGER,
  resolution TEXT DEFAULT '1080p',
  file_size_bytes BIGINT,
  render_time_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REMIX JOBS (async job tracking for pipeline stages)
CREATE TABLE IF NOT EXISTS public.remix_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN (
    'remix_title', 'remix_thumbnail', 'remix_script',
    'generate_audio', 'generate_avatar', 'generate_broll',
    'render'
  )),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'complete', 'error', 'cancelled')),
  project_id UUID REFERENCES public.remix_projects(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.remix_sources(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES public.remix_scenes(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  result JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_by UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- REMIX API USAGE (cost tracking)
CREATE TABLE IF NOT EXISTS public.remix_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL CHECK (service IN ('gemini', 'fal_ai', 'elevenlabs', 'heygen', 'runway', 'kling')),
  endpoint TEXT NOT NULL,
  tokens_used INTEGER,
  characters_used INTEGER,
  minutes_used DECIMAL(10,2),
  cost_estimate DECIMAL(10,4) NOT NULL DEFAULT 0,
  project_id UUID REFERENCES public.remix_projects(id),
  org_id TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_remix_projects_org ON public.remix_projects(org_id);
CREATE INDEX IF NOT EXISTS idx_remix_sources_project ON public.remix_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_remix_sources_scraper ON public.remix_sources(scraper_item_id);
CREATE INDEX IF NOT EXISTS idx_remix_titles_project ON public.remix_titles(project_id);
CREATE INDEX IF NOT EXISTS idx_remix_titles_selected ON public.remix_titles(project_id) WHERE is_selected = true;
CREATE INDEX IF NOT EXISTS idx_remix_thumbnails_project ON public.remix_thumbnails(project_id);
CREATE INDEX IF NOT EXISTS idx_remix_scripts_project ON public.remix_scripts(project_id);
CREATE INDEX IF NOT EXISTS idx_remix_scenes_script ON public.remix_scenes(script_id);
CREATE INDEX IF NOT EXISTS idx_remix_scenes_order ON public.remix_scenes(script_id, scene_number);
CREATE INDEX IF NOT EXISTS idx_remix_jobs_project ON public.remix_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_remix_jobs_status ON public.remix_jobs(status) WHERE status IN ('queued', 'processing');
CREATE INDEX IF NOT EXISTS idx_remix_api_usage_project ON public.remix_api_usage(project_id);
CREATE INDEX IF NOT EXISTS idx_remix_api_usage_service ON public.remix_api_usage(service);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION scraper_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_remix_projects_updated BEFORE UPDATE ON public.remix_projects
  FOR EACH ROW EXECUTE FUNCTION scraper_update_timestamp();

-- ============================================
-- RLS — Open policies matching Epic Dash convention
-- ============================================
ALTER TABLE public.remix_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remix_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remix_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remix_thumbnails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remix_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remix_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remix_rendered_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remix_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remix_api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to remix_projects" ON public.remix_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to remix_sources" ON public.remix_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to remix_titles" ON public.remix_titles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to remix_thumbnails" ON public.remix_thumbnails FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to remix_scripts" ON public.remix_scripts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to remix_scenes" ON public.remix_scenes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to remix_rendered_videos" ON public.remix_rendered_videos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to remix_jobs" ON public.remix_jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to remix_api_usage" ON public.remix_api_usage FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.remix_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.remix_scenes;
