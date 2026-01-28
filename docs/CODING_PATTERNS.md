# 💎 Coding Patterns & Standards

## 0. The Prime Directive: Comparative Analysis
*   **Trigger**: When a feature (e.g., Save Button) fails.
*   **Protocol**:
    1.  **Stop**. Do not guess the error.
    2.  **Locate** a parallel feature that works (e.g., Experience Save Button).
    3.  **Read** the working file (using `view_file`) line-by-line.
    4.  **Diff** against your broken file.
    5.  **Copy** the working logic exactly (Logic patterns, Zod schemas, Initialization).

## 1. UI Standards

### Save/Update Buttons

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
*   **Indicators**: Use `cyan-500` for active states.

## 2. UI Components (Deep Core)
*   **SidePanel / Sheet Layouts**:
    *   **Standard Structure (Glass Pattern)**:
        *   **Content**: `p-0 overflow-hidden flex flex-col`.
        *   **Form**: `h-full flex flex-col`.
        *   **Scroll Area**: Wrap content in `<div className="flex-1 overflow-y-auto p-6 ...">`.
    *   **Footer Rules**:
        *   **Position**: Sticky at bottom (`mt-auto`).
        *   **Style**: `bg-zinc-950/40 backdrop-blur-md` with `border-t border-white/10`.
        *   **Buttons**: Primary Action Button must use **White Text** (`text-white`) on Cyan background. Never use black text.
    *   **Snippet**:
        ```tsx
        <SidePanel contentClassName="p-0 overflow-hidden flex flex-col" ...>
            <form className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24 space-y-6">
                    {/* Content */}
                </div>
                <div className="shrink-0 flex justify-end items-center gap-4 py-4 px-6 border-t border-white/10 mt-auto bg-zinc-950/40 backdrop-blur-md">
                    <Button type="submit" className="text-white ...">Save</Button>
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
        *   Header styling (`bg-white/5 backdrop-blur-sm`)
        *   Row hover states and transitions

### 2.1 Mobile Card View Pattern (Data Tables)
*   **Standard**: ALL data tables MUST have a mobile card view alternative.
*   **Trigger**: Use `hidden md:table` on the desktop `<table>` element and `md:hidden` on the mobile card container.
*   **Card Container**: `<div className="md:hidden space-y-4 p-4">`
*   **Card Styling**:
    ```css
    bg-white/5 border border-white/10 rounded-xl p-4 space-y-4
    ```
*   **Card Structure**:
    1.  **Header Section**: Name/Title + Action Buttons (flex, justify-between)
        *   Icon in circle: `w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400`
        *   Name: `text-lg font-bold text-white leading-tight`
        *   Separator: `border-b border-white/5 pb-3`
    2.  **Body Section**: Two-column grid for details
        *   Container: `grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-base`
        *   Labels: `text-zinc-500`
        *   Values: `text-zinc-300`
*   **Action Buttons**:
    *   Container: `flex items-center gap-1 shrink-0`
    *   Edit: `p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors`
    *   Delete: `p-2 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400 transition-colors`
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
            <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                {/* Header: Name + Actions */}
                <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                            <Icon size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white leading-tight">{item.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => onEdit(item)} className="p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={() => setDeleteId(item.id)} className="p-2 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Body: Two Columns */}
                <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-base">
                    <div className="text-zinc-500">Label</div>
                    <div className="text-zinc-300">{item.value}</div>
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
*   **Strict Colors**: Calendar inactive days/headers must strictly match the design token (e.g. `zinc-950/80`), even if it requires `!important` or specific class overrides.
*   **Popup Calendar Selection Style**:
    *   **Context**: For small popup calendars (e.g. Booking Modal).
    *   **Rule**: Selected date must use **Border Only** styling. NO background color ("glow") and NO shadow.
    *   **Implementation**: Override the `selected` class key.
    *   **Class**: `border-2 border-cyan-500 text-cyan-400 bg-transparent hover:text-cyan-300 focus:text-cyan-300 shadow-none font-bold`

## 10. Custom Select Pattern (Combobox Standard)
*   **Standard**: Use the Combobox pattern for all "Select" inputs.
*   **Component**: `@/components/ui/combobox`
*   **Core Requirements**:
    1.  **Always Searchable**: The trigger must be an input field that filters the dropdown options. Do NOT use static triggers.
    2.  **Dropdown Style**:
        *   Background: `bg-[#1a1f24]`
        *   Border: `border-white/10`
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
        inputClassName="bg-zinc-900/80 ..." // Optional: Match standard input background
        // Ensure parent handles the "None" logic if manually implemented
    />
    ```

## 11. Form Inputs (Text & Textarea)
*   **Standard Styling**:
    *   **Background**: `bg-black` (or `bg-black/30` for optional/secondary).
    *   **Border**: `border border-white/10` default.
    *   **Focus State**: `focus:border-cyan-500/50` (Cyan) + `focus:outline-none`.
    *   **Shape/Space**: `rounded-lg px-4 py-3`.
    *   **Text**: `text-white`.
*   **Textarea Specifics**:
    *   Add `resize-none` to prevent layout shift.
*   **Example**:
    ```tsx
    <input
        type="text"
        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
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
    *   Container: `flex items-center gap-2 p-1 bg-black/20 rounded-lg border border-white/10 w-fit`
    *   Active Button: `bg-cyan-500/20 text-cyan-400 shadow-sm shadow-cyan-500/10`
    *   Inactive Button: `text-zinc-500 hover:text-zinc-300 hover:bg-white/5`

### Column Count Selector (Nested)
*   **When Visible**: Only when `multi_select_style === 'columns'`.
*   **Values**: 2, 3, 4 columns.
*   **Styling**:
    *   Container: `flex items-center gap-0.5 ml-1 pl-1 border-l border-white/10`
    *   Active Button: `bg-cyan-500 text-black shadow-sm`
    *   Inactive Button: `text-zinc-500 hover:text-zinc-300 hover:bg-white/5`
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
    /* Selected */ bg-cyan-500/10 border-cyan-500/50
    /* Unselected */ bg-black/20 border-white/10 hover:border-white/20
    ```
*   **List Style**:
    ```css
    px-1 py-1 border-none hover:bg-white/5 rounded
    /* Outer Container */ border border-white/10 rounded-lg p-3 bg-black/10
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
                    ? "px-1 py-1 border-none hover:bg-white/5 rounded"
                    : "px-3 py-3 rounded-lg border",
                isSelected
                    ? "bg-cyan-500/10 border-cyan-500/50"
                    : "bg-black/20 border-white/10 hover:border-white/20"
            )}
        >
            <Checkbox checked={isSelected} />
            <span className="text-sm text-zinc-300">{opt.label}</span>
        </div>
    ))}
