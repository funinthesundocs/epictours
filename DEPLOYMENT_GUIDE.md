# Epic Scraper + Epic Remix — Agent Teams Build Guide

> **You are Claude Code.** The user hands you this file. Lead them step by step.
> Each STEP = one agent team session. Exit claude and restart between steps.
> Read CLAUDE.md + both spec files before starting any step.

---

## HOW AGENT TEAMS WORK (tell the user this)

- **Team Lead** (you) coordinates. **Teammates** code in parallel.
- Teammates share a **task list** with dependencies. Tasks auto-unblock.
- Teammates **message each other directly** — no bottleneck through lead.
- Teammates read CLAUDE.md but **don't inherit your conversation history**.
- Two teammates editing the same file = **silent overwrite**. File ownership is in CLAUDE.md.
- Press **Shift+Tab** = delegate mode. Lead can ONLY coordinate, not code. Use this.
- Press **Ctrl+T** = view shared task list.
- Each step below = **one team, one session**. Exit and restart between steps.

---

## STEP 0: ONE-TIME SETUP

### 0a. User configures settings

Tell the user to create/edit `~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "permissions": {
    "allow": [
      "Bash(npm run *)", "Bash(npx tsc *)", "Bash(npx supabase *)",
      "Bash(cat *)", "Bash(ls *)", "Bash(find *)", "Bash(head *)",
      "Bash(tail *)", "Bash(wc *)", "Bash(grep *)", "Bash(mkdir *)",
      "Bash(cp *)", "Bash(mv *)",
      "Read", "Write", "Edit"
    ]
  }
}
```

This pre-approves common operations so teammates don't spam permission prompts.

### 0b. Prerequisites

- [ ] Epic Dash runs locally (`npm run dev`)
- [ ] Supabase connected
- [ ] **Upstash Redis** — https://upstash.com free tier, copy `rediss://` string
- [ ] yt-dlp + ffmpeg installed
- [ ] tmux installed (`brew install tmux` on Mac) — for split-pane teammate display

### 0c. Spec files in project root: `CLAUDE.md`, `EPIC_SCRAPER_SPEC.md`, `EPIC_REMIX_SPEC.md`

### 0d. Add to `.env.local`:

```bash
REDIS_URL=rediss://default:xxxxx@us1-xxxxx.upstash.io:6379
```

---

## STEP 1: EXPLORE CODEBASE (single session, no team needed)

```bash
claude
```

Explore the existing Epic Dash codebase. Summarize to the user:
- Framework version, component library (shadcn? custom?)
- Auth pattern (middleware, session handling)
- Sidebar component location and structure
- Database access pattern (Supabase client setup)
- Routing convention (/org/[orgId]/ pattern)
- Existing design tokens, colors, spacing

Then install ALL dependencies in one command:

```bash
npm install cheerio @mozilla/readability jsdom pdf-parse bullmq ioredis @upstash/redis express @google/generative-ai @fal-ai/serverless-client @remotion/core @remotion/renderer @remotion/cli fluent-ffmpeg pino pino-pretty zod
npm install -D @types/cheerio @types/express @types/fluent-ffmpeg puppeteer-core tsx
```

Exit claude. Tell user: "Foundation explored, deps installed. Starting Phase 1."

---

## STEP 2: SCRAPER PHASE 1 — Foundation (new session)

```bash
claude --teammate-mode tmux
```

Tell the lead:

