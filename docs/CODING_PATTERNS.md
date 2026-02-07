# 💎 Coding Patterns & Standards

## 0. The Prime Directive: Comparative Analysis
*   **Trigger**: When a feature (e.g., Save Button) fails.
*   **Protocol**:
    1.  **Stop**. Do not guess the error.
    2.  **Locate** a parallel feature that works (e.g., Experience Save Button).
    3.  **Read** the working file (using `view_file`) line-by-line.
    4.  **Diff** against your broken file.
    5.  **Copy** the working logic exactly (Logic patterns, Zod schemas, Initialization).

## 0. Design Strategy & Theming (Strict)
*   **Rule**: **NEVER** use hard-coded colors (e.g. `bg-cyan-400`, `text-zinc-500`, `border-white/10`).
*   **Requirement**: All UI components must use **Semantic Tokens** to ensure compatibility with Light/Dark modes and Themes.
*   **Core Tokens**:
    *   **Backgrounds**: `bg-background` (Page), `bg-card` (Containers), `bg-popover` (Dropdowns), `bg-muted` (Secondary).
    *   **Text**: `text-foreground` (Primary), `text-muted-foreground` (Secondary).
    *   **Borders**: `border-border`.
    *   **Primary Actions**: `bg-primary`, `text-primary-foreground`, `border-primary`.
    *   **Destructive**: `bg-destructive`, `text-destructive-foreground`.

## 1. UI Standards

### Save/Update Buttons
*   **Primary Action Buttons** (Create, Save, Update, Add):
    *   **Background**: `bg-primary` (hover: `hover:bg-primary/90`)
    *   **Text**: `text-primary-foreground`
    *   **Shadow**: `shadow-glow` (Theme-aware glow)
    *   **Disabled State**: `opacity-50 cursor-not-allowed`
    *   **Full Class**: `bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-glow transition-all`

### 1.2 Deletion & Confirmation Protocol
*   **Strict Rule**: Never use browser native `window.confirm()`.
*   **Component**: Always use `AlertDialog` (`@/components/ui/alert-dialog`).
*   **Pattern**: Use local state (e.g., `const [deletingItem, setDeletingItem] = useState...`) to control dialog visibility.
*   **Notification**: Upon successful deletion, **ALWAYS** display a toast notification confirming the action.
    *   `toast.success("${itemName} deleted");`
    *   Do NOT just silently remove the item.

### 1.3 UI Action Standards
*   **Tooltips**: Do NOT add `title="..."` tooltips to standard action buttons (Edit, Delete, Duplicate) in tables. They add unnecessary clutter.
*   **Icons**: Use `lucide-react` icons (16px).
*   **Indicators**: Use `text-primary` or `bg-primary` for active states.

### 1.4 Loading States (Strict)
*   **Standard**: ALL page-level and section-level loading states MUST use the `LoadingState` component.
*   **Component**: `@/components/ui/loading-state`
*   **Features**:
    *   Primary-colored spinner with blur glow effect
    *   Size variants: `sm`, `md` (default), `lg`
    *   Optional message text
*   **Usage**:
    ```tsx
    import { LoadingState } from "@/components/ui/loading-state";
    
    // Page loading
    if (isLoading) {
        return <LoadingState message="Loading customers..." />;
    }
    
    // Inline/smaller loading
    <LoadingState size="sm" />
    ```
*   **DO NOT USE**:
    *   Inline `Loader2` with `animate-spin` for page/section loading
    *   Custom border-based spinners (e.g., `border-2 border-primary/30 border-t-primary rounded-full animate-spin`)
*   **Exception — Theme Toggle Loading Overlay**:
    *   Located in `sidebar.tsx` for light/dark mode switching
    *   Uses full-screen overlay with larger glow effect and transition text
    *   Do NOT use `LoadingState` for this specific case — reference the existing implementation in `sidebar.tsx`
*   **Button Loading States**:
    *   For save/submit button spinners (e.g., "Saving..."), inline `Loader2` is acceptable
    *   These are action feedback, not page loading states

### 1.5 Progressive Loading (Tables & Calendars)
*   **Principle**: Shell renders first → container visible → loading spinner centered → data loads
*   **Structure**:
    1. Page header/toolbar render immediately (no loading check)
    2. Table/calendar container (`rounded-xl border bg-card`) always visible
    3. `LoadingState` renders INSIDE the container when loading
    4. Data replaces loading state when ready
