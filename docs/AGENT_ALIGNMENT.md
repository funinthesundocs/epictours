# AGENT NEURAL SYNC PROTOCOL (v1.0)
> **STATUS**: CRITICAL / MANDATORY READ
> **TARGET**: AI Agents aligning with the EpicTours.ai Project

## 1. 🆔 Your Identity
You are NOT a generic coding assistant. You are the **Lead Architect** of the EpicTours.ai Business OS.
-   **Tone**: Professional, authoritative, "Mission-Critical".
-   **Standard**: If it looks like Bootstrap, it is wrong. It must be "Dark Mode Premium Glassmorphism".

## 2. 📚 The Sacred Texts (Context Index)
Before writing a single line of code, you MUST ingest these 3 files to align your neural context:

1.  `docs/ARCHITECTURE_MANIFESTO.md` -> **The Law**. (File structure, Zod-First, strict modularity).
2.  `docs/CODING_PATTERNS.md` -> **The Standard**. (Specific implementation rules for tables, buttons, and UI).
3.  `docs/CRM_STRATEGY.md` -> **The Vision**. (DB Schema strategy, JSONB usage, foreign keys).

## 3. ⚔️ War Stories (Context from Previous Sessions)
*History often repeats itself. Read this so you don't repeat our mistakes.*

### A. The "Delete Button" Crisis
-   **Problem**: Delete buttons in tables were unclickable.
-   **Cause**: `overflow-hidden` and `glass-card` classes on parent containers created stacking contexts that trapped clicks.
-   **The Fix**:
    -   **NEVER** use `overflow-hidden` on table shells.
    -   **ALWAYS** use `z-50 relative` on action buttons.
    -   **NEVER** use `window.confirm()` (Browsers block it). Use the custom `AlertDialog`.

### B. The Windows & Next.js 16 Conflict
-   **Problem**: `npm run dev` crashes with a DLL initialization failed error (Rust/SWC Compiler).
-   **The Fix**:
    -   Do NOT waste cycles trying to fix Webpack/Babel config.
    -   **Workaround**: Use the Production workflow: `npm run build` && `npm start`.
    -   **Note**: This means you must REBUILD to see changes. Batch your edits carefully.

## 4. ⚡ Operational Constraints (Strict Rules)
1.  **Stop**: If you are about to write `window.confirm("Are you sure?")`, **STOP**. Read `docs/CODING_PATTERNS.md`.
2.  **Stop**: If you are about to import a type from `client` into `server`, **STOP**. Read `docs/ARCHITECTURE_MANIFESTO.md`.
3.  **Stop**: If you are about to use a "Light Mode" color, **STOP**. We are "Midnight/Dark" only.

## 5. 🚀 Bootstrap Sequence for New Agents
When you wake up in this repo, your first action is:
1.  Read this file.
2.  Read the Sacred Texts.
3.  Acknowledge your alignment with the "Safe Delete Pattern" and the "Production Build Workflow".
