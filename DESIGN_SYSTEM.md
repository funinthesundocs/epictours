# EpicTours Design System & Consistency Protocol

> [!IMPORTANT]
> This document is the **Source of Truth** for all UI/UX implementations. All AI agents and developers must strictly adhere to these patterns to maintain the "system" of consistency.

## 1. Core Philosophy
- **Premium Aesthetic**: All designs must feel modern, "glassmorphic" (where appropriate), and high-end.
- **Consistency**: Do not invent new styles. Reuse existing tokens and components.
- **Responsiveness**: All layouts must work on mobile, tablet, and desktop.

## 2. Design Tokens
Reference `app/globals.css` for the source values.

### Colors
Use CSS Variables or Tailwind classes. **Do not use hex codes directly.**
- **Primary**: `bg-primary` / `text-primary` (Cyan 400)
- **Background**: `bg-background` (Zinc 950)
- **Surface**: `bg-card` / `glass-card` (Zinc 900 + Backdrop Blur)
- **Text**: `text-foreground` (Zinc 50) / `text-muted-foreground` (Zinc 400)
- **Borders**: `border-border` (Zinc 800) or `border-white/5` for subtle glass borders.

### Typography
- **Font**: `Likely Outfit` (via variable `--font-outfit`).
- **Headings**: Bold, tight tracking (`tracking-tight`).
- **Body**: Antialiased, readable contrast.

## 3. Layout Patterns

### Page Structure
**ALL** pages must use the `PageShell` component.
```tsx
import { PageShell } from "@/components/shell/page-shell";

export default function MyPage() {
  return (
    <PageShell
      title="My Page Title"
      description="Brief description of the page purpose."
      icon={MyIcon}
      action={<Button>Add New</Button>}
    >
      {/* Page Content */}
    </PageShell>
  );
}
```

### Containers
- Use `p-4 lg:p-8` for main content spacing (handled by `PageLayout`).
- **Glass Cards**: Use the `.glass-card` utility class for containers on top of the background.
  ```tsx
  <div className="glass-card p-6 rounded-xl">
    ...
  </div>
  ```

## 4. Component Usage

### Buttons
- **Primary Actions**: `variant="default"` (Cyan)
- **Secondary**: `variant="secondary"` or `variant="outline"`
- **Destructive**: `variant="destructive"`
- **Icons**: Use `lucide-react` icons.

### Data Tables
- Follow the pattern in `components/ui/table` or existing feature tables.
- Headers should be `text-muted-foreground` and `uppercase text-xs font-semibold`.
- Rows should have hover states.

#### Scrolling Table Structure (Match "Hotel List" style)
For tables that need to scroll independently within the page:

1. **Page Container**: Constrain the page height.
   ```tsx
   <PageShell 
     className="h-[calc(100vh-2rem)] lg:h-[calc(100vh-4rem)] flex flex-col"
     contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
   >
   ```

2. **Table Wrapper (Outer)**: Flex container to fill space.
   ```tsx
   <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-white/5 bg-[#0b1115]">
     <MyTable />
   </div>
   ```

3. **Table Wrapper (Inner)**: The actual scroll container.
   ```tsx
   // Inside MyTable component
   <div className="h-full overflow-auto relative">
     <table className="w-full text-left hidden md:table">
       <thead className="sticky top-0 z-20 bg-white/5 backdrop-blur-sm ...">
          ...
       </thead>
       ...
     </table>
   </div>
   ```

### Forms
- Use `react-hook-form` + `zod`.
- Wrap inputs in `FormItem` -> `FormLabel` -> `FormControl` -> `FormMessage`.
- Use `components/ui` inputs (Input, Select, Switch).

### SidePanels & Sheets
- **Purpose**: Complex editing, creation flows, or deeper details that don't warrant a full page navigation.
- **Layout**: Fixed positioning.
    - **Header**: Standard Title + Description.
    - **Body**: Scrollable independent of footer.
    - **Footer**: Fixed to bottom. Contains primary actions (Save) and destructive actions (Delete). **No Cancel buttons.**
- **Styling**:
    - **Primary Button**: Cyan Background, **White Text**, Shadow.
    - **Background**: `#0b1115` (Deep Zinc).

## 5. AI Instructions (The "Agent")
When asking an AI (like me) to build a new feature, provide this file as context.
**Rule**: If a requested UI element does not exist in `components/ui`, **do not create it from scratch**. Ask the user if it should be added to the system first.
**Rule**: Always verify consistency with `PageShell` before finalizing code.
