---
description: Restarts the production server with the correct specific port constraints.
---

1. Kill any existing process on port 3001 and start the production build.
// turbo-all
2. Stop and Restart the Server
```bash
cmd /c "npm run build && npm run start -- -p 3001"
```
