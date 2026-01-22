---
description: Restarts the production server with the "Smart Refresh" strategy (Fast Incremental Build).
---

1. Kill Port + Incremental Build (Ignore Warnings) + Start
// turbo-all
2. Refresh Local Server
```bash
cmd /c "npx kill-port 3000 && (npm run build || echo Build finished with possible warnings) && npm run start -- -p 3000"
```
