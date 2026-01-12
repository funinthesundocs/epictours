# 📡 Project Status & Active Mission
> **Last Updated**: 2026-01-12
> **Current Phase**: "Experiences Module Refinement"

## 🟢 Operational Status
*   **EpicTours Core**: ✅ Initialized
*   **Database**: ✅ Supabase Connected
*   **Authentication**: ✅ Clerk (Assumed/active)

## 🎯 Current Objectives (The "Queue")
We are currently focusing on the **Experiences** inventory module (`features/experiences`).

1.  **✅ Experiences Form - Save Functionality**
    *   **Status**: FIXED.
    *   **Fix**: Relaxed Zod schema, sanitized `null`s, added Transformers.
    *   **Verification**: Form saves correctly. Buttons show loading state.

2.  **✅ Experiences Form - UI Refinement**
    *   **Status**: FIXED.
    *   **Changes**: "Dark Mode" Custom Time Picker (removed `<datalist>`), Slogan Auto-Capitalization.

3.  **[NEXT] Strictness Verification**
    *   **Goal**: Slowly re-introduce stricter Zod validation for fields that *should* be required, to ensure data quality without breaking the save.
    *   **Note**: All new fields must handle `null` -> `""` transformation.
    
4.  **[PENDING] "Customers" Module**
    *   **Goal**: Implement the "Duplicate Check" logic defined in `CRM_STRATEGY.md`.

## 🧠 Memory Dump (Context for Next Session)
*   **The "Port 3001" Issue**: We have automated the port killing in `package.json` with `kill-port`. You shouldn't see "EADDRINUSE" anymore.
*   **The "Sheet" Component**: `ExperienceSheet` is now using a "Transformer Pattern" in `onSubmit`. Do not revert to inline logic.
*   **Seed Parity**: If you change the Schema, you MUST update `14_seed_experiences.sql`.
*   **Context Tagging**: We check for `// @read` tags at the top of complex files.
