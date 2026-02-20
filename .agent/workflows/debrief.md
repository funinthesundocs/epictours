---
description: Instructs the agent to execute the Reactive Master Debrief Protocol.
---

1. [HARVEST] Run the Wisdom Harvest skill
   - Read `.agent/skills/wisdom-harvest/SKILL.md` and execute it in full.
   - Extract general principles from this session, run 3-gate test, add survivors to `.agent/alignment/pearls.md`.

2. [ANALYSIS] Assess project state
   - Read `docs/PROJECT_STATUS.md`
   - Identify what was accomplished this session and what the next step is.

3. [PROPOSAL] Formulate update plan
   - Draft specific updates for Project Status.
   - Identify any new EpicTours-specific patterns for `CODING_PATTERNS.md` or `ANTI_PATTERNS.md`.
   - **CRITICAL**: Do NOT update the files yet.
   - Create a summary of proposed changes.

4. [ALIGNMENT] Request Authorization
   - Present the "Debrief Proposal" to the user via `notify_user`.
   - Ask: "Does this plan align with your view of our progress? Say PROCEED to execute."

5. [EXECUTION] (Wait for User "PROCEED")
   - Update `docs/PROJECT_STATUS.md`
   - Append new EpicTours patterns to `docs/CODING_PATTERNS.md` or `docs/ANTI_PATTERNS.md` (if applicable)

