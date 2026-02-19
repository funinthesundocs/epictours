---
name: skill-creation-guide
description: Universal template and methodology for creating agent skills that work first-try across all models and workspaces. Read this BEFORE building any new skill. Contains principles distilled from 8 iterative rounds of real-world skill development and multi-model testing.
---

# Universal Skill Creation Guide

> Read this document before creating any new skill. It contains hard-won principles from iterative development and multi-model testing that prevent you from repeating mistakes that cost hours to diagnose.

> [!TIP]
> **Collective wisdom:** Check `.agent/alignment/pearls.md` for accumulated organizational principles. After building a skill, run the `wisdom-harvest` skill to extract any new general principles from your session.

---

## Should This Be a Skill?

Not everything needs the full skill framework. Use this decision gate:

| Situation | Create a skill? |
|-----------|----------------|
| One-time script (migration, cleanup, debug) | No — just a script |
| Recurring automation (daily, weekly, triggered) | **Yes** |
| Multiple agents or models will execute it | **Yes** |
| Will be used across workspaces | **Yes** |
| Complex with hard-won gotchas worth preserving | **Yes** |

If you answered "Yes" to any row, build a full skill. Otherwise, a plain script is fine.

---

## The Template

Every skill MUST follow this exact structure. Sections are mandatory unless marked optional.

**File location:** `.agent/skills/[skill-name]/SKILL.md` — the directory name must match the `name` in the frontmatter.

```markdown
---
name: skill-name-here
description: One sentence. What it does + when to trigger it.
---

# [Skill Title]

> **New workspace?** Go to First-Time Setup at the bottom to create files, then return here.

## Run It

**As a human (PowerShell):**
(exact command)

**As an AI agent:**
(exact dispatch command per model, with cost note)

## Dependencies (install once)

(exact pip/npm install commands + system requirements)
(env vars needed in .env.local)

---

## Credentials

(table: Field | Value — every credential inline, never referenced externally)

---

## Critical Rules (do not deviate)

(bullet list of hard rules discovered through failure — each with WHY)

---

## Error Table

(table: Error | Cause | Fix — every error you encountered during development)

## Success Criteria

(bullet checklist — what "done" looks like, measurable)

## Performance Baseline (normal = healthy)

(table: Phase | Expected | Investigate if — gives agents anomaly detection)

---

## First-Time Setup

(full embedded source code for every file the skill needs)
```

> **Worked example:** If this workspace has a `fareharbor-manifest` skill, use it as your reference — it's a complete, tested implementation of this template (527 lines, verified across MiniMax-M2.5 and Claude Haiku 4.5). Look for it at `.agent/skills/fareharbor-manifest/SKILL.md`.

---

## The 16 Principles

### Quick Reference (one-liner each)

| # | Principle | Rule |
|---|-----------|------|
| 1 | Observable state | Replace every `sleep()` with a condition that checks actual state |
| 2 | Native over external | Use built-in tools (CDP, stdlib) before adding dependencies |
| 3 | No OS-level UI | Never trigger dialogs, print prompts, or file-open in automation |
| 4 | Exact flags | Document the exact command string — synonyms and defaults lie |
| 5 | Debug probe first | Verify actual DOM/API structure before writing selectors |
| 6 | No assumed guards | Only add data-shape guards verified against real data |
| 7 | Extract before transform | Read data before clicking buttons that change layout or state |
| 8 | ASCII-safe output | No Unicode in print() — Windows charmap crashes in subprocesses |
| 9 | Declare target OS | State OS and path format explicitly — models assume their training bias |
| 10 | Additive enhancement | After each model test, add rules — never remove existing ones |
| 11 | Cost/perf per model | Include comparison table so agents pick the right model for the job |
| 12 | Internal consistency | Grep entire skill for stale refs after every code change |
| 13 | Define "normal" | Add performance baselines with "investigate if" thresholds |
| 14 | Fully self-contained | Embed all source code — file references break in new workspaces |
| 15 | All prereqs documented | Exact install commands, env var formats, system requirements |
| 16 | Credentials inline | Agents can't look up passwords — include them in the skill |

### Detailed Principles

#### Architecture

**1. Never guess timing — wait for observable state.**
Replace every `sleep()`, `wait(5000)`, or fixed delay with a condition that observes the actual state you need. If the DOM needs to render, poll for the specific element. If an API needs to respond, wait for the status code. Magic numbers are lies — they work on your machine today and fail tomorrow.

**2. Use native capabilities over external dependencies.**
If the browser can generate a PDF via CDP, don't install `pdfkit`. If the language has a built-in HTTP client, don't add `axios`. Every external dependency is a failure point, an install step, and a version mismatch waiting to happen.

**3. Never trigger OS-level UI in automation.**
`window.print()` opens a dialog. `os.system("open file.pdf")` opens a viewer. These halt automation, cause timeouts, and behave differently per OS. Always use programmatic alternatives that stay in-process.

**4. Document exact flags and versions — synonyms lie.**
`--headless` is not `--headless=new`. `python` is not `python3`. `npm start` is not `npm run dev`. The exact string matters. Document the exact command that works, including version-specific flags.

#### Selector Precision

**5. Never assume DOM structure — verify with a debug probe.**
Before writing any selector, run a throwaway script that dumps the actual DOM. The element you think is a `td` might be a `th`. The class you expect might be dynamically generated. Assumptions about structure are the #1 cause of silent failures.