*   **Pattern**:
    ```tsx
    // Header and toolbar render immediately - NO loading check here
    <Header />
    <Toolbar />
    
    // Container always renders, loading inside
    {error ? (
        <ErrorState />
    ) : (
        <div className="flex-1 ... rounded-xl border border-border bg-card">
            {isLoading && data.length === 0 ? (
                <LoadingState message="Loading..." />
            ) : (
                <div className={cn("h-full", isLoading && "opacity-50")}>
                    <Table data={data} />
                </div>
            )}
        </div>
    )}
    ```
*   **Benefits**: Users see the full page layout immediately, understanding the structure before data arrives


## 2. UI Components (Deep Core)
*   **SidePanel / Sheet Layouts**:
    *   **Standard Structure (Glass Pattern)**:
        *   **Content**: `p-0 overflow-hidden flex flex-col`.
        *   **Form**: `h-full flex flex-col`.
        *   **Scroll Area**: Wrap content in `<div className="flex-1 overflow-y-auto p-6 ...">`.
    *   **Footer Rules**:
        *   **Position**: Sticky at bottom (`mt-auto`).
        *   **Style**: `bg-background/80 backdrop-blur-md` with `border-t border-border`.
        *   **Buttons**: Primary Action Button must use `bg-primary` and `text-primary-foreground`.
    *   **Snippet**:
        ```tsx
        <SidePanel contentClassName="p-0 overflow-hidden flex flex-col" ...>
            <form className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24 space-y-6">
                    {/* Content */}
                </div>
                <div className="shrink-0 flex justify-end items-center gap-4 py-4 px-6 border-t border-border mt-auto bg-background/80 backdrop-blur-md">
                    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-glow">Save</Button>
                </div>
            </form>
        </SidePanel>
        ```
*   **Tables**:
    *   **Headers**: Always visible.
    *   **Actions**: Align right.
    *   **Responsive**: Add `hidden md:table` to desktop table and `md:hidden` to mobile card view.
    *   **Canonical Reference**: **ALL new tables MUST be modeled exactly after `features/crm/customers/components/customer-table.tsx`**. This includes:
        *   Desktop table structure and styling
        *   Mobile card view implementation
        *   Action button placement and hover effects
        *   Mobile card view implementation
        *   Action button placement and hover effects
        *   Header styling (`bg-muted/50 backdrop-blur-sm`)
        *   Row hover states and transitions

### 2.2 Mobile Viewport Height (dvh Standard)
*   **Rule**: ALL page containers with viewport-based heights MUST use `dvh` (Dynamic Viewport Height) instead of `vh`.
*   **Reason**: On mobile browsers, `100vh` includes the address bar area, causing content to be cut off until the user scrolls to hide the address bar. `dvh` automatically adjusts to the actual visible viewport.
*   **Pattern**:
    ```tsx
    // ❌ WRONG - causes content cutoff on mobile
    className="h-[calc(100vh-2rem)] lg:h-[calc(100vh-4rem)]"
    
    // ✅ CORRECT - adapts to mobile browser chrome
    className="h-[calc(100dvh-2rem)] lg:h-[calc(100dvh-4rem)]"
    ```
*   **Applies To**: All data list pages, calendar views, and any full-height scrollable containers.
*   **Reference**: `features/crm/customers/page.tsx`

### 2.1 Mobile Card View Pattern (Data Tables)
*   **Standard**: ALL data tables MUST have a mobile card view alternative.
*   **Trigger**: Use `hidden md:table` on the desktop `<table>` element and `md:hidden` on the mobile card container.
*   **Card Container**: `<div className="md:hidden space-y-4 p-4">`
*   **Card Styling**:
    ```css
    bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm
    ```
*   **Card Structure**:
    1.  **Header Section**: Name/Title + Action Buttons (flex, justify-between)
        *   Icon in circle: `w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary`
        *   Name: `text-lg font-bold text-foreground leading-tight`
        *   Separator: `border-b border-border pb-3`
    2.  **Body Section**: Two-column grid for details
        *   Container: `grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-base`
        *   Labels: `text-muted-foreground`
        *   Values: `text-foreground`
*   **Action Buttons**:
    *   **Container**: `flex items-center gap-1 shrink-0`
    *   **Edit**: `p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors`
    *   **Delete**: `p-2 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors`
