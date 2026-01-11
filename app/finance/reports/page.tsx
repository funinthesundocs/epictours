import { PageShell } from "@/components/shell/page-shell";
import { PieChart, Download, FileText } from "lucide-react";

export default function ReportsPage() {
    return (
        <PageShell
            title="Financial Reports"
            description="P&L, Balance Sheet, and Tax Docs."
            stats={[
                { label: "Reports Generated", value: "12", icon: FileText },
                { label: "Tax Year", value: "2025", icon: PieChart },
                { label: "Downloads", value: "5", icon: Download },
            ]}
        />
    );
}
