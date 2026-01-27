---
description: Pulls changes from GitHub and restarts the dev server.
---

1. Pull and Restart Dev Server
// turbo-all
2. Sync and Restart
```bash
cmd /c "npx kill-port 3000 && git pull && npm install && npm run dev"
```

> **CRITICAL**: After this command completes, you must **STOP**. Do not proceed with any pending tasks. Report the status to the user and await confirmation.
