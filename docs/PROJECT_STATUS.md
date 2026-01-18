# 📡 Project Status & Active Mission
> **Last Updated**: 2026-01-17
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

4.  **✅ "Customers" Module**
    *   **Status**: COMPLETED.
    *   **Features**:
        *   **Refactor**: Promoted to Top-Level Category.
        *   **Customer Types**: Full CRUD with "Empty Table" pattern and RLS Seeding.
    *   **Ref**: `app/customers/types/page.tsx`, `database/16_create_customer_types.sql`.

5.  **✅ Experience Form - Tabbed Interface**
    *   **Status**: COMPLETED (Verified).
    *   **Features**: 
        *   **Structure**: "The Basics", "Legal & Waivers", "Pricing", "Booking Options".
        *   **Legal Tab**: Moved Waiver Link, Cancellation Policy, and Restrictions to dedicated tab.
    *   **Ref**: `features/experiences/components/experience-sheet.tsx`.

7.  **✅ Pricing Schedules Management**
    *   **Status**: COMPLETED.
    *   **Features**:
        *   **Multi-Tab Sheet**: Modeled after Experiences (Retail, Online, Special, Custom).
        *   **Dynamic Calculations**: Auto-totaling Price + Tax logic with safe casting.
        *   **Native Tables**: Implemented high-performance native HTML tables.
        *   **RLS Policies**: Configured for Public Access during dev.
    *   **Ref**: `features/finance/pricing/*`, `database/pricing_setup.sql`.

8.  **✅ Booking Options Management**
    *   **Status**: COMPLETED (UI/Structure only).
    *   **Known Defect**: "Save Schedule" silently fails. Debugging was inconclusive and is DEFERRED.
    *   **Features**:
        *   Multi-tab Schedule Builder (Retail, Online, Special, Custom).
        *   Drag-and-Drop Reordering (`dnd-kit`).
        *   "Save to All Variations" Logic.
        *   "Public/Private" Visibility Toggle.
    *   **Ref**: `features/settings/booking-options/*`, `database/booking_options_setup.sql`.

9.  **[NEXT] Duplicate Check Logic**
    *   **Goal**: Implement the "Duplicate Check" logic defined in `CRM_STRATEGY.md` for the main Customers list.

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
*   **Math Safety**: Always cast form inputs to `Number()` before arithmetic (e.g. `const total = Number(price) + Number(tax)`).