```
Read CLAUDE.md and EPIC_SCRAPER_SPEC.md. Build Scraper Phase 1 (Foundation).

Create an agent team with 3 teammates. Use delegate mode (I'll press Shift+Tab).
Each teammate owns DIFFERENT files — see the File Ownership Map in CLAUDE.md.

Tasks (with dependencies):

1. [database-setup] Create Supabase migration 001_scraper_tables.sql:
   - ALL scraper_ tables from EPIC_SCRAPER_SPEC.md Section 4
   - epic-assets storage bucket + storage policies
   - RLS policies matching existing Epic Dash patterns
   - Realtime publication for scraper_jobs
   - Timestamp triggers

2. [database-setup] Create shared library files (after migration):
   - src/lib/scraper/engines/types.ts (ScrapeResult interface from Spec Section 7)
   - src/lib/scraper/validators.ts (Zod schemas from Spec Section 6)
   - src/lib/scraper/detector.ts (source type detector from Spec Section 7)
   - src/lib/scraper/storage.ts (storage helpers from Spec Section 10)

3. [frontend-shell] Study existing Epic Dash pages, then:
   - Add "Scraper" and "Library" to existing sidebar
   - Create page shells at /org/[orgId]/scraper and /org/[orgId]/library
   - Empty states matching Epic Dash design exactly
   - src/components/scraper/SourceTypeIcon.tsx

4. [worker-infra] Create worker infrastructure:
   - src/lib/queue/connection.ts (ioredis to Upstash)
   - src/lib/queue/enqueue.ts (HTTP bridge: Netlify POST → Railway)
   - src/worker/enqueue-server.ts (Express server on Railway)
   - src/lib/logger.ts (pino with module child loggers)
   - tsconfig.worker.json (relative imports, no @/ aliases)
   - src/worker/index.ts (shared entry point)

5. [worker-infra] Create API route stubs (after shared libs exist):
   - All routes from EPIC_SCRAPER_SPEC.md Section 5 under src/app/api/scraper/
   - Each stub returns 501 Not Implemented
   - Use existing Epic Dash auth middleware pattern

IMPORTANT: Each teammate reads CLAUDE.md for file ownership. No teammate writes outside its listed files.
```

**After spawning, press Shift+Tab for delegate mode.**

### Quality Gate

```bash
npx tsc --noEmit  # must pass
npm run dev       # must start
```
- Navigate to Scraper page → empty state
- Navigate to Library page → empty state
- Both match Epic Dash design

Tell user to confirm. Exit claude.

---

## STEP 3: SCRAPER PHASE 2 — Web Scraping (new session)

```bash
claude --teammate-mode tmux
```

```
Read CLAUDE.md and EPIC_SCRAPER_SPEC.md. Build Scraper Phase 2 (Web Scraping Engine).

Create an agent team with 3 teammates. Use delegate mode.

Tasks (with dependencies):

1. [web-engine] Build src/lib/scraper/engines/web-engine.ts:
   - Implement ScrapeEngine interface from engines/types.ts
   - cheerio for HTML parsing, @mozilla/readability for articles
   - Extract: text, images, tables→JSON, links, headings, meta, OG, JSON-LD, source
   - Download assets to /tmp → upload to Supabase Storage → return in assets array
   - Graceful: return partial results on failure, don't throw

2. [worker-handler] Build worker job processing (can start immediately — stub the engine import):
   - src/worker/scraper-worker.ts (BullMQ worker for 'epic-scraper' queue)
   - src/lib/scraper/engine-dispatch.ts (route source type → engine)
   - storeResults(): create scraper_items + scraper_assets + scraper_metadata rows
   - updateJobStatus(): update scraper_jobs with status/progress
   - Supabase admin client (service role key, bypasses RLS)
   - /tmp cleanup in finally block
   - Wire into src/worker/index.ts
   - Fill in API route handlers:
     POST /api/scraper/scrape: validate with Zod, enqueue via HTTP bridge
     GET /api/scraper/jobs: list jobs with pagination
     GET /api/scraper/jobs/[jobId]: job detail
     GET /api/scraper/library: list items with search/filter/pagination
     GET /api/scraper/library/[itemId]: item detail with assets
     PATCH /api/scraper/library/[itemId]: update tags/notes/collection/starred

3. [frontend-ui] Build all Scraper UI (can start immediately — use mock data until API is ready):
   - Scraper page (/org/[orgId]/scraper): URL input with source detection, options, job cards with realtime progress
   - Job Detail (/org/[orgId]/scraper/[jobId]): tabs for content, assets, tables, metadata, source, links
   - Library (/org/[orgId]/library): card grid, search bar, filters, sort
   - Item Detail (/org/[orgId]/library/[itemId]): tabs + edit tags/notes/collection
   - Match Epic Dash design exactly
   - Use Supabase subscription on scraper_jobs for realtime progress

All 3 teammates start immediately in parallel. No task depends on another — web-engine builds the engine, worker-handler builds the pipeline (stubs engine import until ready), frontend builds all UI (uses mock data until API ready). They converge when all finish.
```

**Shift+Tab for delegate mode.**

### Quality Gate
- Paste any website URL → job starts → progress → completes
- Data appears in Library with text, images, metadata
- Search returns results
- Test 2-3 different sites

Exit claude.

---

## STEP 4: SCRAPER PHASE 3 — YouTube (new session)

```bash
claude --teammate-mode tmux
```

