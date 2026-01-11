# CRM Architecture & Scalability Strategy

## The "House of Cards" Prevention Plan
To ensure the **EpicTours CRM** is not just a list of names but a robust engine driving Bookings, Sales, and Operations, we will adopt a **"Customer-Centric Star Schema"**.

The `Customer` entity is the gravitational center. All other modules (Bookings, Communicatons, Finance) orbit this valid source of truth.

---

## 1. Data Foundation (The Bedrock)
We currently have a `customers` table, but for scalability, we must enforce strict types while allowing for distinct flexibility.

### A. The Hybrid Schema Strategy
We will use **PostgreSQL Strict Typing** for core identity (Indexable, Searchable) and **JSONB** for "Soft Attributes" (Flexible, Evolving).

**Strict Columns (Immutable/Core):**
- `id` (UUID): The anchor. Never changes. Used for all Foreign Keys.
- `email`: Unique constraint. Primary identifier for auth/communication.
- `phone`: Normalized (E.164 format) for future SMS integrations.
- `status`: Enforced Enum (`active`, `lead`, `churned`).

**Flexible Columns (JSONB - `preferences`):**
Instead of adding columns for `is_vegetarian` or `has_kids` or `marketing_consent`, we use a validated JSONB column.
```json
{
  "dietary": ["vegan", "nut-free"],
  "marketing_consent": true,
  "travel_preferences": {
    "seat": "aisle",
    "class": "premium_economy"
  }
}
```
*Why this scales:* When you launch the "Bookings" module next month, you don't need to migrate the database to add "Frequent Flyer Number". You just update the Interface.

---

## 2. Relationships & Referential Integrity
We will rely heavily on **Foreign Keys** with `ON DELETE RESTRICT`. You cannot delete a customer if they have an active Booking. This prevents "Orphaned Data".

### Future Integration Points:
- **Bookings**: `bookings.customer_id` -> `customers.id`
- **Group Travel**: `tour_participants.customer_id` -> `customers.id`
- **Communications**: `interactions` table (calls, emails) linked to `customers.id`.

**Strategy**: We build the **Interactions Feed** early. Every time you "Add a Customer" or "Update a Customer", we log an event. The "History" tab becomes the single source of truth for "Who changed what and when."

---

## 3. The "Add Customer" Workflow (Data Entry Hygiene)
Garbage In, Garbage Out. To prevent a messy database, the "Add Customer" form is not just a UI; it's a **Gatekeeper**.

1.  **Duplicate Check (Pre-flight)**:
    - As the user types the email/phone, we run a "Ghost Query" to check if they already exist.
    - *Solves*: "Why do we have 3 Alice Johnsons?"

2.  **Zod Schema Sharing**:
    - The validation logic used in the Form (`add-customer-form.tsx`) must be the **exact same** logic used in the API/Database Layer.
    - We will extract `CustomerSchema` to a shared `schema` package or folder to ensure full end-to-end type safety.

---

## 4. Implementation Roadmap (Order of Operations)

**Phase A: The Gatekeeper (Current Step)**
- [ ] Build `AddCustomerForm` with Zod Validation.
- [ ] Implement "Real-time Duplicate Detection" (Debounced lookup).
- [ ] create the `useToast` system for clear success/failure feedback.

**Phase B: The View (360 Scalability)**
- [ ] Click on a Customer -> `CustomerDetailSheet`.
- [ ] This Sheet is a "Shell" that will eventually hold tabs for:
    - `Profile` (Current)
    - `Bookings` (Future)
    - `Invoices` (Future)
    - `Chat` (Future)

**Phase C: The Connection**
- [ ] Connect the `Customer` to the "Inbox" (e.g., if an email comes in from `alice@example.com`, autolink it to her CRM profile).

## Conclusion
We are building a **Relational Identity System**, not just a spreadsheet. By enforcing strict IDs and Validated JSONB now, we ensure that when we build the **Booking Engine**, it has a solid foundation to stand on.
