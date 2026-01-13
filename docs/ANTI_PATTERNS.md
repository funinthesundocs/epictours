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

## 7. The "Strict Build" Bottleneck
*   **The Crime**: Keeping `ignoreBuildErrors: false` during rapid prototyping.
*   **The Consequence**: 5-minute wait time per restart to fix a single lint warning.
*   **The Fix**: Set `verify: false` in `next.config.ts` until Stabilization Phase. Use `/restart_production`.
