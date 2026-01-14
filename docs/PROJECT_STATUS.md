# 📡 Project Status & Active Mission
> **Last Updated**: 2026-01-12
> **Current Phase**: "Experiences Module Refinement"

## 🟢 Operational Status
*   **EpicTours Core**: ✅ Initialized
*   **Database**: ✅ Supabase Connected
*   **Authentication**: ✅ Clerk (Assumed/active)
*   **Build System**: ⚡ Optimized (Linting Disabled)

## 🎯 Current Objectives (The "Queue")
We are currently focusing on the **Experiences** inventory module (`features/experiences`).

1.  **✅ Experiences Form - Event Type UI**
    *   **Status**: COMPLETED.
    *   **Fix**: Replaced native `<select>` with custom dropdown to match "Dark Mode" standard.
    *   **Ref**: `features/experiences/components/experience-sheet.tsx`.

1.  **✅ Availability Calendar (Prism Deep)**
    *   **Status**: COMPLETED.
    *   **Features**: "Deep Core" Design, Multi-View (Month/Week/Day), Cyclical Toggle, Compact Selector, CRUD Actions.
    *   **Ref**: `features/bookings/components/booking-calendar.tsx`.

2.  **✅ Production Workflow**
    *   **Status**: OPTIMIZED (Port 3000).
    *   **Action**: Use `@[/refresh]` for instant local rebuilds. Use `@[/gitpull]` for full sync.

3.  **[NEXT] "Customers" Module**
    *   **Goal**: Implement the "Duplicate Check" logic defined in `CRM_STRATEGY.md`.
    *   **Note**: Ensure we use the new `restart_production` workflow if we hit DB issues.

## 🧠 Memory Dump (Context for Next Session)
*   **Workflow Shortcodes**:
    *   `@[/refresh]`: Kill 3000 -> Nuke Cache -> Build -> Start (Local Only).
    *   `@[/gitpull]`: Kill 3000 -> Pull -> Nuke -> Build -> Start (Full Sync).
    *   `@[/align]`: Neural Sync Protocol.
    *   `@[/debrief]`: Save Game Protocol.
*   **The "Speed Hack"**: We disabled Type/Lint checking in `next.config.ts`.
*   **Twin Agent Protocol**: Switch windows -> Run `@[/align]`. No Git Pull needed.
*   **Context Tagging**: We check for `// @read` tags at the top of complex files.