```
Read CLAUDE.md and EPIC_SCRAPER_SPEC.md Section 7 (YouTube Engine).

Create an agent team with 2 teammates. Use delegate mode.

CRITICAL: Transcripts via yt-dlp --write-auto-sub, NOT YouTube Captions API (needs OAuth).

Tasks:

1. [youtube-engine] Build YouTube scraping:
   - src/lib/scraper/engines/youtube-engine.ts implementing ScrapeEngine
   - yt-dlp wrapper: video (≤1080p, max 20min, reject longer, compress >200MB)
   - yt-dlp --write-auto-sub → VTT file
   - src/lib/scraper/vtt-parser.ts (strip timestamps, deduplicate)
   - YouTube Data API v3 (API key, no OAuth): metadata, thumbnails, comments
   - Add youtube to engine-dispatch.ts

2. [youtube-frontend] (depends on #1) YouTube UI components:
   - Video player component (HTML5 video + Supabase signed URL)
   - Transcript viewer (collapsible, searchable)
   - YouTube metadata display (channel, views, likes, date)
   - Wire into Library item detail for source_type='youtube'
```

### Quality Gate
- Paste YouTube URL (< 20 min) → video + transcript + metadata scraped
- Video plays in Library, transcript is clean

Exit claude.

---

## STEP 5: SCRAPER PHASES 4+5 — Platforms + Polish (new session)

```bash
claude --teammate-mode tmux
```

```
Read CLAUDE.md and EPIC_SCRAPER_SPEC.md Sections 7 (remaining), 9, 12.

Create an agent team with 3 teammates. Use delegate mode.

Tasks:

1. [platform-engines] Build platform scrapers:
   - social-engine.ts: Twitter, Instagram, TikTok, Facebook, LinkedIn (oembed→OG→Puppeteer screenshot)
   - github-engine.ts: repo, README, files, languages, commits (REST API)
   - document-engine.ts: PDF (pdf-parse), Google Docs/Drive
   - All implement ScrapeEngine. Graceful degradation always.
   - Wire into engine-dispatch.ts

2. [advanced-scraping] (depends on #1) Advanced features:
   - Puppeteer fallback for renderJs=true pages
   - Puppeteer screenshot for social media fallback
   - POST /api/scraper/scrape/batch endpoint + worker batch handling

3. [polish-frontend] Polish all UI:
   - Batch mode (multi-URL textarea, max 25)
   - Collections CRUD + assign items + browse by collection
   - Tag editor, star toggle, notes on items
   - Full-text search endpoint + UI
   - Bulk actions (multi-select → tag/delete/collect)
   - Stats bar (total items, storage, by type)
   - Loading skeletons + error states + empty states on EVERY component
   - GET /api/scraper/health endpoint
```

### Quality Gate
- GitHub URL, tweet, PDF → all scrape
- Batch 3 URLs → all complete
- Collections, search, bulk actions work
- Every page has loading/error/empty states

**Epic Scraper complete. 🎉** Exit claude.

---

## STEP 6: REMIX PHASE 1 — Foundation + Bridge (new session)

User needs: `GOOGLE_GEMINI_API_KEY`, `FAL_KEY` in `.env.local`

```bash
claude --teammate-mode tmux
```

```
Read CLAUDE.md and EPIC_REMIX_SPEC.md Sections 3-7.

Create an agent team with 3 teammates. Use delegate mode.

IMPORTANT: Remix migration MUST be numbered after scraper migration (002_remix_tables.sql).
remix_sources has FK to scraper_items.

Tasks (with dependencies):

1. [remix-database] Create migration + shared libs:
   - 002_remix_tables.sql: ALL remix_ tables (Spec Section 5)
   - CREATE OR REPLACE timestamp trigger (safe if scraper created it)
   - RLS + realtime for remix_jobs, remix_scenes
   - src/lib/remix/validators.ts, storage.ts, cost-estimator.ts

2. [remix-frontend-shell] Build Remix UI shell:
   - Add "Remix" to sidebar after Library
   - Page shells for all remix routes
   - PipelineStepper (Source→Remix→Approve→Generate→Review)
   - SourceSelector: query scraper_items for video/audio, selectable grid
   - New Project page + project dashboard
   - "Send to Remix" link button on Library item detail pages

3. [remix-api-setup] (depends on #1) API + worker setup:
   - API route stubs under src/app/api/remix/
   - Library bridge: GET /api/remix/library/videos, GET /api/remix/library/[itemId]
   - POST /api/remix/projects: create project + cache scraper data into remix_sources
   - Add remix queues to shared worker (src/worker/index.ts)
   - src/worker/remix-worker.ts stub
```

