# 💎 Coding Patterns & Standards

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

## 8. Dark Theme Date/Time Pickers
*   **Problem**: Browser native date/time pickers default to light theme calendar popups.
*   **Solution**: Add `style={{ colorScheme: 'dark' }}` to date/time inputs.
*   **Example**:
    ```tsx
    <input type="date" style={{ colorScheme: 'dark' }} />
    <input type="time" style={{ colorScheme: 'dark' }} />
    ```
