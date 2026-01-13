---
description: Restarts the production server with the "Nuclear Clean" strategy to prevent DLL locks.
---

1. Pre-emptive Kill + Nuclear Clean + Build + Start (Local Refresh Only)
// turbo-all
2. Execute Optimized Restart Sequence
```bash
cmd /c "npx kill-port 3000 && rmdir /s /q .next && npm run build && npm run start -- -p 3000"
```