### Quality Gate
- Navigate Remix → empty project list
- New Project → see scraper items → create project → appears in list
- Pipeline stepper renders with correct states
- "Send to Remix" on Library items works

Exit claude.

---

## STEP 7: REMIX PHASE 2 — Remix Pipeline (new session)

```bash
claude --teammate-mode tmux
```

```
Read CLAUDE.md and EPIC_REMIX_SPEC.md Sections 8-9 (Pipeline + Gemini/fal.ai).

Create an agent team with 3 teammates. Use delegate mode.

Tasks (with dependencies):

1. [title-remix] Title remixing:
   - src/lib/remix/title-remixer.ts (Gemini 2.0 Flash, JSON mode, 8 variations, temp 0.8)
   - src/worker/handlers/remix-title.ts
   - POST /api/remix/title handler

2. [thumbnail-script] Thumbnail + Script:
   - src/lib/remix/thumbnail-remixer.ts (Gemini Vision base64 → fal.ai FLUX 3x 1280x720)
   - src/lib/remix/script-remixer.ts (Gemini JSON mode, scenes 15-45s, temp 0.6)
   - Worker handlers + API routes for both

3. [remix-ui] Remix tab UI (can start immediately — build with placeholder data, wire when APIs ready):
   - TitleVariations: 8 cards, select, edit inline, regenerate
   - ThumbnailGrid: 3 images, select, regenerate with custom prompt
   - ScriptEditor: scene-based, edit dialogue/B-roll/timing
   - Approval gate: verify title + thumbnail + script selected → unlock Generate
   - Source tab: show cached original content
```

### Quality Gate
- 8 titles, 3 thumbnails, scene script generated
- Select + approve → Generate step unlocks

Exit claude.

---

## STEP 8: REMIX PHASE 3 — Generation (new session)

User needs: `ELEVENLABS_API_KEY`, `HEYGEN_API_KEY`, `RUNWAY_API_KEY` in `.env.local`

```bash
claude --teammate-mode tmux
```

```
Read CLAUDE.md and EPIC_REMIX_SPEC.md Section 9 (ALL API integrations).

CRITICAL SECURITY — TELL EVERY TEAMMATE:
HeyGen: Upload Asset API → audio_asset_id. NEVER audio_url. NEVER public storage.

Create an agent team with 4 teammates. Use delegate mode.

Tasks (with dependencies):

1. [voiceover] ElevenLabs integration:
   - src/lib/remix/elevenlabs.ts (direct fetch, NOT npm package, mp3_44100_128)
   - Voice list, per-scene MP3, preview
   - Worker handler + API routes

2. [avatar] HeyGen integration (SECURITY CRITICAL):
   - src/lib/remix/heygen.ts
   - Download audio from Supabase → /tmp → upload to HeyGen Asset API → audio_asset_id
   - Generate video with asset_id (NOT url). Webhook + poll fallback.
   - POST /api/remix/webhooks/heygen (webhook endpoint on Netlify)
   - Worker handler + API routes

3. [broll] Runway + Kling:
   - src/lib/remix/runway.ts, kling.ts, broll-generator.ts
   - Auto-fallback: 3 Runway failures → switch to Kling
   - POST /api/remix/webhooks/runway
   - Worker handler

4. [generate-ui] Generate tab UI (can start immediately — build with loading states, wire to real data as APIs complete):
   - VoiceSelector with preview, AvatarSelector with preview
   - CostEstimator floating widget
   - Per-scene progress cards (audio/avatar/broll status)
   - "Generate All" + individual regen + cancel
   - Blocked until approval gate passed
   - Realtime via Supabase subscription on remix_scenes

All: /tmp cleanup in finally. Log via pino.
```

### Quality Gate
- Voice preview works, avatar preview works
- Generate All → per-scene progress → audio ✅ avatar ✅ B-roll ✅
- Cost estimate displays

Exit claude.

---

## STEP 9: REMIX PHASE 4 — Video Assembly (new session)

```bash
claude --teammate-mode tmux
```

