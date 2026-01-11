import { PageShell } from "@/components/shell/page-shell";
import { CloudCog, Globe, DollarSign } from "lucide-react";

export default function OTAPage() {
    return (
        <PageShell
            title="OTA Manager"
            description="Manage listings on Viator, TripAdvisor, and Expedia."
            stats={[
                { label: "Connected OTAs", value: "3", icon: CloudCog },
                { label: "Bookings (OTA)", value: "34%", icon: Globe },
                { label: "Commission Paid", value: "$4.2k", icon: DollarSign },
            ]}
        />
    );
}
