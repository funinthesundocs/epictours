# Coding Patterns & Best Practices

## Table Actions (Edit/Delete)
When implementing action buttons in tables:

1.  **NO Native Confirm**:
    *   **NEVER** use `window.confirm()`. It is unreliable and often blocked.
    *   **ALWAYS** use the custom `@components/ui/alert-dialog` component.

2.  **Safety & Event Handling**:
    *   Always use `type="button"`.
    *   Always `e.stopPropagation()`.
    *   Delete buttons should be standard `Trash2` icons (red).

3.  **Layout Safety**:
    *   **NEVER** use `overflow-hidden` on the parent card/container of a table. It creates stacking contexts that block edge clicks.
    *   **NEVER** use `glass-card` on the main content area for the same reason. Use simple borders (`border-white/5`).

4.  **Z-Index**:
    *   Action buttons should be `relative z-50` to ensure they sit above any potential row overlays.
