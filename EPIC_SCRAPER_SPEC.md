# 🕷️ EPIC SCRAPER — Universal Web Scraping Module
## Production Specification for Claude Code Agent Teams

> **Module Name**: Epic Scraper
> **Parent App**: Epic Dash (Next.js 14+ App Router)
> **Version**: 1.0
> **Date**: February 27, 2026
> **Database**: Supabase (shared instance with Epic Dash)
> **Deployment**: Netlify (web) + Railway (worker)
> **Auth**: Inherited from Epic Dash — no auth logic in this module

---

## TABLE OF CONTENTS

1. [Module Overview](#1-module-overview)
2. [Architecture](#2-architecture)
3. [Integration Points with Epic Dash](#3-integration-points-with-epic-dash)
4. [Database Schema](#4-database-schema)
5. [API Routes](#5-api-routes)
6. [Zod Validation Schemas](#6-zod-validation-schemas)
7. [Scraping Engines](#7-scraping-engines)
8. [Worker Architecture](#8-worker-architecture)
9. [Frontend — Pages & Components](#9-frontend--pages--components)
10. [File Storage Strategy](#10-file-storage-strategy)
11. [Environment Variables](#11-environment-variables)
12. [Error Handling & Resilience](#12-error-handling--resilience)
13. [Logging](#13-logging)
14. [Build Phases](#14-build-phases)
15. [Known Constraints & Workarounds](#15-known-constraints--workarounds)
16. [Agent Team Configuration](#16-agent-team-configuration)

---

## 1. MODULE OVERVIEW

### What This Module Does

Epic Scraper is a universal web scraping module inside Epic Dash. A user pastes any URL — a website, YouTube video, social media post, GitHub repo, Google Doc, blog article, or any other public link — and Epic Scraper harvests everything it can from that source: text, images, tables, videos, audio, metadata, HTML source, scripts, structured data, files, and documents.

All scraped data is stored in a structured **Scraper Repository** database. This repository is the central data warehouse that other Epic Dash modules (like Epic Remix) pull from.

### What This Module Does NOT Do

- No auth. Epic Dash handles all authentication and authorization.
- No user management. Epic Dash handles users.
- No standalone deployment. This is a module inside Epic Dash.
- No content remixing. That's Epic Remix's job. Epic Scraper only harvests and stores.

### Core User Flow

```
User pastes URL → Epic Scraper detects source type → Runs appropriate scraping engine
→ Extracts ALL harvestable data → Normalizes and stores in Scraper Repository
→ User can browse, search, tag, and organize collected data
→ Other modules (Epic Remix) can pull from the repository
```

### Source Types Supported

| Source Type | What Gets Scraped |
|---|---|
| **Any Website** | Full page text, all images, tables, meta tags, Open Graph data, structured data (JSON-LD), stylesheets, scripts, favicon, links, HTML source |
| **YouTube** | Video MP4, transcript (auto-captions via yt-dlp), title, description, thumbnail (all resolutions), tags, channel info, view count, duration, comments (top N) |
| **Social Media** | Post text, images, video, engagement metrics, author info, hashtags, comments. Supported: Twitter/X, Instagram (public), TikTok (public), Facebook (public), LinkedIn (public) |
| **GitHub** | Repository files, README, directory structure, commit history, issues, pull requests, package.json, languages used |
| **Google Docs/Drive** | Document text (if publicly shared), embedded images, formatting |
| **Blog/Article** | Article body text (cleaned), author, publish date, featured image, categories/tags, related articles |
| **PDF** | Extracted text, page count, images, metadata (author, title, creation date) |
| **Markdown** | Raw markdown, rendered HTML, frontmatter, embedded images |
| **RSS/Atom** | Feed entries with titles, descriptions, links, publish dates |

---

## 2. ARCHITECTURE

```
┌─────────────────────────────────────────────────────┐
│                    EPIC DASH (Netlify)               │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  EPIC SCRAPER MODULE                        │    │
│  │  ┌───────────┐  ┌────────────────────────┐  │    │
│  │  │ Sidebar:  │  │ Pages:                  │  │    │
│  │  │ - Scraper │  │ /org/[orgId]/scraper/   │  │    │
│  │  │ - Library │  │ /org/[orgId]/library/   │  │    │
│  │  └───────────┘  └───────────┬────────────┘  │    │
│  │                             │               │    │
│  │  ┌──────────────────────────┴────────┐      │    │
│  │  │  API Routes: /api/scraper/        │      │    │
│  │  │  Enqueue jobs → Redis → Worker    │      │    │
│  │  └──────────────────────────┬────────┘      │    │
│  └─────────────────────────────┼───────────────┘    │
│                                │                    │
└────────────────────────────────┼────────────────────┘
                                 │
    ┌────────────────────────────┼──────────────────┐
    │  RAILWAY (Worker Service)                      │
    │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────┐  │
    │  │  Web │ │Video │ │Social│ │  File/Doc    │  │
    │  │Scrape│ │Scrape│ │Scrape│ │   Scrape     │  │
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
    │  │ (scraper_ │  │   (scraper/ bucket) │  │
    │  │  tables)  │  │                     │  │
    │  └──────────┘  └─────────────────────┘  │
    └─────────────────────────────────────────┘
```

### Key Architecture Decisions

1. **Separate Worker Service**: Scraping can be slow (yt-dlp downloads, Puppeteer rendering, large file fetches). The worker runs on Railway, not Netlify, because Netlify Functions have a 10-second timeout (26s on Pro). Heavy scraping happens on Railway. Lightweight API route handlers on Netlify just enqueue jobs and return immediately.

2. **CRITICAL — Redis Connectivity**: Netlify Functions (serverless) and Railway (persistent) both need to reach the same Redis instance. **Use Upstash Redis** (serverless-compatible, free tier available) — NOT Railway's Redis addon. Upstash provides an HTTP-based REST API *and* standard Redis protocol. Netlify uses `@upstash/redis` (REST-based, works in serverless). Railway worker uses `ioredis` (persistent TCP connection). Both connect to the same Upstash instance. BullMQ on the worker uses the `ioredis` connection. API routes on Netlify use a lightweight HTTP bridge to enqueue: they POST to a Railway-hosted HTTP endpoint (`/api/worker/enqueue`) that adds the job to BullMQ. This avoids Netlify needing a persistent Redis connection at all.

3. **Source Detection Engine**: When a URL is submitted, Epic Scraper runs detection via pure regex only (no network calls) to classify the source type. This is instant and runs in the API route. Any content-type sniffing or HEAD requests happen in the worker after the job is enqueued.

4. **Scraper Repository as Central Data Store**: All scraped data goes into normalized database tables (`scraper_items`, `scraper_assets`, `scraper_metadata`). Other modules query this repository — they never scrape directly.

5. **Progressive Enhancement**: Basic scraping (fetch HTML + parse) works for most sites. YouTube gets yt-dlp. Social media gets platform-specific parsers. Advanced extraction (JS-rendered pages) uses Puppeteer on the worker.

6. **Webhook URLs**: External services (HeyGen, Runway) send webhooks to the **Netlify URL** (e.g., `https://epictours.netlify.app/api/remix/webhooks/heygen`), NOT Railway. `WEBHOOK_BASE_URL` must be set to the Netlify deployment URL.

---

## 3. INTEGRATION POINTS WITH EPIC DASH

### Sidebar Navigation

Epic Scraper adds TWO items to the Epic Dash sidebar:

```
Existing Sidebar:
├── Dashboard
├── Booking
├── Availability
├── ...
├── ─────────────
├── 🕷️ Scraper        ← NEW (paste URL, start scrape, view active jobs)
├── 📚 Library         ← NEW (browse all scraped data, search, tag, organize)
```

### Routing

Epic Scraper pages live under the existing Epic Dash org routing pattern:

```
/org/[orgId]/scraper           → Scraper home (URL input + active jobs)
/org/[orgId]/scraper/[jobId]   → Scrape job detail (all harvested data)
/org/[orgId]/library           → Scraper Repository browser (all collected data)
/org/[orgId]/library/[itemId]  → Single item detail view
```

### Design

**Follow Epic Dash's existing design exactly.** Claude Code has full access to the codebase. Look at existing pages, components, layouts, colors, typography, spacing, and patterns. Replicate them. Do not invent a new design system. Match what's already there.

Specifically:
- Use the same component library already in use (shadcn/ui or whatever Epic Dash uses)
- Use the same Tailwind classes and patterns
- Use the same card styles, button styles, form styles
- Use the same sidebar component — just add new items
- Use the same loading, error, and empty state patterns
- Match the same dark/light mode behavior

### Auth

Epic Dash handles auth. All API routes in Epic Scraper should use whatever auth middleware Epic Dash already uses. Look at existing API routes in the codebase for the pattern. Do not create new auth logic.

---

## 4. DATABASE SCHEMA

All tables prefixed `scraper_` to avoid collisions with Epic Dash and other modules.

### Migration: Scraper Tables

```sql
-- ============================================
-- SCRAPER COLLECTIONS (user-created folders/groups)
-- ============================================
CREATE TABLE public.scraper_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,                     -- Epic Dash org context
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366F1',             -- Collection color tag
  created_by UUID NOT NULL,                 -- References Epic Dash user
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- SCRAPER JOBS (one per URL submitted)
-- ============================================
CREATE TABLE public.scraper_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'website', 'youtube', 'twitter', 'instagram', 'tiktok',
    'facebook', 'linkedin', 'github', 'google_doc', 'google_drive',
    'pdf', 'markdown', 'rss', 'article', 'unknown'
  )),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'detecting', 'scraping', 'processing', 'complete', 'error', 'cancelled'
  )),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  -- Scrape configuration
  config JSONB NOT NULL DEFAULT '{
    "depth": 0,
    "max_pages": 1,
    "include_images": true,
    "include_videos": true,
    "include_files": true,
    "include_source": true,
    "include_metadata": true,
    "render_js": false
  }'::jsonb,
  -- Results summary
  items_found INTEGER DEFAULT 0,
  assets_found INTEGER DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  error_message TEXT,
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- SCRAPER ITEMS (the core repository — one row per scraped piece of content)
-- ============================================
CREATE TABLE public.scraper_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.scraper_jobs(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL,
  collection_id UUID REFERENCES public.scraper_collections(id) ON DELETE SET NULL,
  -- Source info
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,                -- 'youtube', 'website', etc.
  source_domain TEXT,                       -- 'youtube.com', 'github.com', etc.
  -- Content
  title TEXT,
  description TEXT,
  body_text TEXT,                           -- Main extracted text content (cleaned)
  body_html TEXT,                           -- Raw HTML (if requested)
  raw_source TEXT,                          -- Full page source (if requested)
  -- Content type classification
  content_type TEXT NOT NULL DEFAULT 'page' CHECK (content_type IN (
    'page', 'article', 'video', 'image', 'document', 'repository',
    'social_post', 'feed', 'file', 'audio', 'table_data'
  )),
  -- Structured data extracted
  tables_json JSONB,                        -- Array of extracted tables as JSON
  links_json JSONB,                         -- Array of all links found
  headings_json JSONB,                      -- Array of heading hierarchy
  structured_data_json JSONB,               -- JSON-LD, microdata, Open Graph
  -- Tags & organization
  tags TEXT[] DEFAULT '{}',
  is_starred BOOLEAN DEFAULT false,
  notes TEXT,                               -- User-added notes
  -- Stats
  word_count INTEGER,
  asset_count INTEGER DEFAULT 0,
  -- Timestamps
  published_at TIMESTAMPTZ,                 -- Content's original publish date
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- SCRAPER ASSETS (binary files attached to items — images, videos, PDFs, etc.)
-- ============================================
CREATE TABLE public.scraper_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.scraper_items(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.scraper_jobs(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL,
  -- Asset info
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'image', 'video', 'audio', 'document', 'file', 'thumbnail', 'avatar', 'screenshot'
  )),
  original_url TEXT,                        -- Where it was found
  file_name TEXT,
  mime_type TEXT,
  file_size_bytes BIGINT,
  -- Storage
  storage_path TEXT,                        -- Supabase Storage path
  -- Image-specific
  width INTEGER,
  height INTEGER,
  alt_text TEXT,
  -- Video/Audio-specific
  duration_seconds INTEGER,
  transcript TEXT,                          -- Extracted transcript (YouTube, audio)
  -- Metadata
  metadata JSONB,                           -- Flexible metadata per asset type
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- SCRAPER METADATA (key-value pairs per item for flexible metadata)
-- ============================================
CREATE TABLE public.scraper_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.scraper_items(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  value_json JSONB,
  category TEXT DEFAULT 'general' CHECK (category IN (
    'general', 'seo', 'social', 'technical', 'author', 'media', 'engagement', 'platform'
  )),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(item_id, key)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_scraper_jobs_org ON public.scraper_jobs(org_id);
CREATE INDEX idx_scraper_jobs_status ON public.scraper_jobs(status) WHERE status IN ('queued', 'scraping', 'processing');
CREATE INDEX idx_scraper_items_org ON public.scraper_items(org_id);
CREATE INDEX idx_scraper_items_job ON public.scraper_items(job_id);
CREATE INDEX idx_scraper_items_collection ON public.scraper_items(collection_id);
CREATE INDEX idx_scraper_items_type ON public.scraper_items(content_type);
CREATE INDEX idx_scraper_items_source_type ON public.scraper_items(source_type);
CREATE INDEX idx_scraper_items_domain ON public.scraper_items(source_domain);
CREATE INDEX idx_scraper_items_search ON public.scraper_items USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body_text, '')));
CREATE INDEX idx_scraper_items_tags ON public.scraper_items USING gin(tags);
CREATE INDEX idx_scraper_items_starred ON public.scraper_items(org_id) WHERE is_starred = true;
CREATE INDEX idx_scraper_assets_item ON public.scraper_assets(item_id);
CREATE INDEX idx_scraper_assets_type ON public.scraper_assets(asset_type);
CREATE INDEX idx_scraper_metadata_item ON public.scraper_metadata(item_id);

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

CREATE TRIGGER trg_scraper_jobs_updated BEFORE UPDATE ON public.scraper_jobs
  FOR EACH ROW EXECUTE FUNCTION scraper_update_timestamp();
CREATE TRIGGER trg_scraper_items_updated BEFORE UPDATE ON public.scraper_items
  FOR EACH ROW EXECUTE FUNCTION scraper_update_timestamp();
CREATE TRIGGER trg_scraper_collections_updated BEFORE UPDATE ON public.scraper_collections
  FOR EACH ROW EXECUTE FUNCTION scraper_update_timestamp();

-- ============================================
-- RLS (Scoped to org — inherit Epic Dash auth patterns)
-- ============================================
ALTER TABLE public.scraper_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_metadata ENABLE ROW LEVEL SECURITY;

-- NOTE TO AGENT: Look at how existing Epic Dash tables implement RLS
-- and follow the EXACT same pattern. The policies below are templates —
-- adapt them to match whatever auth.uid() / org scoping pattern Epic Dash uses.

-- Template policies (adapt to match Epic Dash's existing RLS pattern):
CREATE POLICY "scraper_collections_org" ON public.scraper_collections
  FOR ALL USING (true) WITH CHECK (true);
  -- AGENT: Replace with actual org-scoped policy matching Epic Dash

CREATE POLICY "scraper_jobs_org" ON public.scraper_jobs
  FOR ALL USING (true) WITH CHECK (true);
  -- AGENT: Replace with actual org-scoped policy matching Epic Dash

CREATE POLICY "scraper_items_org" ON public.scraper_items
  FOR ALL USING (true) WITH CHECK (true);
  -- AGENT: Replace with actual org-scoped policy matching Epic Dash

CREATE POLICY "scraper_assets_org" ON public.scraper_assets
  FOR ALL USING (true) WITH CHECK (true);
  -- AGENT: Replace with actual org-scoped policy matching Epic Dash

CREATE POLICY "scraper_metadata_org" ON public.scraper_metadata
  FOR ALL USING (true) WITH CHECK (true);
  -- AGENT: Replace with actual org-scoped policy matching Epic Dash

-- ============================================
-- REALTIME (for live job progress)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.scraper_jobs;

-- ============================================
-- STORAGE BUCKET (shared by Scraper + Remix)
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'epic-assets',
  'epic-assets',
  false,
  524288000,  -- 500MB limit (requires Supabase Pro for files >50MB)
  ARRAY[
    'video/mp4', 'video/webm',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'audio/mpeg', 'audio/mp3', 'audio/wav',
    'application/pdf',
    'text/plain', 'text/html', 'text/css', 'text/csv', 'text/vtt', 'text/markdown',
    'application/json', 'application/xml',
    'application/octet-stream'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies — adapt to match Epic Dash's auth pattern
CREATE POLICY "epic_assets_read" ON storage.objects FOR SELECT USING (
  bucket_id = 'epic-assets' AND auth.role() = 'authenticated'
);
CREATE POLICY "epic_assets_write" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'epic-assets' AND auth.role() = 'authenticated'
);
CREATE POLICY "epic_assets_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'epic-assets' AND auth.role() = 'authenticated'
);
CREATE POLICY "epic_assets_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'epic-assets' AND auth.role() = 'authenticated'
);
```

---

## 5. API ROUTES

All routes under `/api/scraper/`. Follow Epic Dash's existing API pattern for auth middleware, error responses, and request handling.

```
POST   /api/scraper/scrape              → Submit URL for scraping (returns jobId)
POST   /api/scraper/scrape/batch        → Submit multiple URLs
GET    /api/scraper/jobs                → List scrape jobs (paginated, filtered)
GET    /api/scraper/jobs/[jobId]        → Job detail with progress
POST   /api/scraper/jobs/[jobId]/cancel → Cancel active job
DELETE /api/scraper/jobs/[jobId]        → Delete job + all associated data

GET    /api/scraper/library             → List all scraped items (paginated, searchable, filterable)
GET    /api/scraper/library/[itemId]    → Single item with all assets and metadata
PATCH  /api/scraper/library/[itemId]    → Update item (tags, notes, collection, starred)
DELETE /api/scraper/library/[itemId]    → Delete item + assets

GET    /api/scraper/library/search      → Full-text search across all items
GET    /api/scraper/library/stats       → Repository stats (total items, by type, storage used)

POST   /api/scraper/collections         → Create collection
GET    /api/scraper/collections         → List collections
PATCH  /api/scraper/collections/[id]    → Update collection
DELETE /api/scraper/collections/[id]    → Delete collection (items become uncollected)

GET    /api/scraper/assets/[assetId]    → Get asset signed URL for download/preview

GET    /api/scraper/health              → Health check
```

### Request/Response Pattern

Follow whatever pattern Epic Dash already uses. If Epic Dash doesn't have a standard, use this:

```typescript
// Standard response envelope
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  pagination?: { page: number; pageSize: number; total: number };
};
```

---

## 6. ZOD VALIDATION SCHEMAS

```typescript
// src/lib/scraper/validators.ts
import { z } from 'zod';

export const ScrapeRequestSchema = z.object({
  url: z.string().url({ message: 'Must be a valid URL' }),
  collectionId: z.string().uuid().optional(),
  config: z.object({
    depth: z.number().int().min(0).max(3).default(0),       // 0 = just this page, 1+ = follow links
    maxPages: z.number().int().min(1).max(50).default(1),
    includeImages: z.boolean().default(true),
    includeVideos: z.boolean().default(true),
    includeFiles: z.boolean().default(true),
    includeSource: z.boolean().default(true),
    includeMetadata: z.boolean().default(true),
    renderJs: z.boolean().default(false),                    // Use Puppeteer for JS-heavy sites
  }).optional(),
});

export const BatchScrapeRequestSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(25),
  collectionId: z.string().uuid().optional(),
  config: ScrapeRequestSchema.shape.config,
});

export const UpdateItemSchema = z.object({
  tags: z.array(z.string().max(50)).max(20).optional(),
  notes: z.string().max(5000).optional(),
  collectionId: z.string().uuid().nullable().optional(),
  isStarred: z.boolean().optional(),
});

export const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const LibrarySearchSchema = z.object({
  query: z.string().min(1).max(500),
  sourceType: z.enum([
    'website', 'youtube', 'twitter', 'instagram', 'tiktok',
    'facebook', 'linkedin', 'github', 'google_doc', 'pdf', 'article'
  ]).optional(),
  contentType: z.enum([
    'page', 'article', 'video', 'image', 'document', 'repository',
    'social_post', 'feed', 'file', 'audio', 'table_data'
  ]).optional(),
  collectionId: z.string().uuid().optional(),
  starred: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(100).default(20),
});
```

---

## 7. SCRAPING ENGINES

### Engine Contract (ALL engines MUST implement this interface)

```typescript
// src/lib/scraper/engines/types.ts — REQUIRED INTERFACE FOR ALL ENGINES

export interface ScrapeResult {
  // Content
  title: string | null;
  description: string | null;
  bodyText: string | null;          // Cleaned readable text
  bodyHtml: string | null;          // Raw HTML (if includeSource)
  rawSource: string | null;         // Full page source (if includeSource)
  contentType: 'page' | 'article' | 'video' | 'image' | 'document' | 'repository' | 'social_post' | 'feed' | 'file' | 'audio' | 'table_data';

  // Structured data
  tables: Array<{ headers: string[]; rows: string[][] }> | null;
  links: Array<{ href: string; text: string; isExternal: boolean }> | null;
  headings: Array<{ level: number; text: string }> | null;
  structuredData: Record<string, any> | null;   // JSON-LD, OG, etc.

  // Assets to download
  assets: AssetToDownload[];

  // Metadata key-value pairs
  metadata: Array<{ key: string; value: string; category: string }>;

  // Stats
  wordCount: number | null;
  publishedAt: string | null;       // ISO date string
}

export interface AssetToDownload {
  type: 'image' | 'video' | 'audio' | 'document' | 'file' | 'thumbnail' | 'screenshot';
  url: string;                      // URL to download from (or local /tmp path if already downloaded)
  isLocal: boolean;                 // true if already on disk (e.g., yt-dlp output)
  fileName: string;
  mimeType: string | null;
  altText?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  transcript?: string;
  metadata?: Record<string, any>;
}

export interface ScrapeOptions {
  config: {
    depth: number;
    maxPages: number;
    includeImages: boolean;
    includeVideos: boolean;
    includeFiles: boolean;
    includeSource: boolean;
    includeMetadata: boolean;
    renderJs: boolean;
  };
  onProgress: (percent: number) => Promise<void>;  // 0-100
  tmpDir: string;                   // Pre-created temp directory for this job
}

// Every engine exports ONE function with this exact signature:
export type ScrapeEngine = (url: string, options: ScrapeOptions) => Promise<ScrapeResult>;
```

Each engine file exports a `scrape` function matching `ScrapeEngine`. The worker dispatcher calls it generically. If an engine only partially succeeds (e.g., video fails but transcript works), it should return whatever it got — NOT throw. Only throw for total failures.

### Source Detection

```typescript
// src/lib/scraper/detector.ts
// PURE REGEX — no network calls. Runs in the API route on Netlify (10s timeout).
// Any content-type sniffing or HEAD requests happen in the worker AFTER enqueue.

export type SourceType =
  | 'youtube' | 'twitter' | 'instagram' | 'tiktok' | 'facebook' | 'linkedin'
  | 'github' | 'google_doc' | 'google_drive' | 'pdf' | 'markdown' | 'rss'
  | 'article' | 'website';

export function detectSourceType(url: string): SourceType {
  const u = new URL(url);
  const host = u.hostname.replace('www.', '');

  // Platform detection by domain
  if (host.includes('youtube.com') || host === 'youtu.be') return 'youtube';
  if (host.includes('twitter.com') || host === 'x.com') return 'twitter';
  if (host.includes('instagram.com')) return 'instagram';
  if (host.includes('tiktok.com')) return 'tiktok';
  if (host.includes('facebook.com') || host === 'fb.com') return 'facebook';
  if (host.includes('linkedin.com')) return 'linkedin';
  if (host.includes('github.com')) return 'github';
  if (host.includes('docs.google.com')) return 'google_doc';
  if (host.includes('drive.google.com')) return 'google_drive';

  // File extension detection
  const path = u.pathname.toLowerCase();
  if (path.endsWith('.pdf')) return 'pdf';
  if (path.endsWith('.md') || path.endsWith('.markdown')) return 'markdown';
  if (path.endsWith('.xml') || path.endsWith('.rss') || path.endsWith('.atom')) return 'rss';

  // Default: general website (the universal scraper handles this)
  return 'website';
}
```

### Engine: Universal Web Scraper (website, article, any HTML page)

```typescript
// src/lib/scraper/engines/web-engine.ts

// Tools: cheerio (HTML parsing), readability (@mozilla/readability for article extraction)
// For JS-rendered pages: puppeteer-core on worker

// Extracts:
// 1. Page text (cleaned, readable)
// 2. All images (src, alt, dimensions)
// 3. All tables (converted to JSON arrays)
// 4. All links (href, text, internal/external)
// 5. Heading hierarchy (h1-h6 tree)
// 6. Meta tags (title, description, keywords, robots)
// 7. Open Graph tags (og:title, og:image, og:description, etc.)
// 8. JSON-LD structured data
// 9. Favicon
// 10. Full HTML source (optional)
// 11. CSS styles (optional)
// 12. Script tags (optional)
// 13. RSS/Atom feed discovery links

// Article mode (auto-detected or user-selected):
// Uses @mozilla/readability to extract clean article content,
// author, publish date, and main image.
```

### Engine: YouTube Scraper

```typescript
// src/lib/scraper/engines/youtube-engine.ts

// Tools: yt-dlp (child_process), YouTube Data API v3 (API key only)

// Extracts:
// 1. Video MP4 (best quality ≤1080p, max 20 minutes)
// 2. Transcript via yt-dlp --write-auto-sub (NOT YouTube Captions API — requires OAuth)
// 3. VTT → plain text parser (strip timestamps, duplicates)
// 4. Title, description
// 5. Thumbnail (all available resolutions — maxres, high, medium, default)
// 6. Channel name, channel ID, channel avatar
// 7. Tags, category
// 8. View count, like count, comment count
// 9. Duration, publish date
// 10. Top N comments (via YouTube Data API commentThreads.list)

// IMPORTANT: yt-dlp for transcripts, YouTube Data API for metadata.
// YouTube Data API only needs API key (no OAuth).
// Reject videos >20 minutes. Compress >200MB to 720p.
```

### Engine: Social Media Scraper

```typescript
// src/lib/scraper/engines/social-engine.ts

// Twitter/X: Use nitter instances or twitter embed API for public posts
// Instagram: Use embed endpoints for public posts (limited)
// TikTok: Use embed endpoints for public posts
// Facebook: Use Open Graph scraping for public pages/posts
// LinkedIn: Use Open Graph scraping for public posts

// NOTE: Social media scraping is inherently fragile. These platforms
// actively block scrapers. The approach:
// 1. Try embed/oembed API first (most reliable, officially supported)
// 2. Fall back to Open Graph meta tag extraction
// 3. Fall back to Puppeteer render + screenshot + text extraction
// 4. If all fail, store the URL with whatever metadata we could get + a screenshot

// NEVER store credentials or attempt authenticated scraping.
// Only public content is scraped.
```

### Engine: GitHub Scraper

```typescript
// src/lib/scraper/engines/github-engine.ts

// Uses GitHub REST API (unauthenticated for public repos, rate limited to 60 req/hr)
// OR: uses GitHub personal access token from env vars if available (5000 req/hr)

// Extracts:
// 1. Repository name, description, homepage URL
// 2. README.md content (rendered HTML + raw markdown)
// 3. Directory tree (file listing with sizes)
// 4. Languages used (percentage breakdown)
// 5. Stars, forks, watchers, open issues count
// 6. License type
// 7. package.json / requirements.txt / Cargo.toml (dependency info)
// 8. Recent commits (last 10 with messages, authors, dates)
// 9. Topics/tags
```

### Engine: Document Scraper (PDF, Google Docs)

```typescript
// src/lib/scraper/engines/document-engine.ts

// PDF: Use pdf-parse (server-side) to extract text, page count, metadata
// Google Docs: Fetch published HTML version (requires doc to be "published to web" or "anyone with link")
// Google Drive: Extract file info from publicly shared files

// Extracts:
// 1. Full text content
// 2. Page count (PDF)
// 3. Embedded images
// 4. Document metadata (author, title, creation date, modified date)
// 5. File size
```

### Engine Dispatch

```typescript
// src/lib/scraper/engine-dispatch.ts

import { SourceType } from './detector';

export function getEngine(sourceType: SourceType) {
  switch (sourceType) {
    case 'youtube':
      return import('./engines/youtube-engine');
    case 'twitter':
    case 'instagram':
    case 'tiktok':
    case 'facebook':
    case 'linkedin':
      return import('./engines/social-engine');
    case 'github':
      return import('./engines/github-engine');
    case 'pdf':
    case 'google_doc':
    case 'google_drive':
      return import('./engines/document-engine');
    default:
      return import('./engines/web-engine');
  }
}
```

---

## 8. WORKER ARCHITECTURE

### Queue Design

```typescript
// src/lib/queue/connection.ts — SHARED by both Epic Scraper and Epic Remix
// This file is used by the Railway worker (persistent TCP connection via ioredis)
import IORedis from 'ioredis';

// Worker reads REDIS_URL from environment (Upstash Redis URL with TLS)
export const redisConnection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined, // Upstash uses TLS
});

// src/lib/queue/enqueue.ts — Used by Netlify API routes (serverless)
// Netlify CANNOT hold persistent Redis connections. Instead, API routes
// POST to a Railway-hosted HTTP endpoint that enqueues the job.
export async function enqueueJob(queue: string, data: Record<string, any>): Promise<string> {
  const response = await fetch(`${process.env.WORKER_URL}/enqueue`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.WORKER_SECRET}`,
    },
    body: JSON.stringify({ queue, data }),
  });
  if (!response.ok) throw new Error(`Failed to enqueue: ${response.status}`);
  const result = await response.json();
  return result.jobId;
}
```

**IMPORTANT**: The Railway worker exposes a simple HTTP endpoint for job enqueuing:

```typescript
// src/worker/enqueue-server.ts — Lightweight Express server on Railway
// Accepts POST /enqueue from Netlify API routes, adds job to BullMQ
import express from 'express';
import { Queue } from 'bullmq';
import { redisConnection } from '../lib/queue/connection';

const app = express();
app.use(express.json());

const queues: Record<string, Queue> = {
  'epic-scraper': new Queue('epic-scraper', { connection: redisConnection }),
  'epic-remix': new Queue('epic-remix', { connection: redisConnection }),
  'epic-generate': new Queue('epic-generate', { connection: redisConnection }),
  'epic-render': new Queue('epic-render', { connection: redisConnection }),
};

app.post('/enqueue', async (req, res) => {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.WORKER_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { queue, data } = req.body;
  if (!queues[queue]) return res.status(400).json({ error: `Unknown queue: ${queue}` });
  const job = await queues[queue].add(queue, data);
  res.json({ jobId: job.id });
});

const PORT = process.env.ENQUEUE_PORT || 3001;
app.listen(PORT, () => console.log(`Enqueue server on :${PORT}`));
```

### Worker Entry Point

```typescript
// src/worker/scraper-worker.ts
// Runs as standalone Node.js process on Railway

import { Worker, Job } from 'bullmq';
import { connection } from './connection';
import { detectSourceType } from '../lib/scraper/detector';
import { getEngine } from '../lib/scraper/engine-dispatch';
import { logger } from '../lib/logger';

const worker = new Worker('epic-scraper', async (job: Job) => {
  const { jobId, url, config, orgId, userId } = job.data;

  try {
    // 1. Update status to 'scraping'
    await updateJobStatus(jobId, 'scraping', 0);

    // 2. Detect source type
    const sourceType = detectSourceType(url);
    await updateJobStatus(jobId, 'scraping', 10);

    // 3. Dispatch to engine
    const engine = await getEngine(sourceType);
    const result = await engine.scrape(url, config, {
      onProgress: (pct: number) => updateJobStatus(jobId, 'scraping', 10 + pct * 0.8),
    });

    // 4. Store results in database
    await updateJobStatus(jobId, 'processing', 90);
    await storeResults(jobId, orgId, userId, sourceType, url, result);

    // 5. Complete
    await updateJobStatus(jobId, 'complete', 100);

  } catch (error: any) {
    logger.error(`Scrape job ${jobId} failed`, { url, error: error.message });
    await updateJobStatus(jobId, 'error', 0, error.message);
    throw error;
  }
}, {
  connection,
  concurrency: 5,
  limiter: { max: 10, duration: 60000 }, // Max 10 jobs per minute
});

worker.on('completed', (job) => logger.info(`Scrape ${job.id} completed`));
worker.on('failed', (job, err) => logger.error(`Scrape ${job?.id} failed: ${err.message}`));

process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});
```

### Worker Dockerfile

```dockerfile
FROM node:20-slim

# Install system dependencies for scraping
RUN apt-get update && apt-get install -y \
  python3 \
  python3-pip \
  chromium \
  fonts-liberation \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libpango-1.0-0 \
  libcairo2 \
  libasound2 \
  ffmpeg \
  && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip3 install --break-system-packages yt-dlp

# Set Chromium path for Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROMIUM_PATH=/usr/bin/chromium

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY . .
RUN npm run build:worker

CMD ["node", "dist/worker/index.js"]
```

**NOTE**: The CMD starts the shared worker entry point (src/worker/index.ts) which launches ALL workers — scraper, remix, generate, and render. See Epic Remix spec Section 13 for the shared worker architecture.

### Worker tsconfig

```json
// tsconfig.worker.json
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
    "src/lib/logger.ts"
  ]
}
```

---

## 9. FRONTEND — PAGES & COMPONENTS

### Page: Scraper Home (`/org/[orgId]/scraper`)

The main scraping interface. Two sections:

**Top: URL Input**
- Large, prominent URL input field with "Scrape" button
- Auto-detects source type as user types (shows icon: YouTube, GitHub, etc.)
- Expandable "Advanced Options" panel:
  - Depth (0-3 pages deep)
  - Toggle: Include images / videos / files / source code
  - Toggle: Render JavaScript (Puppeteer mode — slower but handles SPAs)
  - Collection dropdown (optional — organize into collection)
- Batch mode: Toggle to multi-URL textarea (one URL per line, max 25)

**Bottom: Active & Recent Jobs**
- Live-updating job cards showing:
  - URL + detected source type icon
  - Progress bar with percentage
  - Status badge (queued / scraping / processing / complete / error)
  - Items found count, assets found count
  - Time elapsed / ETA
  - Cancel button for active jobs
- Click a completed job → navigates to `/org/[orgId]/scraper/[jobId]`

### Page: Job Detail (`/org/[orgId]/scraper/[jobId]`)

Shows everything harvested from a single scrape job:

- **Header**: URL, source type, status, timestamp, collection
- **Content Tab**: Extracted text content (cleaned, readable)
- **Assets Tab**: Grid of all downloaded images, videos, files with previews
- **Tables Tab**: Any extracted tables rendered as sortable data tables
- **Metadata Tab**: All key-value metadata pairs, Open Graph, JSON-LD
- **Source Tab**: Raw HTML source with syntax highlighting
- **Links Tab**: All discovered links (internal/external)
- **Actions**: Add to collection, add tags, star, delete, re-scrape

### Page: Library (`/org/[orgId]/library`)

The central repository browser:

- **Search bar** with full-text search across all items
- **Filter sidebar**: By source type, content type, collection, starred, date range, tags
- **View modes**: Grid (cards with thumbnails) / List (compact table view)
- **Bulk actions**: Select multiple → add to collection, tag, delete
- **Sort**: By date scraped, title, source type, word count
- **Stats bar**: Total items, total storage used, items by type

### Page: Item Detail (`/org/[orgId]/library/[itemId]`)

Single item deep view — same tabs as Job Detail but for a single item, plus:
- Edit tags, notes, collection
- View all associated assets with download links
- "Send to Remix" button (dispatches to Epic Remix module — future integration)

### Components Needed

```
src/components/scraper/
├── UrlInput.tsx              # Smart URL input with source detection
├── ScrapeOptions.tsx         # Advanced scrape options panel
├── JobCard.tsx               # Active/recent job with progress
├── JobList.tsx               # List of scrape jobs
├── ContentViewer.tsx         # Rendered text content display
├── AssetGrid.tsx             # Image/video/file preview grid
├── TableViewer.tsx           # Extracted tables as data tables
├── MetadataPanel.tsx         # Key-value metadata display
├── SourceViewer.tsx          # HTML source with syntax highlighting
├── LinkList.tsx              # Discovered links table
├── LibraryGrid.tsx           # Card grid view for library
├── LibraryTable.tsx          # List/table view for library
├── LibraryFilters.tsx        # Filter sidebar for library
├── CollectionPicker.tsx      # Collection dropdown/picker
├── TagEditor.tsx             # Tag input/editor
├── BatchInput.tsx            # Multi-URL textarea input
└── SourceTypeIcon.tsx        # Icon component for source types
```

**CRITICAL**: Do NOT design these from scratch. Look at existing Epic Dash components and match their patterns, styles, and interaction behaviors exactly.

---

## 10. FILE STORAGE STRATEGY

### Supabase Storage Structure

Use the existing Epic Dash Supabase Storage bucket if one exists, or create a new bucket. All paths prefixed `scraper/`:

```
{bucket}/
└── scraper/
    └── {org_id}/
        └── {job_id}/
            ├── images/
            │   ├── img-001.jpg
            │   ├── img-002.png
            │   └── ...
            ├── videos/
            │   └── video-001.mp4
            ├── audio/
            │   └── audio-001.mp3
            ├── documents/
            │   └── doc-001.pdf
            ├── thumbnails/
            │   └── thumb-001.jpg
            ├── screenshots/
            │   └── page-screenshot.png
            └── files/
                └── data-001.csv
```

### Storage Helpers

```typescript
// src/lib/scraper/storage.ts
export const BUCKET_NAME = 'epic-assets'; // Shared bucket — created in scraper migration

export function scraperStoragePath(orgId: string, jobId: string, ...segments: string[]): string {
  return ['scraper', orgId, jobId, ...segments].join('/');
}

// Generate signed URL for asset preview/download (1 hour expiry)
export async function getAssetSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data.signedUrl;
}
```

### Temp File Lifecycle

Same pattern as original spec — every scrape worker handler MUST clean up `/tmp` in a `finally` block:

```typescript
async function scrapeAndStore(jobId: string, url: string) {
  const tmpDir = `/tmp/scraper/${jobId}`;
  mkdirSync(tmpDir, { recursive: true });
  try {
    // ... scrape to tmpDir, upload to Supabase, update DB ...
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}
```

---

## 11. ENVIRONMENT VARIABLES

Epic Scraper needs these in addition to Epic Dash's existing env vars:

```bash
# Redis (Upstash — serverless-compatible, used by both Netlify and Railway)
REDIS_URL=rediss://default:xxxxx@us1-xxxxx.upstash.io:6379

# Worker bridge (Railway-hosted enqueue endpoint)
WORKER_URL=https://your-worker.up.railway.app
WORKER_SECRET=generate-a-random-32-char-string

# Webhook base URL (NETLIFY URL — external services POST here)
WEBHOOK_BASE_URL=https://epictours.netlify.app

# YouTube Data API (same as Epic Dash if already configured)
YOUTUBE_DATA_API_KEY=AIza...

# GitHub (optional — for higher rate limits on repo scraping)
GITHUB_TOKEN=ghp_...

# Worker-specific (Railway only)
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
LOG_LEVEL=info
ENQUEUE_PORT=3001
```

### .env.example

Create this file in the project root:

```bash
# === SHARED (Netlify + Railway) ===
REDIS_URL=rediss://default:xxxxx@us1-xxxxx.upstash.io:6379
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# === NETLIFY ONLY ===
WORKER_URL=https://your-worker.up.railway.app
WORKER_SECRET=your-secret-here
WEBHOOK_BASE_URL=https://your-app.netlify.app

# === API KEYS ===
YOUTUBE_DATA_API_KEY=AIza...
GOOGLE_GEMINI_API_KEY=AIza...
FAL_KEY=fal_...
ELEVENLABS_API_KEY=sk_...
HEYGEN_API_KEY=...
RUNWAY_API_KEY=...
KLING_API_KEY=...
GITHUB_TOKEN=ghp_...

# === RAILWAY WORKER ONLY ===
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
CHROMIUM_PATH=/usr/bin/chromium
REMOTION_CHROMIUM_EXECUTABLE=/usr/bin/chromium
LOG_LEVEL=info
ENQUEUE_PORT=3001
```

---

## 12. ERROR HANDLING & RESILIENCE

### Retry Strategy

```typescript
// Max 3 retries with exponential backoff for transient failures
// No retry for: 404, 403, 401 (permanent failures)
// Retry for: 429 (rate limit), 500, 502, 503, ECONNRESET, ETIMEDOUT
```

### Graceful Degradation per Engine

If a scraping engine partially fails, store whatever was successfully extracted and mark the job as complete with warnings. For example:
- YouTube: Video download fails but metadata + transcript succeeded → store what we got
- Website: Images fail to download but text extraction worked → store text, log image errors
- Social media: Platform blocked the request → store URL + screenshot + whatever Open Graph data we got

### Job Cancellation

User can cancel any job that's `queued` or `scraping`. Worker checks for cancellation status between steps and stops processing.

---

## 13. LOGGING

```typescript
// src/lib/logger.ts (shared with Epic Remix)
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

export const scraperLogger = logger.child({ module: 'scraper' });

// All scraper code uses scraperLogger, never console.log
```

---

## 14. BUILD PHASES

### Phase 1: Foundation (~3 hours)

- [ ] Database migration — all `scraper_` tables created
- [ ] RLS policies matching Epic Dash patterns
- [ ] Supabase Storage bucket/paths configured
- [ ] Sidebar items added (Scraper + Library)
- [ ] Page shells created at correct routes
- [ ] API route stubs created
- [ ] Zod schemas file created
- [ ] Redis connection configured
- [ ] BullMQ queue created
- [ ] Source type detector implemented
- [ ] Logger configured

**✅ Checkpoint**: Navigate to Scraper page, see empty state. Navigate to Library, see empty state. Both match Epic Dash design.

### Phase 2: Universal Web Scraper (~4 hours)

- [ ] Web engine: fetch HTML, parse with cheerio
- [ ] Article mode: @mozilla/readability extraction
- [ ] Image extraction + download + upload to Supabase
- [ ] Table extraction to JSON
- [ ] Metadata extraction (meta, OG, JSON-LD)
- [ ] Link extraction
- [ ] Source code capture
- [ ] Worker handler processes job end-to-end
- [ ] Scraper page: URL input → submit → see job progress → see results
- [ ] Library page: browse scraped items, search, filter

**✅ Checkpoint**: Paste any website URL → scrape completes → see extracted text, images, metadata in Library.

### Phase 3: YouTube + Video Scraper (~3 hours)

- [ ] yt-dlp wrapper: video download, transcript extraction
- [ ] VTT parser
- [ ] YouTube Data API: metadata, thumbnails, comments
- [ ] Video upload to Supabase Storage
- [ ] YouTube items display correctly in Library (video player, transcript view)

**✅ Checkpoint**: Paste YouTube URL → video downloaded → transcript extracted → playable in Library.

### Phase 4: Social, GitHub, Document Engines (~4 hours)

- [ ] Social engine: Twitter, Instagram, TikTok, Facebook, LinkedIn via embed/OG
- [ ] GitHub engine: repo info, README, file tree, languages
- [ ] Document engine: PDF text extraction, Google Docs
- [ ] Puppeteer fallback for JS-rendered pages
- [ ] All source types display correctly in Library with appropriate views

**✅ Checkpoint**: Paste a GitHub URL, a tweet, and a PDF link → all three scraped and browsable.

### Phase 5: Polish (~2 hours)

- [ ] Batch scraping (multi-URL)
- [ ] Collections (create, assign, browse)
- [ ] Tags + stars + notes
- [ ] Full-text search across library
- [ ] Bulk actions (multi-select + tag/delete/collect)
- [ ] Health check endpoint
- [ ] Error states, empty states, loading states everywhere

**✅ Checkpoint**: Full scraping workflow feels polished. Library is searchable, filterable, organized.

---

## 15. KNOWN CONSTRAINTS & WORKAROUNDS

| Constraint | Impact | Workaround |
|---|---|---|
| Netlify Function timeout (10s/26s) | Can't scrape in API route | Enqueue to BullMQ, process on Railway worker |
| Social media anti-scraping | Instagram/TikTok block scrapers | Use embed APIs + OG tags + Puppeteer screenshot fallback |
| YouTube Captions API requires OAuth | Can't get transcripts via API | Use yt-dlp `--write-auto-sub` |
| GitHub unauthenticated rate limit: 60/hr | Slow for heavy repo scraping | Use GITHUB_TOKEN if available (5000/hr) |
| Supabase free tier 50MB file limit | Can't store large videos | Compress to 720p, or require Supabase Pro |
| JS-rendered sites (SPAs) | Cheerio can't parse dynamic content | Puppeteer on Railway worker (render JS first) |
| PDFs with scanned images (no text) | pdf-parse returns empty | Note limitation — OCR is V2 feature |

---

## 16. AGENT TEAM CONFIGURATION

### How This Module Is Built

Epic Scraper is built using Claude Code **Agent Teams** across 4 sessions (Steps 2-5 in DEPLOYMENT_GUIDE.md). Each session spawns a team with the lead in **delegate mode** (Shift+Tab) — the lead coordinates only, teammates code.

### Key Agent Teams Rules

1. **File ownership is in CLAUDE.md** — every teammate reads it automatically. The File Ownership Map prevents the #1 failure mode: two teammates overwriting the same file.
2. **Delegate mode always on** — press Shift+Tab after spawning. Lead never writes code.
3. **tmux split panes** — use `--teammate-mode tmux` for 3+ teammates so all are visible.
4. **Task dependencies** — use "depends on #N" so downstream tasks auto-unblock when prerequisites complete.
5. **Teammates don't inherit conversation history** — they only get CLAUDE.md + their spawn prompt. Include all context they need in the task description.
6. **One team per session** — exit claude between phases. Each phase = fresh session.
7. **Quality gate between phases** — `npx tsc --noEmit` must pass before next session.

### Session Plan

| Deploy Guide Step | Teammates | What Gets Built |
|---|---|---|
| Step 2 (Phase 1) | 3: database-setup, frontend-shell, worker-infra | Migration, page shells, queue infra, API stubs |
| Step 3 (Phase 2) | 3: web-engine, worker-handler, frontend-ui | Web scraper, worker pipeline, full UI |
| Step 4 (Phase 3) | 2: youtube-engine, youtube-frontend | yt-dlp, VTT parser, video player |
| Step 5 (Phase 4+5) | 3: platform-engines, advanced-scraping, polish-frontend | Social/GitHub/PDF, batch, collections, polish |

### Permission Pre-Approval

Teammates generate many permission prompts. The user should pre-approve common operations in `~/.claude/settings.json` — see CLAUDE.md for the recommended permissions block.

See DEPLOYMENT_GUIDE.md for the exact prompts to give the lead at each step.

---

## APPENDIX: DEPENDENCIES TO INSTALL

```bash
# Scraping
npm install cheerio @mozilla/readability jsdom pdf-parse

# Queue + Redis
npm install bullmq ioredis @upstash/redis express

# Logging
npm install pino pino-pretty

# Validation (if not already in Epic Dash)
npm install zod

# Dev
npm install -D @types/cheerio @types/express puppeteer-core
```

System dependencies (Railway worker Dockerfile):
- yt-dlp (pip install)
- ffmpeg
- chromium (for Puppeteer)

---

**END OF EPIC SCRAPER SPEC v1.0**
