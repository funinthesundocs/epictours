import { CustomersPage } from "@/features/crm/customers/page";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Customers | EpicTours.ai",
    description: "Customer Relationship Management",
};

export default function Page() {
    return <CustomersPage />;
}
