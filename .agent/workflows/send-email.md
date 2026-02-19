---
description: Send an email via the AgentMail API using the visupport@agentmail.to inbox
---

# Send Email

Use the `agentmail` skill. Full instructions, OS-specific commands, error table, and HTML support are documented there.

Skill location: `.agent/skills/agentmail/SKILL.md`

## Quick Reference (Windows PowerShell)

```powershell
Invoke-RestMethod -Method POST `
  -Uri "https://api.agentmail.to/inboxes/visupport@agentmail.to/messages/send" `
  -Headers @{
    "Authorization" = "Bearer am_us_e8dbc7465f1b28cdb6e63866abdf44b4245a8a834b40556aee8de931cbc7e24e"
    "Content-Type"  = "application/json"
  } `
  -Body '{"to": "RECIPIENT@EMAIL.COM", "subject": "SUBJECT", "text": "BODY"}'
```

> Do NOT use `curl` on Windows — it aliases to `Invoke-WebRequest` and will fail with a header binding error.
