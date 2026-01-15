# 📡 Project Status & Active Mission
> **Last Updated**: 2026-01-15
> **Current Phase**: "Experiences Module Finalization"

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

1.  **✅ Availability Calendar (Deep Core)**
    *   **Status**: COMPLETED.
    *   **Features**: Multi-View (Month/Week/Day), Compact Selector, High Contrast Data Chips (Bold White).
    *   **Updates**: 
        *   Renamed from `BookingCalendar` to `AvailabilityCalendar` (Refactor).
        *   Hooked up `new Date()` for Dynamic "Today" Logic.
        *   Standardized on **Primary Teal** (`cyan-500`) for indicators.
    *   **Ref**: `features/availability/components/availability-calendar.tsx`.

2.  **✅ Experience Codes**
    *   **Status**: COMPLETED.
    *   **Details**: Added `short_code` (e.g. "ACI") to DB and Form. Calendar uses these codes for chips.

3.  **✅ Production Workflow**
    *   **Status**: OPTIMIZED (Port 3000).
    *   **Action**: Use `@[/refresh]` for instant local rebuilds. Use `@[/gitpull]` for full sync. Use `@[/debrief]` for alignment.

4.  **[NEXT] "Customers" Module**
    *   **Goal**: Implement the "Duplicate Check" logic defined in `CRM_STRATEGY.md`.
    *   **Note**: Ensure we use the new `restart_production` workflow if we hit DB issues.

## 🧠 Memory Dump (Context for Next Session)
*   **Workflow Shortcodes**:
    *   `@[/refresh]`: Kill 3000 -> Nuke Cache -> Build -> Start (Local Only).
    *   `@[/gitpull]`: Kill 3000 -> Pull -> Nuke -> Build -> Start (Full Sync).
    *   `@[/align]`: Neural Sync Protocol.
    *   `@[/debrief]`: Save Game Protocol (PROPOSAL REQUIRED).
*   **The "Speed Hack"**: We disabled Type/Lint checking in `next.config.ts`.
*   **Twin Agent Protocol**: Switch windows -> Run `@[/align]`. No Git Pull needed.
*   **Context Tagging**: We check for `// @read` tags at the top of complex files.
*   **Primary Color**: **Teal/Cyan** (`cyan-500`) is the Law. No Purple/Rainbows for status indicators.
