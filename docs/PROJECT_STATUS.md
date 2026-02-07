# 📡 Project Status & Active Mission
> **Last Updated**: 2026-02-07
> **Current Phase**: "Master Report & Navigation Polish"

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

9.  **✅ Custom Fields - UI Standardization**
    *   **Status**: COMPLETED.
    *   **Features**:
        *   **Header Filters**: Refactored page-level filters into "Type" column dropdown (`DropdownMenu`).
        *   **Standardization**: Updated scrolling, icons, and action button order to match Customer List.
    *   **Ref**: `features/settings/custom-fields/*`, `components/ui/dropdown-menu.tsx`.

10. **✅ Setup Section Cleanup**
    *   **Status**: COMPLETED.
    *   **Action**: Standardized "Edit" icons (Edit2) and enforced "Edit First" action button rule across all setup tables.


10. **✅ Pricing Variations Module**
    *   **Status**: COMPLETED.
    *   **Features**:
        *   Full CRUD with drag-and-drop priority ordering (`sort_order`).
        *   Dynamic tabs in Pricing Schedules driven by this table.
        *   "Copy to All Variations" checkbox for bulk rate application.
    *   **DB Changes**: Added `sort_order` column, dropped `tier` CHECK constraint.
    *   **Ref**: `features/settings/pricing-variations/*`, `database/pricing_variations_setup.sql`.

11. **✅ Settings Navigation Flattened**
    *   **Status**: COMPLETED.
    *   Removed "Setup" subfolder, all items now direct children of Settings.

12. **✅ Availability Module (List & Create)**
    *   **Status**: COMPLETED.
    *   **Features**:
        *   **Real Data**: Connected to `availabilities`, `staff`, `schedules` tables.
        *   **Context Aware**: "Create" button automatically links new records to the active Experience and Month.
        *   **List View**: Rich columns including computed Staff Names and Route Names.
        *   **Edit Integration**: Full read/write cycle working. List auto-refreshes on save.
        *   **Calendar Polish**: `zinc-950/80` theme, `text-sm` headers, `160px` uniform row height.
        *   **Interactions**: Empty cell click -> Create. Edit Sheet -> Delete workflow.
    *   **Ref**: `features/availability/*`.

13. **✅ Manifest Navigation & Preset Auto-Load**
    *   **Status**: COMPLETED.
    *   **Features**:
        *   Sidebar "Manifest" link navigates to Master Report with `?preset=today`.
        *   `PresetManager` accepts `initialPresetName` prop to auto-select saved preset from Supabase.
        *   Legacy `/booking/manifest` URL redirects to Master Report.
        *   Active sidebar link detection strips query params for correct highlighting.
    *   **Ref**: `config/navigation.ts`, `features/reports/master-report/components/preset-manager.tsx`.

14. **✅ Bookings Calendar Blank Screen Fix**
    *   **Status**: COMPLETED.
    *   **Fix**: `initialView="calendar"` was not a valid view mode. Mapped `"calendar"` → `"month"`.
    *   **Ref**: `features/bookings/components/bookings-calendar.tsx`.

15. **✅ Manifest Button in Calendar Toolbar**
    *   **Status**: COMPLETED.
    *   **Features**: Added FileText icon to main calendar toolbar (before List icon). Navigates to Master Report preset page.
    *   **Ref**: `features/bookings/components/bookings-calendar.tsx`.

16. **[NEXT] Duplicate Check Logic**
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
*   **Component State Ownership**: Always READ the owning component before modifying state from outside. Thread props through the tree, don't bypass.
*   **Server Refresh**: ALWAYS restart the dev server after code changes before asking the user to test.
