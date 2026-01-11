# Master Prompt: Antigravity Business Core (The "Gold" Edition)

## 🌌 The Mission
**Goal**: Build the "Antigravity Business OS"—an operationally critical platform for Tours, Logistics, Finance, and AI Agents.  
**Scope**: Infinite. We start with the Shell, then scale to 20+ modules. Functional stability is paramount.

## 📜 Step 0: The Anchor (Self-Preservation)
This file is the architectural source of truth. Refer to this file whenever unsure of the architectural standards.

## 🧬 Project DNA (The Soul)
We are not building a boring Admin Panel. We are building an Experience Engine.

- **The Vibe**: "Command Center for the Future." Dark, mysterious, premium, fast.
- **The User**: A high-performance operator who needs data instantly.
- **The Quality**: If it looks like a standard Bootstrap/Material UI, it is wrong. It must look custom, fluid, and alive.

### ⚖️ The Balance of Power
You must strictly obey Architecture laws, but you have Creative License on Design.

| STRICT CONTROL (The Robot) | CREATIVE LICENSE (The Artist) |
| :--- | :--- |
| File Structure (Feature Containers) | Micro-interactions & Animations |
| Data Flow (Server -> Client) | Color gradients & Glass effects |
| Type Safety (No `any`) | Card layouts & Typography choices |
| Error Handling (Boundaries) | "Delight" features (Confetti, Swishes) |

## 🏛️ The 16 Pillars of Architecture (Strict Enforcement)

### Group A: Structural Integrity
1.  **Extreme Modularity (The "Container" Rule)**: Every feature (e.g., `features/operations/tours`) is a self-contained universe. No code sharing between features except via shared `@/lib` primitives.
2.  **The Registry Pattern**: Navigation and Sidebar links must be generated from a central `config/navigation.ts` array. Adding a module is adding a line of config, not hacking HTML.
3.  **Vertical Slicing**: Build "Feature First", not "Layer First". Build the entire vertical slice of "Bookings" (DB -> Action -> UI) before moving to the next feature.
4.  **Strict URL Mirroring**: The URL path (`/operations/tours`) must strictly match the file structure (`features/operations/tours`). Predictability is speed.

### Group B: Data & Logic Safety
5.  **Zod-First Truth**: Define Zod Schemas before TypeScript types. The Schema acts as the single source of truth for API validation and Form handling.
6.  **Server-Side Sanctity**: Never trust the client. All Zod validations must run inside Server Actions.
7.  **The DTO Barrier**: UI Components should not know the raw Database schema. Transform DB data into clean "UI Interfaces" at the server boundary. This prevents DB refactors from breaking the UI.
8.  **Global Event Bus**: Distinct features talk via typed Events (e.g., `events.emit('booking:created')`), not keyhole imports. Decouple your logic.

### Group C: The User Experience
9.  **The "State Triad"**: Every UI component must handle 3 states visually: Loading (Skeleton), Error (Retry), and Empty (Clear CTA).
10. **Optimistic UI**: The interface must react instantly to clicks. Use `useOptimistic` to show changes before the server confirms. "Dead clicks" are forbidden.
11. **Epic Aesthetics**: Deep dark glassmorphism (`bg-muted/40`).
12. **Mandatory Feedback**: Success = Toast. Error = Toast. Processing = Pulse/Spinner. The user is never left guessing.

### Group D: Stability & Process
13. **Mandatory Error Boundaries**: Wrap every feature container in a React Error Boundary. A crash in "Weather Widget" must not kill the "Booking Engine".
14. **Config-Driven Permissions**: Access Control (RBAC) is defined in a JSON config, not hardcoded `if (user.role === 'admin')` checks scattered in UI.
15. **Mock-First Build**: Build the specific UI with fake data first. Get the user's visual approval before wiring the database. This separates "Design Bugs" from "Data Bugs".
16. **Documentation-Driven**: Before coding a complex module, write a 5-line `README.md` in its folder explaining exactly what it does.

## 🚀 Execution Sequence (Boot Protocol)
1.  **Initialize**: Next.js 16, Tailwind 4.
2.  **Manifest**: Save this prompt to `docs/ARCHITECTURE_MANIFESTO.md`.
3.  **Shell**: Build the Layout, Sidebar (using Registry Pattern), and Global Theme.
4.  **Wait**: Ask the User: "Core Systems Active. Which Module shall we initialize?"
