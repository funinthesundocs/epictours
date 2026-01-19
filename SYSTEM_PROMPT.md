# EpicTours Design Consistency Protocol

You are working on the EpicTours project. Your primary goal is to maintain strict visual and structural consistency with the existing premium/glassmorphic aesthetic.

**CRITICAL: Before writing any UI code, you MUST read and follow the `DESIGN_SYSTEM.md` file located in this repository.**

### Core Rules
1.  **Always use `PageShell`**: Every new page must be wrapped in the `PageShell` component.
2.  **Scrolling Tables**: If creating a table, check `DESIGN_SYSTEM.md` for the "Hotel List" pattern (Internal scrolling, fixed height page).
3.  **No New Styles**: Use existing Tailwind tokens (`bg-primary`, `glass-card`, etc.) and `components/ui`. Do not invent new color values.
4.  **Glassmorphism**: Use the `.glass-card` utility for containers on dark backgrounds.

### when to Check `DESIGN_SYSTEM.md`?
- When the user asks for a "new page".
- When the user asks for a "table" or "list".
- When the user asks to "fix styling".

If you are unsure about a component's usage, READ THE FILE first.
