import { PageShell } from "@/components/shell/page-shell";
import { Layers, Link, CheckCircle } from "lucide-react";

export default function HighLevelPage() {
    return (
        <PageShell
            title="HighLevel Integration"
            description="Synchronization with GHL CRM."
            stats={[
                { label: "Sync Status", value: "Connected", icon: Link, trend: "Last sync 2m ago" },
                { label: "Contacts Synced", value: "12,450", icon: Layers },
                { label: "Pipelines", value: "5", icon: CheckCircle },
            ]}
        />
    );
}
