import { PageShell } from "@/components/shell/page-shell";
import { Headset, UserCheck, Clock } from "lucide-react";

export default function LiveAgentsPage() {
    return (
        <PageShell
            title="Live Agents"
            description="Support team metrics and availability."
            stats={[
                { label: "Agents Online", value: "6", icon: Headset },
                { label: "Available", value: "4", icon: UserCheck },
                { label: "Avg Wait Time", value: "45s", icon: Clock },
            ]}
        />
    );
}
