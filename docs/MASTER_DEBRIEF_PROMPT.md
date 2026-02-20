# Master Debrief Prompt
> **For agents**: Use the `/debrief` workflow instead — it calls wisdom-harvest directly.
> **For humans**: Paste this at the END of a session if no agent is available.

```text
SESSION COMPLETE.

Run the **Wisdom Harvest** skill as defined in `.agent/skills/wisdom-harvest/SKILL.md`.

1. **Extract** general principles from this session using the 3-Gate test (Non-obvious, Pain-tested, Transferable).
2. **Add survivors** to `.agent/alignment/pearls.md`. Discard rocks. Promote existing pearls if confirmed again.
3. **Cap check**: Count total pearl rows. If count exceeds 111, evict the oldest Seed-maturity pearl.
4. **Aging audit**: Flag any Seed pearls older than 90 days as "Needs review".
5. **Update** `docs/PROJECT_STATUS.md` with a crystal clear "Next Step" for the next agent.
6. **Append** any new EpicTours-specific UI patterns or anti-patterns to `docs/CODING_PATTERNS.md` or `docs/ANTI_PATTERNS.md` (project-specific, NOT pearls.md).
7. **Report** exactly what was added, promoted, evicted, or flagged in each document.
```

