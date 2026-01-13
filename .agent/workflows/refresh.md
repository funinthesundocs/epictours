---
description: Restarts the production server with the "Nuclear Clean" strategy (Local Refresh Only).
---

1. Pre-emptive Kill + Nuclear Clean + Build + Start
// turbo-all
2. Refresh Local Server
```bash
cmd /c "npx kill-port 3000 && rmdir /s /q .next && npm run build && npm run start -- -p 3000"
```
