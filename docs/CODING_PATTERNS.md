# 💎 Coding Patterns & Standards

## 0. The Prime Directive: Comparative Analysis
*   **Trigger**: When a feature (e.g., Save Button) fails.
*   **Protocol**:
    1.  **Stop**. Do not guess the error.
    2.  **Locate** a parallel feature that works (e.g., Experience Save Button).
    3.  **Read** the working file (using `view_file`) line-by-line.
    4.  **Diff** against your broken file.
    5.  **Copy** the working logic exactly (Logic patterns, Zod schemas, Initialization).

## 1. UI Components (Deep Core)
*   **Tables**:
    *   **Headers**: Always visible, even when empty.
    *   **Empty State**: Use a `<tr><td colSpan={4} ...>Message</td></tr>` inside `<tbody>` instead of a wrapper `div`. This maintains layout stability.
    *   **Styling**: `bg-black` or `bg-zinc-900` backgrounds. Text `zinc-300`. Headers `zinc-400`.
    *   **Dropdowns**: Use the `DropdownMenu` component (`@/components/ui/dropdown-menu.tsx`) for actions and complex filters. NEVER use page-level horizontal scroll buttons for complex filters; put them in the column header.
*   **Icons**:
    *   **Action Buttons**: Use `lucide-react` icons (16px).
    *   **Indicators**: Use `cyan-500` for active states.
*   **Forms**:
    *   **Inputs**: `bg-black/20` with `border-white/10`. Focus `cyan-500/50`.
    *   **Tabs**: Use internal `useState` for tabs within SidePanels. Use `animate-in fade-in slide-in-from-right-4` for smooth transitions.

## 2. Database & RLS
*   **Local Development**:
    *   **Seeding**: When seeding data from scripts, use `ON CONFLICT` to prevent duplicates.
    *   **RLS**: If `anon` access is blocked during dev, temporarily allow `public` access using a specific policy:
        ```sql
        CREATE POLICY "Allow public access" ON table_name FOR ALL USING (true) WITH CHECK (true);
        ```

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

## 10. Custom Select Pattern (Form Dropdowns)
*   **Standard**: Use the custom component instead of native `<select>`.
*   **Component**: `@/components/ui/custom-select`
*   **Features**:
    *   **Styling**: Matches the Dark Mode / Cyan theme (Background `bg-[#1a1f24]`, Focus `cyan-500`).
    *   **Flexibility**: Accepts simple strings OR objects (`{ value: string, label: string }`).
    *   **Animations**: Uses framer-motion for smooth open/close.
*   **Usage with React Hook Form**:
    *   Do NOT use `{...register('field')}` directly.
    *   Use `watch` for value and `setValue` for updates.
    ```tsx
    import { CustomSelect } from "@/components/ui/custom-select";

    // ... inside component
    const { watch, setValue } = useForm();

    <CustomSelect
        value={watch("field_name")}
        onChange={(val) => setValue("field_name", val, { shouldValidate: true })}
        options={[
            { value: "opt1", label: "Option 1" },
            { value: "opt2", label: "Option 2" }
        ]}
        placeholder="Select Option..."
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
