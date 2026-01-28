"use client";

/**
 * Required Field Indicator
 * A red dot used to indicate that a form field is required.
 * Use this component instead of "*" for consistency across the application.
 */
export function RequiredIndicator() {
    return (
        <span className="text-red-500 text-lg leading-none" aria-label="required">
            •
        </span>
    );
}
