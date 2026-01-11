# Coding Patterns & Best Practices

## Table Actions (Edit/Delete)
When implementing action buttons in tables (rows that might be clickable or complex layouts):

1.  **Always use `type="button"`**:
    ```tsx
    <button type="button" ... />
    ```
    To prevent accidental form submissions if wrapped in a form.

2.  **Stop Propagation**:
    Always stop propagation on click to prevent row-click events or bubbling issues.
    ```tsx
    onClick={(e) => {
      e.stopPropagation();
      onDelete(item.id);
    }}
    ```

3.  **Z-Index & Positioning**:
    Ensure action buttons have `relative z-10` if they overlap with other interactive elements.
