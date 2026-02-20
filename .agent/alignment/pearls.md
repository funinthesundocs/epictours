# Organizational Pearls of Wisdom

> General principles extracted from real work sessions. These apply to ALL future work regardless of project.
> Maintained by the `wisdom-harvest` skill (see `.agent/skills/wisdom-harvest/SKILL.md`).
>
> **Current count: 32 / 111** — When a new pearl is added and this hits 112, evict the oldest Seed before committing.

## Browser Automation

| Pearl | Rule | Maturity | Added |
|-------|------|----------|-------|
| Verify DOM before selecting | Run a debug probe to dump actual element tags and classes before writing any selector — assumptions about DOM structure are the #1 cause of silent failures | Established | 2026-02-19 |
| Extract before transform | Read all data from the DOM before clicking buttons that trigger CSS changes, page transitions, or layout shifts — state transforms destroy evidence | Established | 2026-02-19 |
| Observable waits only | Replace every sleep() or fixed delay with a condition that checks actual observable state — magic numbers are lies that work today and fail tomorrow | Established | 2026-02-19 |

## Windows Compatibility

| Pearl | Rule | Maturity | Added |
|-------|------|----------|-------|
| ASCII-only subprocess output | Never use Unicode characters (checkmarks, arrows, emoji) in print() statements that run inside subprocesses — Windows charmap encoding will crash | Established | 2026-02-19 |
| Declare OS and path format | Explicitly state the target OS and path style in every skill or instruction — models default to their training bias (usually Linux) and silently produce wrong commands | Established | 2026-02-19 |

## Iterative Refinement

| Pearl | Rule | Maturity | Added |
|-------|------|----------|-------|
| Recursive self-critique with a target | Set a numeric satisfaction threshold (e.g., 93%) and iterate until you reach it — open-ended "make it better" loops never converge | Established | 2026-02-19 |
| Additive enhancement only | After each test or iteration, add what you learned to the documentation — never remove existing rules, only add new ones | Established | 2026-02-19 |
| Consistency grep after every change | After modifying any code or documentation, grep the entire file for stale references to the old approach — one contradictory line wastes more debugging time than no documentation | Established | 2026-02-19 |
| Curated knowledge drifts without audits | Any curated knowledge base (pearls, codebase, test suite, docs) slowly accumulates low-quality entries unless a scheduled quality-review pass is built into the process | Seed | 2026-02-19 |
| Multi-round auditing compounds gap detection | A single review pass catches surface issues; each additional self-review round finds contradictions and staleness invisible to the first pass — schedule at least 3 audit rounds before declaring a rule system stable | Seed | 2026-02-19 |
| Contradictions between rules cause silent non-compliance | When two rules in the same system prescribe opposite behavior, agents pick one arbitrarily and appear compliant while violating the other — audit all rules for cross-rule conflicts before a system is considered stable | Seed | 2026-02-19 |

## General Engineering

| Pearl | Rule | Maturity | Added |
|-------|------|----------|-------|
| Never assume response format | When consuming output from any external system (model API, CLI tool, webhook), parse the structured content out of the raw response before executing — raw output always contains wrapper formatting that will break downstream commands | Confirmed | 2026-02-19 |
| Dense formats scale better | When designing a living document with a token budget, choose the densest readable format (tables > heading blocks) because format density determines how much knowledge fits before you hit limits | Seed | 2026-02-19 |
| Append-only for merge safety | Design shared files so edits are row appends rather than in-place modifications — this makes concurrent contributor merge conflicts trivial to resolve | Seed | 2026-02-19 |
| Externalized judgment scales capability | Writing judgment criteria into a document (gates, contrast examples, litmus tests) lets mid-tier models perform tasks that otherwise require frontier models — the quality ceiling shifts with the quality of the framework, not just the model | Seed | 2026-02-19 |
| Hard cap with eviction forces quality competition | Any curated collection (knowledge base, rules list, training examples) should have a hard maximum size with a priority eviction policy — without a cap, volume growth outpaces quality control and the weakest entries never face replacement pressure | Seed | 2026-02-19 |
| One-line canaries prove loaded state | When an agent or system loads context (config, rules, knowledge), require it to emit a single structured confirmation line (e.g., "N items loaded, mission: X") — this gives ground-truth observability with zero conversation pollution | Seed | 2026-02-19 |

