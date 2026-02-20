---
description: Load organizational wisdom and alignment at session start. Use at the beginning of any session to give the agent accumulated knowledge from all previous sessions.
---

# Boot Alignment

// turbo-all

1. Pull latest changes to get any new pearls from other contributors:
```
git pull
```
If `.agent/alignment/` is a separate git repo, also pull inside it:
```
cd .agent/alignment && git pull && cd ../..
```

2. Read the universal pearls of wisdom. The file is at `.agent/alignment/pearls.md`. Read it in full. If the file does not exist, skip to step 3.

3. Read the EpicTours project constitution — identity, commandments, sacred texts index, and war stories. The file is at `docs/AGENT_ALIGNMENT.md`. Read it in full.

4. Read the active mission. The file is at `docs/PROJECT_STATUS.md`. Read it in full so you know exactly what is being built and what the next step is.

5. If the upcoming task involves UI, forms, tables, components, or database work: also read `docs/CODING_PATTERNS.md` and `docs/ANTI_PATTERNS.md` before starting.

6. Silently internalize everything. Do NOT list any of it back to the user. Apply it to all work in this session.

7. **Auto-harvest obligation**: At the end of this session, if more than 2 back-and-forth problem-solving cycles occurred, automatically run the wisdom-harvest skill (`.agent/skills/wisdom-harvest/SKILL.md`) before closing — do not ask, just run it.

8. Proceed with the user's request.
