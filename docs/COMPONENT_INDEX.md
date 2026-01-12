# 🧰 The Component Toolbox (Golden Standard)
> **Usage**: Before building a UI element, check if it exists here.
> **Rule**: Reuse > Rebuild.

## 🟢 UI Primitives (`components/ui`)
*   **Button**: Use standard `<button>` with Tailwind utility classes defined in `CODING_PATTERNS.md`.
*   **Input**: Use `inputClasses` helper or standard Tailwind.
*   **SidePanel**: `components/ui/side-panel.tsx`
    *   *Props*: `isOpen`, `onClose`, `title`, `width`
    *   *Use for*: Edit Forms, Details Views.
*   **AlertDialog**: `components/ui/alert-dialog.tsx`
    *   *Use for*: Delete confirmations, destructive actions.
*   **Combobox**: `components/ui/combobox.tsx`
    *   *Use for*: Searchable dropdowns (Select2).

## 🟡 Global Features (`features/global`)
*   **ThemeToggle**: `features/global/theme-toggle.tsx` (Handles Dark/Midnight modes).

## 🔴 Do Not Build
*   **Native Modals**: Use `SidePanel` or `AlertDialog`.
*   **Native Confirms**: Use `AlertDialog`.
