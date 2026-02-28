# 🎬 EPIC REMIX — AI Video Remixing Module
## Production Specification for Claude Code Agent Teams

> **Module Name**: Epic Remix
> **Parent App**: Epic Dash (Next.js 14+ App Router)
> **Version**: 4.0 (Repository-Connected — No Built-In Scraper)
> **Date**: February 27, 2026
> **Database**: Supabase (shared instance with Epic Dash)
> **Deployment**: Netlify (web) + Railway (worker — shared with Epic Scraper)
> **Auth**: Inherited from Epic Dash — no auth logic in this module
> **Data Source**: Pulls from Epic Scraper's repository (`scraper_items`, `scraper_assets`)

---

## TABLE OF CONTENTS

1. [Module Overview](#1-module-overview)
2. [Architecture](#2-architecture)
3. [Integration Points](#3-integration-points)
4. [How Epic Remix Connects to Epic Scraper](#4-how-epic-remix-connects-to-epic-scraper)
5. [Database Schema](#5-database-schema)
6. [Zod Validation Schemas](#6-zod-validation-schemas)
7. [API Routes](#7-api-routes)
8. [Pipeline Architecture](#8-pipeline-architecture)
9. [API Integration Specs](#9-api-integration-specs)
10. [Frontend — Pages & Components](#10-frontend--pages--components)
11. [File Storage Strategy](#11-file-storage-strategy)
12. [Cost Estimation Engine](#12-cost-estimation-engine)
13. [Worker Architecture](#13-worker-architecture)
14. [Environment Variables](#14-environment-variables)
15. [Error Handling & Resilience](#15-error-handling--resilience)
16. [Logging](#16-logging)
17. [Build Phases](#17-build-phases)
18. [Known Constraints & Workarounds](#18-known-constraints--workarounds)
19. [Agent Team Configuration](#19-agent-team-configuration)

---

## 1. MODULE OVERVIEW

### What This Module Does

Epic Remix takes video/audio content FROM the Epic Scraper repository and runs it through an AI-powered remixing pipeline:

1. **Select source material** from the Scraper Library (YouTube videos with transcripts, audio files, etc.)
2. **Remix titles** — generate 8 AI title variations (Google Gemini)
3. **Remix thumbnails** — generate 3 AI thumbnail variations (fal.ai FLUX)
4. **Remix script** — rewrite transcript into scene-based script (Google Gemini)
5. **Generate voiceover** — convert script to audio per scene (ElevenLabs)
6. **Generate avatar video** — AI talking-head video per scene (HeyGen)
7. **Generate B-roll** — AI video clips per scene description (Runway ML / Kling)
8. **Assemble final video** — combine all assets into one rendered MP4 (FFmpeg + Remotion)

### What This Module Does NOT Do

- **No scraping.** Epic Remix does not download anything from the internet. It pulls from the Scraper Repository.
- **No auth.** Epic Dash handles authentication and authorization.
- **No user management.** Epic Dash handles users.
- **No standalone deployment.** This is a module inside Epic Dash.

### Core Flow

```
SCRAPER REPOSITORY (scraper_items + scraper_assets)
  │
  ├── User selects video/transcript item from Library
  │
  ├─→ REMIX TITLE: 8 AI title variations (Gemini)
  ├─→ REMIX THUMBNAIL: 3 AI thumbnails (fal.ai FLUX)
  ├─→ REMIX SCRIPT: Rewrite transcript → scene-based script (Gemini)
  │
  ├─→ ⛔ USER APPROVAL GATE ⛔ (must select title + thumbnail + approve script + pick voice/avatar)
  │
  ├─→ VOICEOVER: Script → audio per scene (ElevenLabs)
  ├─→ AVATAR VIDEO: Talking head per scene (HeyGen)
  ├─→ B-ROLL: AI video clips per scene (Runway ML / Kling)
  │
  └─→ ASSEMBLE: Avatar + B-roll + audio → final MP4 (FFmpeg + Remotion)

OUTPUT: Downloadable remixed video + all intermediate assets
```

---

## 2. ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│                    EPIC DASH (Netlify)               │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  EPIC REMIX MODULE                          │    │
│  │  ┌───────────┐  ┌────────────────────────┐  │    │
│  │  │ Sidebar:  │  │ Pages:                  │  │    │
│  │  │ - Remix   │  │ /org/[orgId]/remix/     │  │    │
│  │  └───────────┘  └───────────┬────────────┘  │    │
│  │                             │               │    │
│  │  ┌──────────────────────────┴────────┐      │    │
│  │  │  API Routes: /api/remix/          │      │    │
│  │  │  Enqueue jobs → Redis → Worker    │      │    │
│  │  └──────────────────────────┬────────┘      │    │
│  └─────────────────────────────┼───────────────┘    │
│                                │                    │
│  EPIC SCRAPER REPOSITORY ←─────┤ (reads from        │
│  (scraper_items,               │  scraper database)  │
│   scraper_assets)              │                    │
└────────────────────────────────┼────────────────────┘
                                 │
    ┌────────────────────────────┼──────────────────┐
    │  RAILWAY (Shared Worker Service)               │
    │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────┐  │
    │  │Remix │ │Voice │ │Avatar│ │  Render      │  │
    │  │Worker│ │Worker│ │Worker│ │  Worker      │  │
    │  └──┬───┘ └──┬───┘ └──┬───┘ └──────┬───────┘  │
    │     └────────┴────────┴─────────────┘          │
    │            ↓                                   │
    │     ┌─────────────┐                            │
    │     │   Redis     │                            │
    │     └─────────────┘                            │
    └────────────────────────────────────────────────┘
              │
    ┌─────────┴──────────────────────────────┐
    │        SUPABASE (Shared with Epic Dash) │
    │  ┌──────────┐  ┌─────────────────────┐  │
    │  │ Postgres  │  │   Storage           │  │
    │  │ (remix_   │  │   (remix/ bucket)   │  │
    │  │  tables)  │  │                     │  │
    │  └──────────┘  └─────────────────────┘  │
    └─────────────────────────────────────────┘

EXTERNAL APIs: Gemini, fal.ai, ElevenLabs, HeyGen, Runway ML, Kling
```

---

## 3. INTEGRATION POINTS

### Sidebar Navigation

Epic Remix adds ONE item to the Epic Dash sidebar:

```
Existing Sidebar:
├── Dashboard
├── Booking
├── ...
├── 🕷️ Scraper
├── 📚 Library
├── ─────────────
├── 🎬 Remix          ← NEW
```

### Routing

```
/org/[orgId]/remix                    → Remix dashboard (projects list)
/org/[orgId]/remix/new                → New project (select source from Library)
/org/[orgId]/remix/[projectId]        → Project detail — pipeline view
/org/[orgId]/remix/[projectId]/scrape → Source material review
/org/[orgId]/remix/[projectId]/remix  → Title + thumbnail + script remix
/org/[orgId]/remix/[projectId]/generate → Voice + avatar + B-roll generation
/org/[orgId]/remix/[projectId]/assemble → Video assembly + render
/org/[orgId]/remix/[projectId]/review → Final review + download
```

### Design

**Match Epic Dash's existing design exactly.** Same as Epic Scraper — Claude Code must study the existing codebase and replicate patterns.

---

## 4. HOW EPIC REMIX CONNECTS TO EPIC SCRAPER

This is the critical integration. Epic Remix does NOT scrape. It reads from Epic Scraper's database.

### Source Material Selection

When creating a new Remix project, the user picks source material from the Scraper Library:

```typescript
// The "New Project" page queries the Scraper Repository for video/audio items:
const { data: videoItems } = await supabase
  .from('scraper_items')
  .select(`
    *,
    scraper_assets(*)
  `)
  .eq('org_id', orgId)
  .in('content_type', ['video', 'audio'])
  .order('created_at', { ascending: false });

// User picks one or more items → creates a remix_project linked to those items
```

### What Epic Remix Reads from Scraper

| Scraper Table | What Remix Uses |
|---|---|
| `scraper_items.body_text` | The transcript text (for script remixing) |
| `scraper_items.title` | Original title (for title remixing) |
| `scraper_items.description` | Context for AI prompts |
| `scraper_assets` (type='video') | Original video file path (for reference) |
| `scraper_assets` (type='thumbnail') | Original thumbnail (for thumbnail analysis) |
| `scraper_assets` (type='audio') | Original audio (if audio-only source) |
| `scraper_items.structured_data_json` | Tags, categories, channel info |

### The Link

```sql
-- remix_projects has a foreign key to scraper_items:
remix_sources.scraper_item_id → scraper_items.id
```

Epic Remix NEVER writes to scraper tables. It only reads. It writes to its own `remix_` prefixed tables.

---

## 5. DATABASE SCHEMA

All tables prefixed `remix_`.

**⚠️ MIGRATION ORDERING**: The Remix migration MUST run AFTER the Epic Scraper migration because `remix_sources` has a foreign key to `scraper_items`. If your migration tool runs alphabetically, name the files:
- `001_scraper_tables.sql` (Epic Scraper)
- `002_remix_tables.sql` (Epic Remix)

### Migration: Remix Tables

```sql
-- ============================================
-- REMIX PROJECTS
-- ============================================
CREATE TABLE public.remix_projects (
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

-- ============================================
-- REMIX SOURCES (link between remix project and scraper items)
-- ============================================
CREATE TABLE public.remix_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.remix_projects(id) ON DELETE CASCADE,
  scraper_item_id UUID NOT NULL REFERENCES public.scraper_items(id),
  -- Cached from scraper at time of project creation (so remix works even if scraper item is deleted)
  cached_title TEXT,
  cached_transcript TEXT,
  cached_description TEXT,
  cached_video_path TEXT,                   -- Supabase Storage path from scraper_assets
  cached_thumbnail_path TEXT,               -- Supabase Storage path from scraper_assets
  cached_audio_path TEXT,
  -- Status
  is_primary BOOLEAN DEFAULT true,          -- Primary source for this project
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, scraper_item_id)
);

-- ============================================
-- REMIX TITLES (AI-generated title variations)
-- ============================================
CREATE TABLE public.remix_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.remix_projects(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.remix_sources(id) ON DELETE CASCADE,
  style TEXT NOT NULL,
  title TEXT NOT NULL,
  reasoning TEXT,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- REMIX THUMBNAILS (AI-generated thumbnail variations)
-- ============================================
CREATE TABLE public.remix_thumbnails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.remix_projects(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.remix_sources(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  analysis TEXT,
  file_path TEXT NOT NULL,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- REMIX SCRIPTS (AI-rewritten scripts)
-- ============================================
CREATE TABLE public.remix_scripts (
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

-- ============================================
-- REMIX SCENES (part of a remix script)
-- ============================================
CREATE TABLE public.remix_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES public.remix_scripts(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  dialogue_line TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  broll_description TEXT NOT NULL,
  on_screen_text TEXT,
  -- Generated asset paths (filled during generation phase)
  audio_file_path TEXT,
  avatar_video_path TEXT,
  broll_video_path TEXT,
  -- Per-scene status
  audio_status TEXT DEFAULT 'pending' CHECK (audio_status IN ('pending', 'processing', 'complete', 'error')),
  avatar_status TEXT DEFAULT 'pending' CHECK (avatar_status IN ('pending', 'processing', 'complete', 'error')),
  broll_status TEXT DEFAULT 'pending' CHECK (broll_status IN ('pending', 'processing', 'complete', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(script_id, scene_number)
);

-- ============================================
-- REMIX RENDERED VIDEOS (final output)
-- ============================================
CREATE TABLE public.remix_rendered_videos (
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

-- ============================================
-- REMIX JOBS (async job tracking for pipeline stages)
-- ============================================
CREATE TABLE public.remix_jobs (
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

-- ============================================
-- REMIX API USAGE (cost tracking)
-- ============================================
CREATE TABLE public.remix_api_usage (
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
CREATE INDEX idx_remix_projects_org ON public.remix_projects(org_id);
CREATE INDEX idx_remix_sources_project ON public.remix_sources(project_id);
CREATE INDEX idx_remix_sources_scraper ON public.remix_sources(scraper_item_id);
CREATE INDEX idx_remix_titles_project ON public.remix_titles(project_id);
CREATE INDEX idx_remix_titles_selected ON public.remix_titles(project_id) WHERE is_selected = true;
CREATE INDEX idx_remix_thumbnails_project ON public.remix_thumbnails(project_id);
CREATE INDEX idx_remix_scripts_project ON public.remix_scripts(project_id);
CREATE INDEX idx_remix_scenes_script ON public.remix_scenes(script_id);
CREATE INDEX idx_remix_scenes_order ON public.remix_scenes(script_id, scene_number);
CREATE INDEX idx_remix_jobs_project ON public.remix_jobs(project_id);
CREATE INDEX idx_remix_jobs_status ON public.remix_jobs(status) WHERE status IN ('queued', 'processing');
CREATE INDEX idx_remix_api_usage_project ON public.remix_api_usage(project_id);
CREATE INDEX idx_remix_api_usage_service ON public.remix_api_usage(service);

-- ============================================
-- TRIGGERS
-- ============================================
-- Create function if it doesn't exist (may already exist from Scraper migration)
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
-- RLS — Same pattern as Epic Scraper: adapt to match Epic Dash
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

-- AGENT: Look at Epic Dash's existing RLS patterns and replicate them for these tables.

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.remix_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.remix_scenes;
```

---

## 6. ZOD VALIDATION SCHEMAS

```typescript
// src/lib/remix/validators.ts
import { z } from 'zod';

export const CreateRemixProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  scraperItemIds: z.array(z.string().uuid()).min(1).max(10),  // Items from Scraper Library
  settings: z.object({
    aspect_ratio: z.enum(['16:9', '9:16']).default('16:9'),
    voice_id: z.string().nullable().default(null),
    avatar_id: z.string().nullable().default(null),
  }).optional(),
});

export const RemixTitleRequestSchema = z.object({
  sourceId: z.string().uuid(),
});

export const RemixThumbnailRequestSchema = z.object({
  sourceId: z.string().uuid(),
  customPromptModifier: z.string().max(500).optional(),
});

export const RemixScriptRequestSchema = z.object({
  sourceId: z.string().uuid(),
  selectedTitleId: z.string().uuid().optional(),
  tone: z.enum(['professional', 'casual', 'energetic', 'educational', 'storytelling']).optional(),
});

export const GenerateAudioRequestSchema = z.object({
  sceneId: z.string().uuid(),
  voiceId: z.string().min(1),
  voiceSettings: z.object({
    stability: z.number().min(0).max(1).default(0.5),
    similarity_boost: z.number().min(0).max(1).default(0.75),
    style: z.number().min(0).max(1).default(0.5),
  }).optional(),
});

export const GenerateAvatarRequestSchema = z.object({
  sceneId: z.string().uuid(),
  avatarId: z.string().min(1),
  background: z.object({
    type: z.enum(['color', 'image', 'transparent']),
    value: z.string().optional(),
  }).default({ type: 'color', value: '#0A0A0B' }),
  aspectRatio: z.enum(['16:9', '9:16']).default('16:9'),
});

export const GenerateBRollRequestSchema = z.object({
  sceneId: z.string().uuid(),
  provider: z.enum(['runway', 'kling', 'auto']).default('auto'),
  durationSeconds: z.number().int().min(2).max(8).default(4),
});

export const RenderRequestSchema = z.object({
  projectId: z.string().uuid(),
  sourceId: z.string().uuid(),
  scriptId: z.string().uuid(),
  includeIntro: z.boolean().default(true),
  includeOutro: z.boolean().default(true),
});

export const CancelJobSchema = z.object({
  jobId: z.string().uuid(),
});
```

---

## 7. API ROUTES

All routes under `/api/remix/`.

```
# Projects
GET    /api/remix/projects                    → List remix projects
POST   /api/remix/projects                    → Create project (links to scraper items)
GET    /api/remix/projects/[id]               → Project detail with all related data
PATCH  /api/remix/projects/[id]               → Update project settings
DELETE /api/remix/projects/[id]               → Delete project + all generated assets

# Remix Stage
POST   /api/remix/title                       → Generate 8 title variations
POST   /api/remix/thumbnail                   → Generate 3 thumbnail variations
POST   /api/remix/script                      → Generate remixed script with scenes

# Generation Stage
POST   /api/remix/audio/generate              → Generate voiceover per scene
GET    /api/remix/audio/voices                → List ElevenLabs voices (cached)
POST   /api/remix/audio/preview               → Preview voice with sample text
POST   /api/remix/avatar/generate             → Generate avatar video per scene
GET    /api/remix/avatar/avatars              → List HeyGen avatars (cached)
GET    /api/remix/avatar/status/[jobId]       → Avatar generation status
POST   /api/remix/avatar/cancel               → Cancel avatar generation
POST   /api/remix/broll/generate              → Generate B-roll clip per scene
GET    /api/remix/broll/status/[jobId]        → B-roll generation status
POST   /api/remix/broll/cancel                → Cancel B-roll generation

# Assembly Stage
POST   /api/remix/render                      → Trigger final video render
GET    /api/remix/render/status/[jobId]       → Render progress
POST   /api/remix/render/cancel               → Cancel render

# Webhooks (called by external services — no auth)
POST   /api/remix/webhooks/heygen             → HeyGen completion callback
POST   /api/remix/webhooks/runway             → Runway completion callback

# Utility
GET    /api/remix/cost-estimate               → Estimate cost for a project
GET    /api/remix/health                      → Health check

# Library Bridge (read-only access to scraper data)
GET    /api/remix/library/videos              → List video/audio items from scraper repository
GET    /api/remix/library/[itemId]            → Get scraper item detail for remix source selection
```

---

## 8. PIPELINE ARCHITECTURE

### Pipeline State Machine

```
draft → remixing → awaiting_approval → generating → assembling → complete
                       │                                   │
                       └── user reviews & approves ────────┘
                                                           ↓
                                                        error (any stage)
```

### The Approval Gate

**CRITICAL**: After remixing (titles + thumbnails + script), the pipeline PAUSES at `awaiting_approval`. The user MUST:

1. Select a title variation (or edit one)
2. Select a thumbnail (or regenerate)
3. Review and approve the script (or edit scenes)
4. Select a voice (ElevenLabs)
5. Select an avatar (HeyGen)

Only then can they click "Generate" to proceed. The generate endpoints MUST verify these selections exist before processing.

### Job Queue Design

```typescript
// Shared worker with Epic Scraper — same Redis connection
export const remixQueue = new Queue('epic-remix', { connection });
export const generateQueue = new Queue('epic-generate', { connection });
export const renderQueue = new Queue('epic-render', { connection });
```

### Concurrency Limits

```
Title remix:        max 5 concurrent (Gemini is fast)
Thumbnail remix:    max 3 concurrent (fal.ai queue)
Script remix:       max 3 concurrent (Gemini, larger context)
Audio generation:   max 5 concurrent scenes (ElevenLabs is fast)
Avatar generation:  max 2 concurrent scenes (HeyGen is expensive + slow)
B-roll generation:  max 3 concurrent scenes (Runway queue)
Video render:       max 1 at a time (CPU-intensive)
```

---

## 9. API INTEGRATION SPECS

### Google Gemini (Title + Script Remix)

```typescript
// Model: gemini-2.0-flash (fast, cheap, good for text)
// Use @google/generative-ai npm package
// JSON mode with structured output for reliable parsing
// Temperature 0.8 for creative title variations
// Temperature 0.6 for script rewriting (more faithful to source)

// Title remix: 8 variations across categories:
// Curiosity Gap, Direct Value, Contrarian, Listicle,
// Question, Emotional Hook, Tutorial/How-To, Story-Driven

// Script remix: Rewrite transcript into scene-based script
// Each scene: 15-45 seconds dialogue, B-roll description, optional on-screen text
```

### fal.ai (Thumbnail Generation)

```typescript
// Use @fal-ai/serverless-client
// Model: fal-ai/flux/dev
// Workflow:
// 1. Analyze original thumbnail with Gemini Vision (base64 inline, no URL needed)
// 2. Generate image prompt from analysis + remixed title context
// 3. Generate 3 thumbnails at 1280x720
// 4. Upload to Supabase Storage
```

### ElevenLabs (Voiceover)

```typescript
// Direct REST API — NOT the npm package
// POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
// Output: mp3_44100_128
// Generate per scene individually (enables re-recording)
// Concatenate via FFmpeg for full track
```

### HeyGen (Avatar Video) — CRITICAL SECURITY PATTERN

```typescript
// NEVER use public URLs for audio delivery. NEVER.
// Use HeyGen's Upload Asset API:
//
// 1. Download audio from Supabase Storage to /tmp (via service role key)
// 2. Upload audio to HeyGen: POST https://upload.heygen.com/v1/asset → audio_asset_id
// 3. Generate video using audio_asset_id (NOT audio_url)
// 4. Our storage stays 100% private. HeyGen has its own internal copy.
//
// Webhook: POST /api/remix/webhooks/heygen on completion
// Fallback: Poll every 15s if webhook doesn't fire within 5 minutes
// Cancel: Mark as cancelled in DB, ignore webhook when it arrives
```

### Runway ML (B-Roll)

```typescript
// POST https://api.runwayml.com/v1/image-to-video
// Prompt: B-roll description from scene
// Duration: 4 seconds
// Webhook: POST /api/remix/webhooks/runway
// Provider fallback: If 3 consecutive Runway failures → switch to Kling for remaining scenes
// For reference images: Use Supabase signed URLs (10-min expiry)
```

### Secure File Delivery Summary

| External API | Method | Details |
|---|---|---|
| **HeyGen** | Upload Asset API → `audio_asset_id` | Push file to HeyGen storage. Zero public exposure. |
| **Runway ML** | Signed URL (10-min expiry) | Supabase signed URL, auto-expires |
| **fal.ai** | Text prompt only | No file delivery needed |
| **ElevenLabs** | Text input only | We send text, receive audio binary |
| **Gemini** | Text / base64 inline | Image analysis via base64, no URL needed |

---

## 10. FRONTEND — PAGES & COMPONENTS

### Page: Remix Dashboard (`/org/[orgId]/remix`)

- List of all remix projects as cards
- Each card: project name, source title, status badge, created date, thumbnail preview
- "New Project" button → navigates to source selection
- Filter by status

### Page: New Project (`/org/[orgId]/remix/new`)

- **Source Selector**: Grid/list of video/audio items from Scraper Library
  - Queries `scraper_items` where `content_type IN ('video', 'audio')` and `org_id` matches
  - Shows: thumbnail, title, source type, transcript preview, scraped date
  - User selects one or more items
- **Project Name** input
- **Create** button → creates `remix_project` + `remix_sources` (with cached data)

### Page: Project Pipeline (`/org/[orgId]/remix/[projectId]`)

5-step horizontal pipeline stepper at the top:

```
[1. Source] → [2. Remix] → [3. Approve] → [4. Generate] → [5. Review]
```

Each step has visual states: locked (gray), active (accent), complete (green check), error (red).

### Sub-pages (tabs within project):

**Source Tab** (`/remix/[projectId]/scrape`):
- Shows original source material from scraper
- Video player (if video), transcript display, metadata
- "This came from the Scraper Library" badge with link back

**Remix Tab** (`/remix/[projectId]/remix`):
- Split-pane comparison: Original (left) vs Remixed (right)
- Title variations (8 cards, select one, edit inline, regenerate)
- Thumbnail grid (3 variations, select one, regenerate with custom prompt)
- Script editor with scene breakdown (edit dialogue, B-roll descriptions, timing)
- "Approve & Continue" button (enables Generate stage)

**Generate Tab** (`/remix/[projectId]/generate`):
- Voice selector (ElevenLabs voices with preview playback)
- Avatar selector (HeyGen avatars with preview)
- Cost estimation widget showing breakdown per service
- Per-scene generation progress cards
- "Generate All" button + individual scene regenerate

**Assemble Tab** (`/remix/[projectId]/assemble`):
- Visual timeline showing scene order (avatar → B-roll alternating)
- Render button with progress bar
- Preview of scene clips before full render

**Review Tab** (`/remix/[projectId]/review`):
- Full video player with seek support (signed URL)
- Download button
- Project cost summary
- "Start New Remix" (same source, fresh remix)

### Components

```
src/components/remix/
├── ProjectCard.tsx            # Project card for dashboard
├── SourceSelector.tsx         # Pick items from Scraper Library
├── PipelineStepper.tsx        # Horizontal 5-step progress indicator
├── TitleVariations.tsx        # 8 title cards with select/edit
├── ThumbnailGrid.tsx          # 3 thumbnail cards with select/regenerate
├── ScriptEditor.tsx           # Scene-based script editor
├── SceneTimeline.tsx          # Visual timeline of scenes
├── VoiceSelector.tsx          # ElevenLabs voice picker with preview
├── AvatarSelector.tsx         # HeyGen avatar picker
├── CostEstimator.tsx          # Floating cost breakdown widget
├── JobProgress.tsx            # Real-time job progress card
├── VideoPlayer.tsx            # HTML5 video with signed URL + seek support
├── RenderProgress.tsx         # Render progress bar with ETA
└── ComparisonPane.tsx         # Split-pane original vs remixed
```

---

## 11. FILE STORAGE STRATEGY

All paths under `remix/` in Supabase Storage:

```
{bucket}/
└── remix/
    └── {org_id}/
        └── {project_id}/
            ├── thumbnails/
            │   ├── remix-1.png
            │   ├── remix-2.png
            │   └── remix-3.png
            ├── audio/
            │   ├── scene-001.mp3
            │   ├── scene-002.mp3
            │   └── full-voiceover.mp3
            ├── avatars/
            │   └── scene-001.mp4
            ├── broll/
            │   └── scene-001.mp4
            └── rendered/
                └── final.mp4
```

```typescript
// src/lib/remix/storage.ts
export function remixStoragePath(orgId: string, projectId: string, ...segments: string[]): string {
  return ['remix', orgId, projectId, ...segments].join('/');
}
```

---

## 12. COST ESTIMATION ENGINE

```typescript
// src/lib/remix/cost-estimator.ts
export const PRICING = {
  gemini: {
    input_per_1m_tokens: 0.075,
    output_per_1m_tokens: 0.30,
    avg_title_remix_tokens: 2000,
    avg_script_remix_tokens: 8000,
    avg_thumbnail_analysis_tokens: 3000,
  },
  fal_ai: { per_image: 0.03, images_per_video: 3 },
  elevenlabs: { per_1k_characters: 0.30, avg_characters_per_scene: 500 },
  heygen: { per_minute: 0.10 },
  runway: { per_generation: 0.05 },
};

export function estimateProjectCost(scenes: number, avgSceneDuration: number) {
  const breakdown = {
    'Title Remix (Gemini)': PRICING.gemini.avg_title_remix_tokens * PRICING.gemini.output_per_1m_tokens / 1000,
    'Thumbnails (fal.ai)': PRICING.fal_ai.per_image * PRICING.fal_ai.images_per_video,
    'Script Remix (Gemini)': PRICING.gemini.avg_script_remix_tokens * PRICING.gemini.output_per_1m_tokens / 1000,
    'Voiceover (ElevenLabs)': scenes * PRICING.elevenlabs.avg_characters_per_scene * PRICING.elevenlabs.per_1k_characters / 1000,
    'Avatar (HeyGen)': scenes * (avgSceneDuration / 60) * PRICING.heygen.per_minute,
    'B-Roll (Runway)': scenes * PRICING.runway.per_generation,
  };
  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  return { breakdown, total: Math.round(total * 100) / 100 };
}
// ~$2-5 per video (15 scenes, 30s avg)
```

---

## 13. WORKER ARCHITECTURE

### Shared Worker with Epic Scraper

The Railway worker service runs BOTH Epic Scraper and Epic Remix workers. Single Dockerfile, single deployment, multiple BullMQ worker instances.

### Worker Entry Point

```typescript
// src/worker/index.ts
// Main entry — starts all workers

import { scraperWorker } from './scraper-worker';
import { remixWorker } from './remix-worker';
import { generateWorker } from './generate-worker';
import { renderWorker } from './render-worker';
import { logger } from '../lib/logger';

const workers = [scraperWorker, remixWorker, generateWorker, renderWorker];

workers.forEach(w => {
  w.on('completed', (job) => logger.info(`${w.name}: ${job.id} completed`));
  w.on('failed', (job, err) => logger.error(`${w.name}: ${job?.id} failed`, { error: err.message }));
});

logger.info(`Workers started: ${workers.map(w => w.name).join(', ')}`);

process.on('SIGTERM', async () => {
  await Promise.all(workers.map(w => w.close()));
  process.exit(0);
});
```

### Shared Dockerfile (updated from Epic Scraper)

Same as Epic Scraper Dockerfile — already includes ffmpeg, yt-dlp, chromium. Add Remotion env vars:

```dockerfile
# Add to the Epic Scraper Dockerfile:
ENV REMOTION_CHROMIUM_EXECUTABLE=/usr/bin/chromium
```

### Worker tsconfig

```json
// tsconfig.worker.json (shared — includes both scraper and remix worker code + all shared libs)
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "module": "commonjs",
    "moduleResolution": "node",
    "paths": {}
  },
  "include": [
    "src/worker/**/*",
    "src/lib/scraper/**/*",
    "src/lib/remix/**/*",
    "src/lib/queue/**/*",
    "src/lib/logger.ts",
    "src/lib/utils/**/*"
  ]
}
```

### Temp File Lifecycle

Every worker handler MUST:
```typescript
const tmpDir = `/tmp/remix/${projectId}`;
mkdirSync(tmpDir, { recursive: true });
try {
  // ... do work ...
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
```

---

## 14. ENVIRONMENT VARIABLES

Epic Remix needs these (in addition to Epic Dash + Epic Scraper env vars):

```bash
# AI APIs (all required for remix pipeline)
GOOGLE_GEMINI_API_KEY=AIza...
FAL_KEY=fal_...
ELEVENLABS_API_KEY=sk_...
HEYGEN_API_KEY=...
RUNWAY_API_KEY=...
KLING_API_KEY=...                   # Optional fallback for B-roll

# Redis (Upstash — same instance as Epic Scraper, shared)
REDIS_URL=rediss://default:xxxxx@us1-xxxxx.upstash.io:6379

# Worker bridge (same Railway worker as Epic Scraper)
WORKER_URL=https://your-worker.up.railway.app
WORKER_SECRET=same-secret-as-scraper

# Webhook base URL (NETLIFY URL — HeyGen/Runway POST here, NOT Railway)
WEBHOOK_BASE_URL=https://epictours.netlify.app

# Chromium (for Remotion video rendering — Railway worker only)
CHROMIUM_PATH=/usr/bin/chromium
REMOTION_CHROMIUM_EXECUTABLE=/usr/bin/chromium
```

---

## 15. ERROR HANDLING & RESILIENCE

### Retry Utility

```typescript
// src/lib/utils/retry.ts (shared with Epic Scraper)
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { maxRetries?: number; backoffMs?: number; label: string }
): Promise<T> {
  const { maxRetries = 3, backoffMs = 1000, label } = opts;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try { return await fn(); }
    catch (error: any) {
      if (attempt === maxRetries) throw error;
      if (error.status === 401 || error.status === 403) throw error;
      const delay = backoffMs * Math.pow(2, attempt - 1) + Math.random() * 500;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}
```

### Dead Letter Handling

Failed jobs after max retries: Update to `error` in database. All intermediate assets preserved. Retrying re-runs only the failed step.

---

## 16. LOGGING

```typescript
// Shared logger from src/lib/logger.ts
export const remixLogger = logger.child({ module: 'remix' });
export const generateLogger = logger.child({ module: 'generate' });
export const renderLogger = logger.child({ module: 'render' });

// ALL remix code uses domain-specific loggers, never console.log
```

---

## 17. BUILD PHASES

### Phase 1: Foundation + Scraper Bridge (~3 hours)

- [ ] Database migration — all `remix_` tables
- [ ] RLS policies matching Epic Dash
- [ ] Storage paths configured
- [ ] Sidebar item added (Remix)
- [ ] Page shells at correct routes
- [ ] API route stubs
- [ ] Zod schemas file
- [ ] Library bridge endpoint (reads scraper_items for source selection)
- [ ] BullMQ queues created (remix, generate, render)
- [ ] Pipeline stepper component

**✅ Checkpoint**: Navigate to Remix page, see empty state. Click New Project → see scraper library items. Create project linked to a scraper item.

### Phase 2: Remix Pipeline (~4 hours)

- [ ] Gemini title variations (8x JSON mode)
- [ ] Gemini Vision + fal.ai thumbnail generation (3x at 1280x720)
- [ ] Gemini script rewriting with scene splitting
- [ ] Remix tab UI: title cards, thumbnail grid, script editor
- [ ] Select/edit/regenerate for all remix types
- [ ] Approval gate enforcement

**✅ Checkpoint**: 8 title variations, 3 thumbnails, editable scene script. Can approve.

### Phase 3: Generation Pipeline (~6 hours)

- [ ] ElevenLabs voice list + per-scene audio generation
- [ ] HeyGen Upload Asset API → avatar video per scene
- [ ] Runway B-roll per scene with Kling fallback
- [ ] Webhook endpoints for HeyGen + Runway
- [ ] Generate tab UI: voice picker, avatar picker, progress cards
- [ ] Cost estimator widget
- [ ] Cancel endpoints

**✅ Checkpoint**: Hear voiceover, see avatar video, see B-roll clips. Cost matches estimate.

### Phase 4: Video Assembly (~4 hours)

- [ ] FFmpeg normalization (all inputs → 1080p 30fps H.264)
- [ ] Remotion composition (avatar/B-roll alternating, continuous audio)
- [ ] Text overlays from on_screen_text
- [ ] Render at 1920x1080 30fps MP4
- [ ] Upload to Supabase Storage
- [ ] Assemble tab + Review tab UI
- [ ] Video player with seek support

**✅ Checkpoint**: Click Render → progress bar → final video plays → download works.

### Phase 5: Polish (~2 hours)

- [ ] Error states, empty states, loading skeletons on every component
- [ ] Realtime updates via Supabase subscriptions
- [ ] Cost tracking in remix_api_usage table
- [ ] Health check endpoint
- [ ] Full end-to-end test: Select from library → remix → generate → render → download

**✅ Checkpoint**: Complete end-to-end flow is smooth and polished.

---

## 18. KNOWN CONSTRAINTS & WORKAROUNDS

| Constraint | Impact | Workaround |
|---|---|---|
| Netlify Function timeout | Can't process in API routes | Enqueue to BullMQ on Railway |
| HeyGen audio delivery | Needs accessible audio | Upload Asset API → audio_asset_id (private) |
| Remotion needs Chromium | Not in default containers | Railway Dockerfile installs Chromium |
| Supabase 50MB file limit (free) | Large rendered videos | Supabase Pro or compress output |
| HeyGen no cancel API | Can't stop after submit | Mark cancelled locally, ignore webhook |
| Runway rate limits | Slow B-roll at scale | Auto-fallback to Kling |
| Worker path aliases | `@/` doesn't work outside Next.js | tsconfig.worker.json with relative paths |
| Source deleted from Scraper | Remix loses source data | Cached data in remix_sources at project creation |

---

## 19. AGENT TEAM CONFIGURATION

### How This Module Is Built

Epic Remix is built using Claude Code **Agent Teams** across 4 sessions (Steps 6-9 in DEPLOYMENT_GUIDE.md). Each session spawns a team with the lead in **delegate mode** (Shift+Tab).

**Epic Remix can only start after Epic Scraper Step 3 completes** — the scraper_items table must exist and have data.

### Key Agent Teams Rules

Same as Epic Scraper (see CLAUDE.md). Critical additions:
- **"Send to Remix" cross-module**: Library item detail has a Link to `/org/[orgId]/remix/new?sourceItemId={id}`. Remix reads the query param to pre-select the source.
- **Sidebar coordination**: The remix-frontend teammate adds to the sidebar that the scraper-frontend teammate created. This is a shared file — the lead should sequence this task AFTER scraper is complete.

### Session Plan

| Deploy Guide Step | Teammates | What Gets Built |
|---|---|---|
| Step 6 (Phase 1) | 3: remix-database, remix-frontend-shell, remix-api-setup | Migration, page shells, source selector, project CRUD |
| Step 7 (Phase 2) | 3: title-remix, thumbnail-script, remix-ui | Gemini titles, fal.ai thumbnails, script, approval gate |
| Step 8 (Phase 3) | 4: voiceover, avatar, broll, generate-ui | ElevenLabs, HeyGen, Runway, generation UI |
| Step 9 (Phase 4) | 2: video-assembly, assembly-ui | FFmpeg, Remotion, render, video player |

See DEPLOYMENT_GUIDE.md for exact prompts and CLAUDE.md for file ownership.

---

## APPENDIX: ADDITIONAL DEPENDENCIES

```bash
# AI APIs
npm install @google/generative-ai @fal-ai/serverless-client

# Video
npm install @remotion/core @remotion/renderer @remotion/cli fluent-ffmpeg

# Queue (may already be installed for Epic Scraper)
npm install bullmq ioredis

# Already should exist from Epic Scraper:
# cheerio, pino, pino-pretty, zod
```

---

**END OF EPIC REMIX SPEC v4.0**
