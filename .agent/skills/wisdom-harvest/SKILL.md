---
name: wisdom-harvest
description: End-of-session retrospective that extracts generalizable principles (pearls of wisdom) from the current session and adds them to the collective alignment folder. Use when the user says "harvest", "extract pearls", or at the end of any session that involved iterative problem-solving.
---

# Wisdom Harvest — Pearl Extraction

> Extract general principles from this session. Strip all project details. Write rules that help agents on completely unrelated future work.

## Run It

At the end of a session, the user says "harvest" or "extract pearls." Follow the process below.

> **New workspace?** If `.agent/alignment/pearls.md` does not exist, create it first using the template in the First-Time Setup section at the bottom of this document.

## The Harvest Process

1. **Find the harvest boundary** — Check if a previous harvest already occurred in this session. If yes, only scan the work done AFTER the last harvest (look for the most recent harvest summary table in the conversation). If no previous harvest exists, scan the entire session.
2. **Extract candidates** — Identify moments where a general principle was learned (not project-specific outcomes)
3. **Generalize** — Strip project names, client names, filenames. Rewrite as a universal one-sentence rule
4. **Quality gate** — Run EVERY candidate through the 3-Gate Test below. Discard any that fail.
5. **Dedup check** — Read `.agent/alignment/pearls.md` and check if a similar pearl already exists
6. **Write or promote** — If new, add as a Seed row in the appropriate category table. If similar exists, promote its maturity level (Seed -> Confirmed -> Established)
7. **Aging audit** — Scan all existing Seed-maturity pearls. If any Seed's Added date is more than 90 days old, flag it in the summary as "Needs review — still valid?" Do not delete, only flag.
8. **Present summary** — Show the user a table of what was harvested: action (NEW/PROMOTED/FLAGGED/DISCARDED), pearl title, category, and which gates rocks failed
9. **Pre-commit check** — Run `git status` inside the alignment folder. If there are no changes, warn the user that another agent may have already harvested this session. Do NOT commit or push if there is nothing new.
10. **Git sync** — Stage, commit, and push the alignment folder. If `.agent/alignment/` is a separate git repo, commit and push inside it. Otherwise, commit and push the project repo.

---

## The Pearl Quality Gate

A pearl is NOT just a useful fact. It is a **principle that changes behavior** — something that, had you known it beforehand, would have prevented real lost time.

**Every candidate must pass ALL THREE gates. If it fails any one, discard it.**

| Gate | Question | Fail = Rock |
|------|----------|-------------|
| **Non-obvious** | Would a competent agent get this wrong by default? | If any reasonable agent would already know this, it's a lookup, not wisdom |
| **Pain-tested** | Did violating this cause real debugging time, not just a quick retry? | If the fix took < 30 seconds, it's trivia |
| **Transferable** | Does this principle apply to 3+ fundamentally different types of work? | If it only helps one narrow domain, it belongs in a skill, not in pearls |

### Pearls vs Rocks — learn the difference

| Pearl (passes all 3 gates) | Rock (fails at least 1) | Which gate fails? |
|---------------------------|------------------------|-------------------|
| "Extract data before triggering state changes" | "PowerShell uses semicolons not &&" | Non-obvious: any developer can look this up |
| "Set a numeric satisfaction threshold to converge" | "git pull doesn't delete untracked files" | Pain-tested: no real debugging time lost |
| "Design shared files as append-only for merge safety" | "Use CDP for PDF instead of pdfkit" | Transferable: only applies to PDF generation |

**The litmus test:** If you could find it on Stack Overflow in 10 seconds, it's a rock. If it's a principle you wish someone had told you before you wasted an hour, it's a pearl.

---

## Pearl Format

Pearls live in a **table per category** inside `pearls.md`:

```markdown
## [Category Name]

| Pearl | Rule | Maturity | Added |
|-------|------|----------|-------|
| [short title] | [one-sentence actionable rule] | Seed/Confirmed/Established | [date] |
```

### Hard constraints

- **Rule must be one sentence.** If you can't say it in one sentence, it's two pearls.
- **No project names, client names, or specific filenames** in the Rule or title.
- **The rule must be actionable.** "Be careful with X" is not actionable. "Use X instead of Y" or "Do X before Y" is.

---

## Maturity Model

| Level | Criteria | Agent should... |
|-------|----------|-----------------|
| **Seed** | First observation, passed 3-gate test | Consider it |
| **Confirmed** | Seen independently in 2+ sessions | Follow it |
| **Established** | 3+ sessions or ratified by human | Treat as law |

If a similar pearl already exists, **promote its maturity** instead of adding a duplicate. Change its maturity level in the existing row.

---

## Category Guide

Add pearls to existing categories when possible. Create new categories only when no existing one fits.

Starter categories (expand as needed):
- **Browser Automation** — Selenium, DOM, scraping, headless Chrome
- **API Integration** — HTTP calls, authentication, webhooks, email APIs
- **Multi-Model Dispatch** — Agent orchestration, model selection, dispatch patterns
- **Windows Compatibility** — Encoding, paths, subprocess, OS-specific issues
- **Iterative Refinement** — Self-critique, convergence, documentation maintenance
- **General Engineering** — Architecture, dependencies, data formats, testing

---

## Critical Rules

- **Run the 3-gate test on EVERY candidate** — this is step 4, not optional.
- **Never add project-specific details** — strip everything. The pearl must be universal.
- **One sentence per rule** — if it needs two sentences, it's two pearls.
- **Check for duplicates FIRST** — read the entire `pearls.md` before adding anything.
- **Promote, don't duplicate** — if a similar pearl exists at a lower maturity, upgrade it.

---

## Error Table

| Error | Cause | Fix |
|-------|-------|-----|
| Rock slipped through | Skipped the 3-gate test or applied it loosely | Re-check: Non-obvious? Pain-tested? Transferable? Remove if it fails any |
| Duplicate pearl added | Didn't read existing pearls first | Always read full `pearls.md` before step 6 |
| Pearl too specific | Contains project names/filenames | Strip all specifics, rewrite as universal principle |
| Pearl too vague | "Be careful with code" | Must be actionable — "Use X instead of Y" or "Do X before Y" |
| Git push fails | No upstream configured | Run `git push --set-upstream origin main` first |
| Nothing to commit | Another agent already harvested the same session | Warn the user and skip git sync |

## Success Criteria

- [OK] Every candidate was tested against ALL THREE quality gates
- [OK] Only pearls that passed all 3 gates were added
- [OK] New pearl(s) added to correct category table
- [OK] No project-specific details in any pearl
- [OK] No duplicates — existing similar pearls were promoted instead
- [OK] Aging audit completed — Seed pearls older than 90 days flagged if any
- [OK] Pre-commit check confirmed changes exist before pushing
- [OK] Changes committed and pushed

---

## First-Time Setup

If `.agent/alignment/pearls.md` does not exist in your workspace, create it with this content:

```markdown
# Organizational Pearls of Wisdom

> General principles extracted from real work sessions. These apply to ALL future work regardless of project.
> Maintained by the `wisdom-harvest` skill (see `.agent/skills/wisdom-harvest/SKILL.md`).
```

Then add category headers as pearls are discovered. See the Category Guide above for starter categories.