*   **Reference Implementation**: `features/crm/customers/components/customer-table.tsx`
*   **Template**:
    ```tsx
    {/* Desktop Table */}
    <table className="w-full text-left hidden md:table">
        {/* ... thead and tbody ... */}
    </table>

    {/* Mobile Card View */}
    <div className="md:hidden space-y-4 p-4">
        {data.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
                {/* Header: Name + Actions */}
                <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Icon size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-foreground leading-tight">{item.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => onEdit(item)} className="p-2 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={() => setDeleteId(item.id)} className="p-2 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Body: Two Columns */}
                <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-base">
                    <div className="text-muted-foreground">Label</div>
                    <div className="text-foreground">{item.value}</div>
                </div>
            </div>
        ))}
    </div>
    ```

## 2. Database & RLS
*   **Local Development**:
    *   **Seeding**: When seeding data from scripts, use `ON CONFLICT` to prevent duplicates.
    *   **RLS**: If `anon` access is blocked during dev, temporarily allow `public` access using a specific policy:
        ```sql
        CREATE POLICY "Allow public access" ON table_name FOR ALL USING (true) WITH CHECK (true);
        ```

### 2.2 Database Indexing Standards
*   **Rule**: ALL new tables MUST include indexes in the same migration file.
*   **Required Indexes**:
    1.  **Foreign Keys** — Index ALL foreign key columns (e.g., `customer_id`, `experience_id`)
    2.  **Frequently Filtered Columns** — `status`, `type`, `is_active`, etc.
    3.  **Frequently Sorted Columns** — `created_at DESC`, `name`, `start_time`
    4.  **Search Columns** — `name`, `email`, `title`
*   **Composite Indexes**: For common multi-column queries (e.g., `WHERE experience_id = X ORDER BY start_time`)
*   **Syntax**: Always use `IF NOT EXISTS` to make migrations re-runnable:
    ```sql
    CREATE INDEX IF NOT EXISTS idx_tablename_column ON tablename(column);
    ```
*   **Template**:
    ```sql
    -- Create table
    CREATE TABLE IF NOT EXISTS public.new_feature (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id UUID REFERENCES parent_table(id),
        status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Add indexes (in same migration file)
    CREATE INDEX IF NOT EXISTS idx_new_feature_parent_id ON new_feature(parent_id);
    CREATE INDEX IF NOT EXISTS idx_new_feature_status ON new_feature(status);
    CREATE INDEX IF NOT EXISTS idx_new_feature_created_at ON new_feature(created_at DESC);
    ```
*   **When to Add Later**: If queries become slow, use `EXPLAIN ANALYZE` to identify missing indexes.

## 3. Logic & State
*   **Math Safety**:
    *   **Inputs**: Always explicitly cast form inputs to `Number()` before performing arithmetic, especially in `useFieldArray` loops or calculated columns.
    *   `const total = Number(price) + Number(tax);`

## 4. Navigation
*   **Structure**: Group related items into Categories (Collapsible or Headings).
*   **Icons**: Consistent usage across sidebar and pages.

## 5. Known Benign Warnings
*   **GoTrueClient**: "Multiple GoTrueClient instances detected" in the console is a known benign warning in this dev environment and can be ignored.

## 6. Testing Protocol
*   **Skip Automated Browser Testing**: The browser subagent is thorough but SLOW.
*   **Preferred Flow**: Build → Start Server → Ask user to manually test → Get feedback.
*   **When to use browser**: Only for demo recordings or walkthroughs when user explicitly requests.

## 7. Dynamic Database Fields
*   **Avoid CHECK constraints** on fields that may become dynamic (e.g., `tier`, `status`, `type`).
*   **Pattern**: Use `TEXT NOT NULL` instead of `TEXT CHECK (IN ('A', 'B', 'C'))`.
*   **Migration**: If constraint exists, drop with `ALTER TABLE x DROP CONSTRAINT constraint_name;`

## 8. Custom Date & Time Pickers
*   **Standard**: Do NOT use browser native inputs (`<input type="date">`). Use the custom components.
*   **Components**:
    *   `DatePicker`: `@/components/ui/date-picker`
    *   `TimePicker`: `@/components/ui/time-picker`
*   **Calendar Styling (v9 Standard)**:
    *   **Header**: Use stylized Dropdowns for Month and Year selection (aligned left).
    *   **Navigation**: Hide default `< >` arrows.
    *   **Close Button**: Include an 'X' button in the upper right.
    *   **Sizing**: Day headers `text-sm`, Dates `text-base`.
