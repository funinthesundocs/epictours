# Coding Patterns & Best Practices

## 1. Table Actions (Edit/Delete)
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

---

## 2. Advanced Component Architecture (Phase 2)
*Required for complex forms and interactive elements.*

### A. The "Transformer" Pattern
**Problem**: Logic in `onSubmit` becomes a tangle of type conversions (`string` -> `null`, `string` -> `array`).
**Solution**: Extract transformation logic into pure functions *outside* the component.
```typescript
// bad
onSubmit: (data) => {
   const val = data.field === "" ? null : Number(data.field);
   // ... 20 more lines of logic
}

// GOOD
const toDomainModel = (form: FormData): DBModel => ({
    age: form.age ? Number(form.age) : null,
    tags: form.tags.split(',').map(t => t.trim())
});
// in component
onSubmit: (data) => save(toDomainModel(data));
```

### B. Strict Component Extraction
**Problem**: We built a complex Time Picker *inline* inside `ExperienceSheet`. This makes the file huge and harder to read.
**Rule**: If a UI element requires its own `useState` (e.g., `isOpen`, `inputValue`), it **MUST** be extracted to a separate file.
*   `components/ui/time-picker.tsx` (Generic)
*   `features/experiences/components/schedule-builder.tsx` (Specific)

### C. Z-Index Stratification Strategy
To prevent "Dropdowns appearing behind Modals":
*   **Base Content**: `z-0`
*   **Sticky Headers**: `z-10`
*   **Dropdowns/Selects**: `z-40` or `z-50`
*   **Modals/Sheets**: `z-[100]`
*   **Toasts/Alerts**: `z-[200]` -> `z-[9999]`

### D. The "Context Tag" (Memory Anchor)
**Context**: Agents drift because they don't know *which* doc applies to the current file.
**Rule**: High-complexity files (Forms, API routes) MUST start with a comment pointing to their binding SOP.
```typescript
// @read: docs/SOP_Form_Development.md
"use client";
```

---

## 3. Operational Protocols

### A. The "Windows Kill Switch"
**Context**: Windows holds file locks on the `.next` folder during builds.
**Rule**: Before running `npm run dev` or `npm run build`, you should aggressively free ports if previous commands failed.
```powershell
npx kill-port 3001 && npm run build
```

### B. Seed Parity
**Context**: If you change the Schema (e.g., make `is_active` required), the Seed file `database/14_seed_*.sql` is instantly broken.
**Rule**: **Atomic Commits**. If you modify `schema.sql`, you MUST check and update `seed.sql` in the same Task.

---

## 11. Typography & Contrast Enforcement
> **Context**: To ensure legibility and a premium aesthetic on dark backgrounds ("Prism Deep").
> **Rule**: All "white" text must be either **Pure White** (`text-white`) or **Zinc-400** (`text-zinc-400`).
> **Constraint**: Do NOT use `text-zinc-500` or darker for any readable content (headers, labels, body).
> **Exception**: For data-heavy components (like Calendar Chips), use **Bold White** (`font-bold text-white`) against colored backgrounds to maximize readability.
> **Why**: `text-zinc-500` is too faint on the matte black/zinc-900 backgrounds, creating accessibility issues.
