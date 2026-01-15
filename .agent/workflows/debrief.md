---
description: Instructs the agent to execute the Reactive Master Debrief Protocol.
---

1. [ANALYSIS] Read Documents
   - Read `docs/MASTER_DEBRIEF_PROMPT.md`
   - Read `docs/PROJECT_STATUS.md`
   - Read `task.md`

2. [PROPOSAL] Formulate Debrief Plan
   - Synthesize the session's achievements.
   - Draft specific updates for Project Status and Patterns.
   - **CRITICAL**: Do NOT update the files yet.
   - Create a summary of these proposed changes.

3. [ALIGNMENT] Request Authorization
   - Present the "Debrief Proposal" to the user via `notify_user`.
   - Ask: "Does this plan align with your view of our progress? Say PROCEED to execute."

4. [EXECUTION] (Wait for User "PROCEED")
   - Update `docs/PROJECT_STATUS.md`
   - Update `docs/CODING_PATTERNS.md` (if applicable)
   - Clear/Archive `task.md` (if applicable)