*   **TimePicker Styling**:
    *   **Structure**: 3-Column Layout (Hour, Min, AM/PM).
    *   **Logic**: 12-hour display, 5-minute increments (00-55).
    *   **Styling**: Rounded corners on items and headers. Floating headers. Close button in 3rd column header (right-aligned).
*   **Usage**:
    ```tsx
    import { DatePicker } from "@/components/ui/date-picker"
    <DatePicker value={date} onChange={setDate} />
    ```

## 9. Calendar UI Rules
*   **Uniform Row Heights**: All calendar rows must have a `min-height` that accommodates at least one data chip (e.g. `160px`) to prevent layout jumping between empty and filled rows. Rows with >1 item may expand naturally.
*   **Dynamic Grid**: Always calculate precise row counts (`Math.ceil((first + days) / 7) * 7`) to prevent extra empty rows at the bottom.
*   **Strict Colors**: Calendar inactive days/headers must strictly match the design token (e.g. `text-muted-foreground`), even if it requires `!important` or specific class overrides.
*   **Popup Calendar Selection Style**:
    *   **Context**: For small popup calendars (e.g. Booking Modal).
    *   **Rule**: Selected date must use **Border Only** styling. NO background color ("glow") and NO shadow.
    *   **Implementation**: Override the `selected` class key.
    *   **Class**: `border-2 border-primary text-primary bg-transparent hover:text-primary focus:text-primary shadow-none font-bold`

## 10. Custom Select Pattern (Combobox Standard)
*   **Standard**: Use the Combobox pattern for all "Select" inputs.
*   **Component**: `@/components/ui/combobox`
*   **Core Requirements**:
    1.  **Always Searchable**: The trigger must be an input field that filters the dropdown options. Do NOT use static triggers.
    2.  **Dropdown Style**:
        *   Background: `bg-popover`
        *   Border: `border-border`
        *   Behavior: Popover / Floating
    3.  **Required Logic**:
        *   **Toggle**: Use "Required" (Default: False).
        *   **None Option**: If `required` is FALSE, a "None / Empty" option must be available at the top of the list (even if default is set).
        *   **None Icon**: Select "None" displays a `Ban` icon (`Ø`).
        *   **Indicator**: Required fields show a red dot (`•`) to the right of the label.
*   **Usage Pattern**:
    ```tsx
    import { Combobox } from "@/components/ui/combobox";
    
    // ... inside component
    <Combobox
        value={watch("field_id")}
        onChange={(val) => setValue("field_id", val)}
        options={options}
        placeholder="Search or select..."
        inputClassName="bg-input ..." // Optional: Match standard input background
        // Ensure parent handles the "None" logic if manually implemented
    />
    ```

## 11. Form Inputs (Text & Textarea)
*   **Standard Styling**:
    *   **Background**: `bg-background` (or `bg-muted/30` for optional/secondary).
    *   **Border**: `border border-border` default.
    *   **Focus State**: `focus:border-primary/50` + `focus:outline-none`.
    *   **Shape/Space**: `rounded-lg px-4 py-3`.
    *   **Text**: `text-foreground`.
*   **Textarea Specifics**:
    *   Add `resize-none` to prevent layout shift.
*   **Example**:
    ```tsx
    <input
        type="text"
        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground focus:border-primary/50 focus:outline-none"
        placeholder="Enter text..."
    />
    ```

## 12. Multi-Select Field Pattern (Checkbox Standard)
*   **Standard**: Use this pattern for all "Multi-Select" or "Checkbox" type fields across the system.
*   **Reference Implementation**: `features/settings/custom-fields/components/edit-custom-field-sheet.tsx`
*   **Settings Schema**:
    ```typescript
    settings: {
        multi_select_style: 'vertical' | 'horizontal' | 'columns',
        multi_select_columns: 2 | 3 | 4,  // Only when style is 'columns'
        multi_select_visual: 'button' | 'list',
        binary_mode: boolean,  // True = Yes/No toggle only
        allow_multiselect: boolean
    }
    ```

### Layout Toolbar (Icon-Based Selector)
*   **Location**: Above the options list.
*   **Icons** (from `lucide-react`):
    *   `AlignJustify` → Vertical layout
    *   `Columns` → Horizontal layout (flex-wrap)
    *   `LayoutGrid` → Columns layout (grid)
