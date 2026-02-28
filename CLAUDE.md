# CLAUDE.md — Epic Dash Module Development

## Project

Epic Dash — Next.js 14+ App Router SaaS dashboard on Netlify. Two modules being added:
- **Epic Scraper** (spec: `EPIC_SCRAPER_SPEC.md`) — Universal web scraper → repository database
- **Epic Remix** (spec: `EPIC_REMIX_SPEC.md`) — AI video remixing pulling from Scraper repository

**Second build attempt.** First failed with linear GSD framework. Now using **Agent Teams**.

## Agent Teams Configuration

```json
// ~/.claude/settings.json (user must set before starting)
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(npx tsc *)",
      "Bash(cat *)",
      "Bash(ls *)",
      "Bash(find *)",
      "Bash(head *)",
      "Bash(tail *)",
      "Bash(wc *)",
      "Bash(grep *)",
      "Bash(mkdir *)",
      "Bash(cp *)",
      "Bash(mv *)",
      "Read",
      "Write",
      "Edit"
    ]
  }
}
```

### Agent Teams Rules

- **Delegate mode**: Press Shift+Tab after spawning a team. Lead coordinates ONLY — never codes.
- **Display mode**: Use tmux split panes for 3+ teammates (`--teammate-mode tmux`).
- **One team per session**: Each build phase = one `claude` session. Exit and restart between phases.
- **Teammates don't inherit conversation history**: Every teammate reads THIS file (CLAUDE.md) automatically, but knows nothing about prior phases. Include all critical context in the spawn prompt.
- **Task dependencies**: Use `depends on #N` syntax so downstream tasks auto-unblock.
- **File conflicts = wasted sessions**: Two teammates editing the same file = silent overwrites. Follow the File Ownership Map below strictly.

## File Ownership Map

Teammates MUST only write to their owned files. This prevents the #1 agent teams failure mode (silent file overwrites).

```
## Epic Scraper File Ownership
supabase/migrations/001_scraper_*     → database-setup teammate
src/lib/scraper/engines/types.ts      → database-setup teammate
src/lib/scraper/engines/web-engine.ts → web-engine teammate
src/lib/scraper/engines/youtube-*.ts  → youtube-engine teammate
src/lib/scraper/engines/social-*.ts   → platform-engines teammate
src/lib/scraper/engines/github-*.ts   → platform-engines teammate
src/lib/scraper/engines/document-*.ts → platform-engines teammate
src/lib/scraper/detector.ts           → database-setup teammate
src/lib/scraper/validators.ts         → database-setup teammate
src/lib/scraper/storage.ts            → database-setup teammate
src/lib/scraper/engine-dispatch.ts    → worker-handler teammate
src/lib/scraper/vtt-parser.ts         → youtube-engine teammate
src/lib/queue/*                       → worker-infra teammate
src/lib/logger.ts                     → worker-infra teammate
src/worker/enqueue-server.ts            → worker-infra teammate (Step 2)
src/worker/index.ts                     → worker-infra teammate (Step 2), then worker-handler extends (Step 3+)
src/worker/scraper-worker.ts            → worker-handler teammate (Step 3)
src/app/api/scraper/**                  → worker-infra teammate (stubs, Step 2) → worker-handler fills in (Step 3)
src/app/org/[orgId]/scraper/**        → scraper frontend teammate (Steps 2-5)
src/app/org/[orgId]/library/**        → scraper frontend teammate (Steps 2-5)
src/components/scraper/**             → scraper frontend teammate (Steps 2-5)

## Epic Remix File Ownership
supabase/migrations/002_remix_*       → remix-database teammate
src/lib/remix/validators.ts           → remix-database teammate
src/lib/remix/storage.ts              → remix-database teammate
src/lib/remix/cost-estimator.ts       → remix-database teammate
src/lib/remix/title-remixer.ts        → title-remix teammate
src/lib/remix/thumbnail-*.ts          → thumbnail-script teammate
src/lib/remix/script-*.ts             → thumbnail-script teammate
src/lib/remix/elevenlabs.ts           → voiceover teammate
src/lib/remix/heygen.ts               → avatar teammate
src/lib/remix/runway.ts               → broll teammate
src/lib/remix/kling.ts                → broll teammate
src/lib/remix/broll-generator.ts      → broll teammate
src/lib/remix/assembler.ts            → video-assembly teammate
src/lib/remix/ffmpeg-utils.ts         → video-assembly teammate
src/lib/remix/remotion/**             → video-assembly teammate
src/worker/handlers/remix-*.ts        → each handler owned by its domain teammate
src/worker/handlers/generate-*.ts     → each handler owned by its domain teammate
src/worker/handlers/render.ts         → video-assembly teammate
src/app/api/remix/**                  → remix-api-setup teammate
src/app/api/remix/webhooks/heygen/**  → avatar teammate
src/app/api/remix/webhooks/runway/**  → broll teammate
src/app/org/[orgId]/remix/**          → remix-frontend teammate
src/components/remix/**               → remix-frontend teammate

## Shared (coordinate through lead before editing)
package.json                          → Lead / orchestrator ONLY
tsconfig.worker.json                  → worker-infra teammate
Sidebar component                     → coordinate: frontend creates, remix-frontend adds to
```