**6. Guards based on assumed data shape will fail silently.**
`el.children.length > 0` seems reasonable. But if the text you need is wrapped in a `<span>` inside the element, the check passes while your extraction misses the data. Only add guards you've verified against real data.

**7. Extract data before transforming state.**
If you need to read something from the DOM, do it BEFORE clicking buttons that trigger CSS changes, page transitions, or layout shifts. State transformations destroy evidence — print CSS hides elements, navigation clears the DOM, modal overlays block access.

#### Multi-Model Compatibility

**8. All output must be ASCII-safe.**
When a script runs inside a subprocess (which is how every dispatch model executes), Windows `charmap` encoding crashes on Unicode characters like `✓`, `✅`, `→`. Use ASCII equivalents: `[OK]`, `[PASS]`, `->`. This is non-negotiable on Windows.

**9. Explicitly state the target OS and path format.**
Models default to their training bias — Minimax defaults to Linux paths (`/mnt/c/...`), others may assume macOS. State clearly: "This is a Windows machine. Use `c:\path\to\dir`, never `/mnt/c/...`." One line prevents an entire class of failures.

**10. Test with every target model, then additively enhance.**
After each model test, add what you learned to the skill. Never remove existing rules — only add. Model A's failure teaches you something Model B won't encounter, but the added rule costs nothing and prevents future regressions.

**11. Document cost and performance per model.**
Agents should be able to choose the right model for the job. A daily cron task should use the cheapest model. A complex reasoning task should use the best. Include a comparison table with API call time and cost per run.

#### Documentation Consistency

**12. A skill must be internally consistent — stale references are traps.**
If your Critical Rules say "query `th`" but your Error Table says "query `td`", an agent will follow whichever it reads first. After every code change, grep the entire skill for stale references to the old approach. One contradictory line wastes more time than no documentation at all.

**13. Define what "normal" looks like.**
Without a performance baseline, an agent can't distinguish "slow but working" from "stuck." Add expected durations and "investigate if" thresholds. An agent seeing 120s when the baseline says 35s will stop and diagnose instead of silently retrying.

#### Portability

**14. A universal skill must be fully self-contained.**
If your skill references `scripts/foo.py` but doesn't contain the script, it's not portable. A new workspace has no context, no git history, no prior conversation. Embed every file the skill needs to function — the full source code, not a summary.

**15. Document every prerequisite, including env vars and API keys.**
"Install requests" is not enough. Specify `pip install requests selenium`, the exact Chrome version requirement, and the `.env.local` format with key names. A cold-start agent should be able to go from zero to running with nothing but the skill document.

**16. Credentials go inline — agents can't look them up.**
Don't say "use the FareHarbor credentials." Put the username and password in the skill. An agent in a new workspace has no history, no memory, no access to your password manager. If credentials are secrets, note that — but include them.

---

## The Process

### Phase 1: Build (get it working)

1. Write the core script first — get functional, don't optimize
2. Run it yourself and verify the output
3. If it fails, fix the root cause (not the symptom)
4. Iterate until you get one clean run

### Phase 2: Optimize (remove waste)

1. Replace all `sleep()` / fixed delays with event-based waits
2. Remove unused imports, dead code paths, and fallback branches
3. Verify selectors against actual DOM (run a debug probe)
4. Confirm execution order — extract before transform
5. Run again and verify output is identical

### Phase 3: Document (create the skill)

1. Write the SKILL.md following the Template above
2. Include every rule you discovered during Phase 1-2 in Critical Rules
3. Add every error you encountered to the Error Table
4. Define Success Criteria and Performance Baseline
5. **Embed all source code** in the First-Time Setup section
6. **Consistency grep** — search the entire skill for stale references to old approaches (Principle 12)

### Phase 4: Multi-Model Test

1. Dispatch to Model A (e.g., Minimax) — observe and fix
2. **Additively enhance** the skill with what Model A taught you
3. Dispatch to Model B (e.g., Haiku) — observe and fix
4. **Additively enhance** the skill again
5. Add performance comparison table
6. Repeat for each target model

### Phase 5: Portability Audit

Ask yourself: "If I paste this document into a brand new workspace with an agent that has zero context, can it execute the skill end-to-end without asking me a single question?"

If the answer is no, you're not done.

Checklist:
- [ ] All scripts embedded (not referenced)?
- [ ] All credentials included inline?
- [ ] All env vars documented with format?
- [ ] All install commands exact and complete?
- [ ] All paths use documented OS format?
- [ ] No stale references to old approaches?
- [ ] Performance baseline included?
- [ ] Error table covers every failure encountered?
- [ ] Success criteria are measurable?
- [ ] Tested with 2+ models?

---

## The Compression Principle

A skill will be consumed by models with limited context windows and token budgets. Every word costs. Apply these rules:

- **Tables over paragraphs.** A 3-column table conveys more in fewer tokens than prose.
- **Rules over explanations.** "Use `th` not `td`" beats a paragraph about how you discovered it.
- **Canonical source, then reference.** State each rule definitively in ONE section (usually Critical Rules). Other sections reference it: "see Critical Rule #3." Never duplicate the full explanation.
- **But never omit for brevity.** A missing rule costs hours of debugging. A verbose rule costs tokens. Tokens are cheaper than hours.