*   **Styling**:
    *   Container: `flex items-center gap-2 p-1 bg-muted rounded-lg border border-border w-fit`
    *   Active Button: `bg-primary/20 text-primary shadow-sm shadow-primary/10`
    *   Inactive Button: `text-muted-foreground hover:text-foreground hover:bg-muted`

### Column Count Selector (Nested)
*   **When Visible**: Only when `multi_select_style === 'columns'`.
*   **Values**: 2, 3, 4 columns.
*   **Styling**:
    *   Container: `flex items-center gap-0.5 ml-1 pl-1 border-l border-border`
    *   Active Button: `bg-primary text-primary-foreground shadow-sm`
    *   Inactive Button: `text-muted-foreground hover:text-foreground hover:bg-muted`
*   **Animation**: `animate-in fade-in zoom-in-50 duration-200`

### Visual Style Toolbar
*   **Icons** (from `lucide-react`):
    *   `Square` → Button Style (default, boxed items)
    *   `LayoutList` → List Style (compact, minimal borders)
*   **Usage**: Same styling as Layout Toolbar.

### Binary Mode Toggle
*   **Icon**: `ToggleRight`
*   **Behavior**: When ON, hides options list and shows a single Switch toggle.
*   **Output**: `'yes' | 'no'` instead of option values.
*   **Note**: Selecting a layout style automatically turns OFF binary mode.

### Rendering Classes
*   **Vertical**: `space-y-3`
*   **Horizontal**: `flex flex-wrap gap-3`
*   **Columns (2)**: `grid grid-cols-2 gap-3`
*   **Columns (3)**: `grid grid-cols-3 gap-3`
*   **Columns (4)**: `grid grid-cols-4 gap-3`

### Item Styling
*   **Button Style (default)**:
    ```css
    px-3 py-3 rounded-lg border cursor-pointer
    /* Selected */ bg-primary/10 border-primary/50
    /* Unselected */ bg-muted/20 border-border hover:border-border/80
    ```
*   **List Style**:
    ```css
    px-1 py-1 border-none hover:bg-muted/50 rounded
    /* Outer Container */ border border-border rounded-lg p-3 bg-muted/10
    ```

### Usage Example
```tsx
<div className={cn(
    (settings.multi_select_style === 'horizontal') ? "flex flex-wrap gap-3" :
    (settings.multi_select_style === 'columns') ?
        ((settings.multi_select_columns === 3) ? "grid grid-cols-3 gap-3" :
         (settings.multi_select_columns === 4) ? "grid grid-cols-4 gap-3" :
         "grid grid-cols-2 gap-3") :
    "space-y-3" // Default Vertical
)}>
    {options.map(opt => (
        <div
            key={opt.value}
            className={cn(
                "flex items-center space-x-3 transition-all cursor-pointer",
                settings.multi_select_visual === 'list'
                    ? "px-1 py-1 border-none hover:bg-muted/50 rounded"
                    : "px-3 py-3 rounded-lg border",
                isSelected
                    ? "bg-primary/10 border-primary/50"
                    : "bg-muted/20 border-border hover:border-border/80"
            )}
        >
            <Checkbox checked={isSelected} />
            <span className="text-sm text-foreground">{opt.label}</span>
        </div>
    ))}
</div>
```


## 13. Dynamic Custom Forms Design Strategy
*   **Strategy**: For dynamic fields (e.g., in Booking Desk, Custom Field Forms), use a "Card Object" pattern with "Unboxed Inputs".
*   **Core Rules**:
    1.  **Combobox Only**: NEVER use native `<select>`. Always use `<Combobox>`.
    2.  **Unboxed Inputs**:
        *   The *Input* itself (Combobox trigger or Text input) must match the standard system input style (`bg-input`).
        *   Do NOT double-wrap the input in another styled container (e.g., `bg-muted`) if the component already provides one.
        *   Use the `inputClassName` prop on `<Combobox>` to override default `bg-input` only if necessary.
    3.  **Card Item Wrapper**:
        *   Wrap the *Field Object* (Label + Input + Description) in a "card" container if it's part of a list.
        *   Style: `p-3 bg-card border border-border rounded-lg`.
        *   This creates a clear visual distinction for "Content Objects" while keeping the "Form Controls" (Inputs) consistent.
    4.  **Layout**:
        *   **Top Controls**: Use `grid grid-cols-2` for primary controls (e.g., Schedule | Variation). Use conditional col-spanning to handle empty states.
        *   **Inline Actions**: Place "Add New" or "Edit" buttons as **Icon Buttons** inline with the field (e.g., inside the label row or flex-aligned), reducing vertical clutter.
    5.  **Reusability**:
        *   Define a standard `inputStyles` constant at the top of the file to ensure all inputs in the form share the exact class string.
        *   `const inputStyles = "w-full bg-input ...";`

