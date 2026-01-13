# Protocol: Restore Safety Systems
> **Usage**: Paste the prompt below into the chat when you are ready to stabilize the codebase and re-enable strict quality gates.

---

## 🛡️ The "Shields Up" Prompt

```text
🛑 STOP. INITIALIZING SAFETY RESTORATION. 🛑

I am directing you to re-enable our "Gatekeeping Protocols" for the production build. We are moving from "Rapid Prototyping" to "Stability Mode".

Action Required:
1. Open `next.config.ts` (or `.js`).
2. REMOVE the configuration blocks that ignore builds errors.
3. specifically, remove:
   - `typescript: { ignoreBuildErrors: true }`
   - `eslint: { ignoreDuringBuilds: true }`
4. Verify the file is clean and ready for strict validation.

Once complete, run a test build (`npm run build`) to see what breaks. Report the results.
```
