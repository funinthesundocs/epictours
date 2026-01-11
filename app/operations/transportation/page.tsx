import { PageShell } from "@/components/shell/page-shell";
import { Bus, Settings, Fuel } from "lucide-react";

export default function TransportationPage() {
    return (
        <PageShell
            title="Transportation"
            description="Fleet management and logistics."
            stats={[
                { label: "Active Fleet", value: "12", icon: Bus, trend: "All online" },
                { label: "Maintenance", value: "1", icon: Settings, trend: "Scheduled" },
                { label: "Fuel Efficiency", value: "94%", icon: Fuel },
            ]}
        />
    );
}
