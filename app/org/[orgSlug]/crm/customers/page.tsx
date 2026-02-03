"use client";

import { CustomersPage } from "@/features/crm/customers/page";

/**
 * Org-scoped Customers page for platform admins.
 * Re-uses the existing CustomersPage component which reads effectiveOrganizationId from auth context.
 */
export default function OrgCustomersPage() {
    return <CustomersPage />;
}