## React & UI Architecture

| Pearl | Rule | Maturity | Added |
|-------|------|----------|-------|
| CSS portals don't inherit zoom | Radix UI Dialog, Popover, Tooltip, and Select render in React Portals detached from the app root and do NOT inherit the parent container's CSS zoom — apply zoom style manually to every portal Content component | Established | 2026-02-19 |
| Visual coords vs CSS coords | When calculating manual top/left positions after a zoom/scale transform, DOM getBoundingClientRect() returns visual viewport pixels but CSS expects layout viewport pixels — divide by (zoom/100) before applying as CSS style | Established | 2026-02-19 |
| Component state ownership | Before modifying a component's behavior from outside, read the component to find what internal state it owns — bypassing internal state setters causes UI desyncs where the data changes but the component display doesn't | Established | 2026-02-19 |
| Progressive loading: shell first | Render the page shell (header, toolbar, container) immediately without a loading gate — place the loading spinner INSIDE the data container so users understand the page structure before data arrives | Confirmed | 2026-02-19 |
| dvh over vh on mobile | Use dvh (dynamic viewport height) instead of vh for any full-height container — vh includes the browser chrome area and causes content cutoff until the user scrolls on mobile | Confirmed | 2026-02-19 |
| Cast form inputs before arithmetic | Always cast form inputs to Number() before arithmetic operations — React form values are strings by default and silent string concatenation instead of addition is a calculation bug that passes TypeScript | Confirmed | 2026-02-19 |
| Silent form errors need a callback | Always pass an error callback to form submit handlers (e.g. handleSubmit(onSubmit, err => console.error(err))) — submitting without one silently swallows validation errors and leaves the user with no feedback | Established | 2026-02-19 |
| Overflow-hidden traps portal z-index | Applying overflow-hidden to any container that has portal-based children (Dropdown, Tooltip, Dialog) will clip those portals at the container boundary — use overflow-visible and apply border-radius to inner elements instead | Established | 2026-02-19 |

## Database Design

| Pearl | Rule | Maturity | Added |
|-------|------|----------|-------|
| Indexes belong in the same migration | Always add database indexes in the same migration file as the table creation, using IF NOT EXISTS — indexes added later are often forgotten, causing slow queries that take hours to diagnose | Established | 2026-02-19 |
| Separate identity from role data | Store identity data (name, email, phone) in one canonical table and create module-specific extension tables that link by foreign key — a person who is both a customer and a staff member should have one identity row, not two | Confirmed | 2026-02-19 |
| TEXT over CHECK for dynamic enums | Use plain TEXT NOT NULL instead of CHECK constraints on columns whose valid values may grow (status, type, tier) — a CHECK constraint on dynamic values causes INSERT failures when new categories are added without a migration | Established | 2026-02-19 |
| Nullable DB columns need .nullable() | Use z.string().optional().nullable() for any form field that maps to a nullable database column — .optional() alone only handles undefined, not null, causing silent Zod validation failures on real DB values | Established | 2026-02-19 |
| Always join for identity fields | Never select name, email, or phone from module tables — they live in the identity table and querying them from role tables returns stale or missing data after schema normalization | Established | 2026-02-19 |
| Orphan records come from missing parent IDs | When creating child records from a filtered view, always pass the parent ID explicitly to the create form — if it lives in a filter dropdown rather than the form's initialData, the created record will have a NULL parent ID and disappear from all filtered views | Established | 2026-02-19 |

## Debugging Strategy

| Pearl | Rule | Maturity | Added |
|-------|------|----------|-------|
| Find a working example before debugging | Before guessing the cause of a broken feature, locate a parallel working feature in the same codebase and diff the implementations — copying established working patterns beats inventing new solutions | Established | 2026-02-19 |