```
Read CLAUDE.md and EPIC_REMIX_SPEC.md Sections 10, 13.

Create an agent team with 2 teammates. Use delegate mode.

Tasks (with dependencies):

1. [video-assembly] Build render pipeline:
   - src/lib/remix/ffmpeg-utils.ts (probe, normalize 1080p30fps, concat)
   - src/lib/remix/assembler.ts (download → normalize → Remotion compose → render → upload)
   - src/lib/remix/remotion/ (composition, scenes, config)
   - src/worker/handlers/render.ts (concurrency: 1, /tmp cleanup)

2. [assembly-ui] (depends on #1) Assembly + Review UI:
   - Assemble tab: SceneTimeline, RenderProgress, render button
   - Review tab: VideoPlayer (signed URL + seek), download, cost summary
   - "Start New Remix" button
```

### Quality Gate
- Render → progress → final video plays → download works

Exit claude.

---

## STEP 10: POLISH (new session)

```bash
claude --teammate-mode tmux
```

```
Final polish pass across both modules.

Create an agent team with 2 teammates. Use delegate mode.

Tasks:

1. [ui-polish] UI audit:
   - Loading skeletons (not spinners) on every page/component in both modules
   - Error states with retry button everywhere
   - Empty states with call-to-action everywhere
   - Realtime subscriptions: scraper_jobs, remix_jobs, remix_scenes
   - Responsive at all viewport sizes

2. [backend-polish] Backend audit:
   - GET /api/scraper/health + GET /api/remix/health
   - Cost tracking: every API call → remix_api_usage
   - Failed job retry from UI
   - npx tsc --noEmit clean
   - npm run lint clean
   - npx tsc -p tsconfig.worker.json clean
```

### Quality Gate — Full E2E
1. YouTube URL → Scraper → Library
2. "Send to Remix" → New Project
3. Remix → 8 titles, 3 thumbnails, script
4. Approve → Generate → audio, avatar, B-roll per scene
5. Render → final video plays → download MP4

Every step works. Exit claude.

---

## STEP 11: RAILWAY DEPLOY (single session, no team needed)

```bash
claude
```

```
Create Railway deployment config for the shared worker:

1. Dockerfile: node:20-slim + python3 + chromium + fonts + ffmpeg + yt-dlp
   ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
   ENV REMOTION_CHROMIUM_EXECUTABLE=/usr/bin/chromium
   CMD ["node", "dist/worker/index.js"]

2. railway.toml with build/start commands

3. package.json: "build:worker": "tsc -p tsconfig.worker.json"

Then guide me to: create Railway project, set env vars, deploy,
copy Railway URL → WORKER_URL in Netlify, set WEBHOOK_BASE_URL to Netlify URL.
```

---

## EMERGENCY FIXES

| Problem | Fix |
|---|---|
| Lead codes instead of delegating | Press Shift+Tab for delegate mode |
| Teammates spam permission prompts | Check ~/.claude/settings.json permissions |
| Two teammates edited same file | Check git diff, merge manually, tell lead to reassign |
| Invents new design | "Stop. Match Epic Dash design. Copy existing patterns." |
| Makes storage public | "Stop. Storage private. See CLAUDE.md Security." |
| Uses audio_url for HeyGen | "Stop. Upload Asset API → audio_asset_id." |
| Uses YouTube Captions API | "Stop. yt-dlp --write-auto-sub. No OAuth." |
| Skips approval gate | "Stop. Pipeline PAUSES after remix." |
| Worker uses @/ imports | "Stop. tsconfig.worker.json, relative imports only." |
| Teammate stuck/errored | Message them directly (Shift+Down), give instructions |
| Lead shuts down too early | Tell lead: "Wait for all teammates to finish." |
| Orphaned tmux sessions | `tmux ls` then `tmux kill-session -t <name>` |

---

## SUMMARY

```
Step 0:  Setup (settings.json, Upstash, tmux, permissions)
Step 1:  Explore codebase + install deps (solo session)
Step 2:  Scraper Foundation     (3 teammates, delegate mode)
Step 3:  Scraper Web Engine     (3 teammates, delegate mode)
Step 4:  Scraper YouTube        (2 teammates, delegate mode)
Step 5:  Scraper Platforms+Polish (3 teammates, delegate mode)
Step 6:  Remix Foundation       (3 teammates, delegate mode)
Step 7:  Remix Pipeline         (3 teammates, delegate mode)
Step 8:  Remix Generation       (4 teammates, delegate mode)
Step 9:  Remix Assembly         (2 teammates, delegate mode)
Step 10: Polish                 (2 teammates, delegate mode)
Step 11: Railway Deploy         (solo session)
```

11 sessions. 27 total teammates. Each session: fresh start, delegate mode, tmux panes.
Scraper must complete through Step 3 before Remix Step 6 starts.