## 14. UI Scaling & Zoom
*   **Context**: The application features a global "Zoom" setting (80% - 120%) controllable from the Sidebar.
*   **State Access**:
    *   Use the `useSidebar` hook to access the current zoom level.
    *   `const { zoom } = useSidebar();`
*   **Portals & Modals (Critical)**:
    *   **Problem**: Radix UI `Dialog`, `Popover`, `Tooltip`, and `Select` render in React Portals (detached from the main app root). They do **NOT** inherit the global zoom from the main container automatically.
    *   **Solution**: You MUST manually apply the zoom style to the `Content` component of any portal-based element.
    *   **Pattern**:
        ```tsx
        const { zoom } = useSidebar();
        // ...
        <DialogContent style={{ zoom: zoom / 100 }}>
        // or
        <PopoverContent style={{ zoom: zoom / 100 }}>
        ```
*   **Manual Positioning Math**:
    *   **Context**: When implementing custom context menus or drag-and-drop overlays where you calculate `top/left` manually based on `getBoundingClientRect()`.
    *   **Rule**: Coordinates from `getBoundingClientRect` (and `e.clientX`) are in **Visual Viewport** pixels. CSS styles, however, are interpreted in **Layout Viewport** pixels, which are affected by the `zoom` property on the container.
    *   **Formula**: `Adjusted Position = Screen Coordinate / (Zoom / 100)`
    *   **Example**:
        ```typescript
        const { zoom } = useSidebar();
        const scale = zoom / 100;
        
        // 1. Get Visual Coordinates
        const rect = triggerElement.getBoundingClientRect();
        
        // 2. Scale back to CSS Coordinates for positioning
        const cssLeft = rect.left / scale;
        const cssTop = rect.bottom / scale;
        
        // 3. Apply
        setMenuPosition({ x: cssLeft, y: cssTop });
        ```
*   **Collision Detection**:
    *   Perform collision checks against `window.innerWidth` / `window.innerHeight` using the **Visual Coordinates** (unscaled) *before* converting them to CSS positions.

## 15. Unified User Data Model

### Architecture Overview
The system uses a **Unified Users Table** with **Module-Specific Extension Tables**:

```
┌─────────────────────────────────────────────────────────────────┐
│                        users (Core Identity)                     │
│  id, name, email, phone_number, avatar_url, is_active,           │
│  is_organization_admin, organization_id                          │
└────────────────────────┬────────────────────────────────────────┘
                         │ user_id (FK)
        ┌────────────────┼────────────────┬────────────────┐
        ▼                ▼                ▼                ▼
   ┌─────────┐      ┌─────────┐      ┌──────────┐    ┌──────────┐
   │  staff  │      │customers│      │ vendors  │    │(future)  │
   │─────────│      │─────────│      │──────────│    │──────────│
   │user_id  │      │user_id  │      │user_id   │    │user_id   │
   │position │      │status   │      │ein_number│    │...       │
   │driver_  │      │total_   │      │insurance │    │          │
   │ license │      │ value   │      │ docs     │    │          │
   │guide_   │      │metadata │      │billing   │    │          │
   │ license │      │prefs    │      │ address  │    │          │
   └─────────┘      └─────────┘      └──────────┘    └──────────┘
   (Operations)     (CRM Module)    (Transport)     (New Module)
```

### Core Principle
*   **`users` table** = **Identity Data** (name, email, phone, avatar)
*   **Module tables** (`staff`, `customers`, `vendors`) = **Role/Context-Specific Data**

A single person could potentially exist in multiple modules (e.g., a staff member who is also a customer), all pointing to the same `users` row.

### Query Pattern (CRITICAL)

**NEVER** select `name`, `email`, or `phone` directly from module tables. Always join to `users`:

```typescript
// ❌ WRONG - These columns don't exist on module tables anymore
const { data } = await supabase
    .from('customers')
    .select('id, name, email, phone');

// ✅ CORRECT - Join to users for identity data
const { data } = await supabase
    .from('customers')
    .select('id, status, total_value, user:users(id, name, email, phone_number)');

// Then flatten the data for easier access:
const flattenedData = (data || []).map(c => ({
    id: c.id,
    name: c.user?.name || 'Unknown',
    email: c.user?.email || '',
    phone: c.user?.phone_number || '',
    status: c.status,
    total_value: c.total_value
}));
```

### Module-Specific Fields

Each module table stores **context-specific** data that only makes sense in that module:

| Module | Table | Custom Fields |
|--------|-------|---------------|
| Operations | `staff` | `position_id`, `driver_license`, `guide_license`, `is_available` |
| CRM | `customers` | `status`, `total_value`, `metadata` (hotel, source), `preferences` |
| Transportation | `vendors` | `ein_number`, `insurance_docs`, `billing_address`, `license_info` |

### Creating New Records Pattern

When creating a new module record (e.g., customer), you **MUST**:
1. Create the user first (or find existing by email)
2. Then create the module record linked via `user_id`

```typescript
// ✅ CORRECT - Create user first, then link module record
const handleCreate = async () => {
    // 1. Check for existing user
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    let userId = existing?.id;

    // 2. Create user if doesn't exist
    if (!userId) {
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({ name, email, phone_number: phone })
            .select('id')
            .single();

        if (error) throw error;
        userId = newUser.id;
    }

    // 3. Create module record linked to user
    const { error: moduleError } = await supabase
        .from('customers')
        .insert({
            user_id: userId,
            status: 'active',
            // Module-specific fields only
            metadata: { hotel, source },
            preferences: { dietary: [], marketing_consent: {...} }
        });
};
```

### Staff Query Examples

```typescript
// Fetching staff for dropdown/lookup
const { data: staff } = await supabase
    .from('staff')
    .select('id, user:users(name)')
    .eq('is_active', true);

// Build a name lookup map
const staffMap = Object.fromEntries(
    (staff || []).map(s => [s.id, s.user?.name || 'Unknown'])
);

// Using in display: staffMap[booking.driver_id]
```

### Vendors Query Examples

```typescript
// Fetching vendors for vehicle assignment
const { data } = await supabase
    .from('vendors')
    .select('id, user:users(name, email, phone_number)')
    .order('created_at');

// Flatten for display
const vendors = (data || []).map(v => ({
    id: v.id,
    name: v.user?.name || 'Unknown',
    email: v.user?.email || '',
    phone: v.user?.phone_number || ''
}));
```

### Reference Implementations
*   **Customer Creation**: `features/crm/customers/components/add-customer-form.tsx`
*   **Staff Query**: `features/bookings/components/bookings-calendar.tsx`
*   **Vendor Query**: `app/operations/transportation/vendors/page.tsx`
*   **Quick Add Customer**: `features/bookings/components/booking-desk/quick-add-customer-dialog.tsx`

## 16. Component State Ownership (Critical)
*   **Rule**: Before modifying a component's behavior from outside, **READ** the component to understand what internal state it manages.
*   **Anti-Pattern**: If a component (e.g., `PresetManager`) maintains its own `selectedPresetId`, you **CANNOT** bypass it by calling its parent's handler directly — the component's UI won't reflect the change.
*   **Protocol**:
    1.  **Identify** which component OWNS the state you want to change.
    2.  **Read** that component's props interface — look for an existing prop or add one (e.g., `initialPresetName`).
    3.  **Thread** the prop through the component tree rather than duplicating logic at the parent level.
*   **Example**: To auto-select a saved preset on navigation, pass `initialPresetName` through `Page → Toolbar → PresetManager` so the PresetManager sets its own `selectedPresetId` internally — rather than fetching the preset at the page level and calling state setters the child also manages.
*   **Ref**: `features/reports/master-report/components/preset-manager.tsx` (`initialPresetName` prop).

## 17. View Mode Type Safety
*   **Rule**: When a wrapper component defines view aliases (e.g., `"calendar"`), ensure they map to the actual view mode union type of the child component.
*   **Problem**: TypeScript won't catch mismatches when using string literals loosely. A value like `"calendar"` passed to a component expecting `'month' | 'week' | 'day'` will silently render nothing.
*   **Pattern**: Add explicit mapping at the boundary:
    ```tsx
    const mappedView = alias === 'calendar' ? 'month' : alias;
    ```
*   **Ref**: `features/bookings/components/bookings-calendar.tsx` (`mappedInitialView`).