</div>
```


## 13. Dynamic Custom Forms Design Strategy
*   **Strategy**: For dynamic fields (e.g., in Booking Desk, Custom Field Forms), use a "Card Object" pattern with "Unboxed Inputs".
*   **Core Rules**:
    1.  **Combobox Only**: NEVER use native `<select>`. Always use `<Combobox>`.
    2.  **Unboxed Inputs**:
        *   The *Input* itself (Combobox trigger or Text input) must match the standard system input style (`bg-zinc-900/80`).
        *   Do NOT double-wrap the input in another styled container (e.g., `bg-black/20`) if the component already provides one.
        *   Use the `inputClassName` prop on `<Combobox>` to override default `bg-black/20` to `bg-zinc-900/80`.
    3.  **Card Item Wrapper**:
        *   Wrap the *Field Object* (Label + Input + Description) in a "card" container if it's part of a list.
        *   Style: `p-3 bg-black/20 border border-white/10 rounded-lg`.
        *   This creates a clear visual distinction for "Content Objects" while keeping the "Form Controls" (Inputs) consistent.
    4.  **Layout**:
        *   **Top Controls**: Use `grid grid-cols-2` for primary controls (e.g., Schedule | Variation). Use conditional col-spanning to handle empty states.
        *   **Inline Actions**: Place "Add New" or "Edit" buttons as **Icon Buttons** inline with the field (e.g., inside the label row or flex-aligned), reducing vertical clutter.
    5.  **Reusability**:
        *   Define a standard `inputStyles` constant at the top of the file to ensure all inputs in the form share the exact class string.
        *   `const inputStyles = "w-full bg-zinc-900/80 ...";`
