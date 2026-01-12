# SOP: Robust Form Development & Debugging
**Top 10 Lessons Learned from the "Experiences Form" Chaos**

## The "Silent Killer" Prevention
**1. Always Log Validation Errors**
*   **Failure:** The form wouldn't save, and nothing happened. We assumed it was broken logic, but it was just hidden validation errors.
*   **Rule:** NEVER write `handleSubmit(onSubmit)`. ALWAYS write `handleSubmit(onSubmit, (errors) => console.error("Form Errors:", errors))`.
*   **Why:** You cannot fix what you cannot see.

## Data Handling & Types
**2. The "Null vs Empty" Trap**
*   **Failure:** The database returns `NULL` for empty fields. The Form input expects `""`. Zod crashed because `string` cannot be `null`.
*   **Rule:** Always sanitize `initialData` in `useEffect`. Convert ALL potential nulls to empty strings before feeding them to `reset()`.
    ```javascript
    // BAD
    reset(initialData)
    // GOOD
    reset({ ...initialData, description: initialData.description || "" })
    ```

**3. Decouple Form Schema from DB Schema**
*   **Failure:** We tried to bind a Textarea (String) directly to a Database Array (`what_to_bring`). This caused constant type friction.
*   **Rule:** The `FormSchema` should match the UI (e.g., all Strings). The **Transformation Layer** (inside `onSubmit`) converts those strings to Arrays/Numbers for the DB. Don't simplify the schema; simplify the inputs.

**4. Loose by Default, Strict by Necessity**
*   **Failure:** Fields like "Transport Details" blocked saving because they were technically "required" by Zod default.
*   **Rule:** Start every schema field as `.optional().nullable()`. Only add `.min(1)` (Required) if the database *absolutely rejects* the row without it.

**5. Explicit Booleans**
*   **Failure:** `z.boolean().default(true)` caused TypeScript build errors because `optional` conflicts with `boolean`.
*   **Rule:** Be explicit. Use `z.boolean()` and handle the default value in the `useForm({ defaultValues: ... })` config.

## Development Workflow
**6. The "Race Condition" Crash**
*   **Failure:** We ran `npm run start` while `npm run build` was still working. The server crashed with "Connection Refused".
*   **Rule:** Sequential processing is mandatory. `npm run build && npm run start`. Never parallelize dependent steps.

**7. Atomic Fixes vs. Nuclear Overwrites**
*   **Failure:** We fixed the Start Time, but then overwrote the file to fix the Slogan, accidentally deleting the Start Time fix.
*   **Rule:** If a file is large, read it first or use specific patch tools. If you must overwrite, **verify** you aren't reverting a fix made 2 minutes ago.

## User Interface (UI)
**8. Custom vs. Native Elements**
*   **Failure:** We relied on `<datalist>` for a time picker. It looked like a cheap browser default (white box) and frustrated the user.
*   **Rule:** If the user asks for a "Premium" or "Dark" UI, native browser inputs (Color pickers, Datalists, Date pickers) are often insufficient. Build the custom Component (Using `absolute` positioning) for full control.

**9. Visual Feedback is Mandatory**
*   **Failure:** The user clicked "Save" and didn't know if it worked or failed.
*   **Rule:** Buttons must show a Loading Spinner (`isSubmitting`). Failure catches must trigger an `alert` or `toast`.

**10. verify_fix() BEFORE notify_user()**
*   **Failure:** We told the user "It is fixed", but the server was crashed or the code wasn't loaded.
*   **Rule:** Always verify the site actually loads (Browser Tool check) before effectively saying "Mission Accomplished". The user has zero patience for false positives.