## First Priority — Read The Codebase

Before writing ANY code, explore the existing Epic Dash project:
```bash
find src -type f -name "*.tsx" -o -name "*.ts" | head -60
cat package.json | head -40
cat tsconfig.json && cat next.config.*
cat src/app/globals.css && cat src/app/layout.tsx
ls src/components/ui/
cat src/middleware.ts
find src -name "*sidebar*" -o -name "*nav*"
ls -R src/app/org/ 2>/dev/null
```

DO NOT invent patterns. Copy what exists.

## Namespace Rules

| Module | DB Prefix | Storage Prefix | API Prefix | Route Prefix |
|---|---|---|---|---|
| Epic Scraper | `scraper_` | `scraper/{orgId}/` | `/api/scraper/` | `/org/[orgId]/scraper`, `/org/[orgId]/library` |
| Epic Remix | `remix_` | `remix/{orgId}/` | `/api/remix/` | `/org/[orgId]/remix` |

Storage bucket: `epic-assets` (created in scraper migration, shared by both modules)

## Architecture

```
NETLIFY (Epic Dash web)
├── Scraper + Remix pages, API routes
├── API routes enqueue jobs via HTTP POST to Railway
├── Webhook endpoints for HeyGen/Runway (WEBHOOK_BASE_URL = Netlify URL)

RAILWAY (Shared Worker)
├── Express enqueue server (receives POST from Netlify → adds to BullMQ)
├── Scraper workers, Remix workers, Render worker (concurrency: 1)
└── ioredis → Upstash Redis

UPSTASH REDIS (serverless — both Netlify + Railway can reach)
└── Queues: epic-scraper, epic-remix, epic-generate, epic-render

SUPABASE (shared)
├── scraper_* tables, remix_* tables, epic-assets bucket
```

**CRITICAL**: Netlify Functions can't hold persistent Redis connections. API routes POST to `WORKER_URL/enqueue` on Railway. Railway adds to BullMQ.

## Auth & Design

- **Auth**: Epic Dash owns it. Look at existing API routes. No new auth logic.
- **Design**: Match Epic Dash EXACTLY. Find closest existing component, copy its patterns.

## Data Flow

```
Epic Scraper → scraper_items + scraper_assets (write)
                    ↓ (read-only)
Epic Remix reads → caches into remix_sources at project creation → remix_* tables (write)
```

## Security — Non-Negotiable

- **HeyGen**: Upload Asset API → `audio_asset_id`. NEVER `audio_url`. NEVER public storage.
- **Supabase Storage**: Always private. Signed URLs (1-hour, server-generated) for frontend.
- **YouTube transcripts**: `yt-dlp --write-auto-sub`, NOT Captions API (requires OAuth).

## Pipeline Gate (Epic Remix)

```
SELECT SOURCE → REMIX → ⛔ USER APPROVAL ⛔ → GENERATE → ASSEMBLE
```
After remix: pipeline PAUSES. User MUST select title + thumbnail + approve script + choose voice/avatar. Generate endpoints verify selections exist before proceeding.

## Worker Rules

- Standalone Node.js process, NOT inside Next.js
- `tsconfig.worker.json`: relative imports only, no `@/` aliases
- Supabase admin client (service role key, bypasses RLS)
- Every handler cleans `/tmp` in `finally` block
- Render queue: concurrency 1 (CPU-intensive)
- Logging: pino with module child loggers. Never console.log.

## Build Order

Epic Scraper (Phases 1-5) → Epic Remix (Phases 1-5) → Railway Deploy.
Scraper through Step 3 (Phase 2) must complete before Remix Step 6 starts (FK dependency on scraper_items).
See `DEPLOYMENT_GUIDE.md` for step-by-step agent team prompts.
