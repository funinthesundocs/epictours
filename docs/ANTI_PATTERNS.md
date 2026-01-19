# 🚫 The Penalty Box: Known Anti-Patterns
> **Status**: BANNED
> **Effect**: Immediate Build Failure or User Frustration.

## 1. The "Inline" Time Picker
*   **The Crime**: Building a 50-line `<div>` with `onClick` handlers inside a massive Form Component.
*   **The Consequence**: Unreadable code, impossible to debug, Z-index trapping.
*   **The Fix**: Extract to `components/ui/time-picker.tsx`.

## 2. The "Window.Confirm" Lazy Trap
*   **The Crime**: `if (window.confirm("Delete?")) ...`
*   **The Consequence**: Native browser dialogs look cheap, block the main thread, and are ignored by some modern browsers.
*   **The Fix**: Use `<AlertDialog>`.

## 3. The "Silent" Submit
*   **The Crime**: `handleSubmit(onSubmit)` without an error callback.
*   **The Consequence**: User clicks "Save", nothing happens. Developer has no logs.
*   **The Fix**: `handleSubmit(onSubmit, (err) => console.error(err))`

## 4. The "Overflow Hidden" Table
*   **The Crime**: Putting `overflow-hidden` on a Table Card to get rounded corners.
*   **The Consequence**: Dropdown menus (Actions) get clipped/hidden when near the edge.
*   **The Fix**: Use `overflow-visible` and apply rounded corners to the internal elements (or just accept square corners for maximizing utility).

## 5. The "Assume Schema" Guess
*   **The Crime**: "I'll just assume the database field is `min_age` (number)".
*   **The Consequence**: It was `min_age` (string) or `min_age_years` or `age_min`. Zod crash.
*   **The Fix**: Read `schema.sql` BEFORE writing `form.tsx`.

## 6. The "Native Select" Cheap-Out
*   **The Crime**: Using `<select>` because it's easier than building a custom dropdown.
*   **The Consequence**: Breaks the "Dark Mode Premium" aesthetic (white browser default inputs).
*   **The Fix**: Always use the custom dropdown pattern (Input + Div + Map).

## 8. The "Git for Twins" Fallacy
*   **The Crime**: Pushing to GitHub just to share code with an Agent in another window on the *same machine*.
*   **The Consequence**: Polluting the commit history with "wip" checkpoints and wasting time.
*   **The Fix**: Just switch windows. We share the same hard drive. Run "Master Alignment" to sync memory.

## 9. The "Git Pull Refresh" Confusion
*   **The Crime**: Running `git pull` just to restart the local server.
*   **The Consequence**: Wastes 5 seconds checking GitHub for code you already have on disk.
*   **The Fix**: Use `@[/refresh]` (Local Kill -> Nuke -> Build -> Start). Only pull when you know remote has changes.

## 10. The "Browser Test Everything" Slowdown
*   **The Crime**: Using browser subagent to verify every single UI change.
*   **The Consequence**: 3-5 minute delays per test. User frustration. Queue timeouts.
*   **The Fix**: Build, start server, ask user to test. Reserve browser for recordings only.

## 11. The "Hardcoded Enum" Constraint Trap
*   **The Crime**: Using `CHECK (tier IN ('Retail', 'Online'))` on columns meant to be dynamic.
*   **The Consequence**: Dynamic data (from related tables) gets rejected. 400 errors.
*   **The Fix**: Use plain `TEXT NOT NULL`. Validate at application layer if needed.

## 12. The "Orphan Record" Trap
*   **The Crime**: Creating a child record (e.g. Availability) without passing the Parent ID (e.g. Experience ID) to the creation form.
*   **The Consequence**: Record saves successfully but has `NULL` parent_id. Does not appear in filtered lists. "Ghost Data".
*   **The Fix**: Lift state. If the Parent ID lives in a filter/dropdown, pass it explicitly to the Create Sheet's `initialData`.

## 13. The "Null vs Optional" Zod Trap
*   **The Crime**: Using `z.string().optional()` for a database field that can be `NULL`.
*   **The Consequence**: Validation fails with "Expected string, received null" because `optional()` only handles `undefined`.
*   **The Fix**: Always use `z.string().optional().nullable()` for nullable DB columns.

