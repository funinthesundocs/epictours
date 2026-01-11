import { PageShell } from "@/components/shell/page-shell";
import { Handshake, Users, Award } from "lucide-react";

export default function PartnersPage() {
    return (
        <PageShell
            title="Partners & Affiliates"
            description="Manage strategic relationships."
            stats={[
                { label: "Active Partners", value: "18", icon: Handshake },
                { label: "Referrals (M)", value: "154", icon: Users },
                { label: "Top Partner", value: "Expedia", icon: Award },
            ]}
        />
    );
}
