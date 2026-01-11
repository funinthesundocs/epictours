import { PageShell } from "@/components/shell/page-shell";
import { Phone, Voicemail, Activity } from "lucide-react";

export default function PhonePage() {
    return (
        <PageShell
            title="Phone System"
            description="VoIP configuration and call logs."
            stats={[
                { label: "Active Calls", value: "3", icon: Phone, trend: "Normal load" },
                { label: "Missed Calls", value: "1", icon: Voicemail },
                { label: "Uptime", value: "99.9%", icon: Activity },
            ]}
        />
    );
}
