import { PageShell } from "@/components/shell/page-shell";
import { Receipt, DollarSign, AlertCircle } from "lucide-react";

export default function BillingPage() {
    return (
        <PageShell
            title="Billing & Invoices"
            description="Accounts receivable and payable."
            stats={[
                { label: "Outstanding", value: "$12.5k", icon: AlertCircle, trend: "3 Overdue" },
                { label: "Collected (M)", value: "$68k", icon: DollarSign },
                { label: "Invoices Sent", value: "142", icon: Receipt },
            ]}
        />
    );
}
