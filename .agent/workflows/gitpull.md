---
description: Pulls changes from GitHub and performs a nuclear clean build (Twin Agent Protocol - Full Sync).
---

1. Execute Full Sync Sequence (Kill -> Pull -> Nuke -> Build -> Start)
// turbo-all
2. Sync and Restart
```bash
cmd /c "npx kill-port 3000 && git pull && rmdir /s /q .next && npm run build && npm run start -- -p 3000"
```
