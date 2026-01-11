import { PageShell } from "@/components/shell/page-shell";
import { Calendar, Clock } from "lucide-react";

export default function CalendarsPage() {
    return (
        <PageShell
            title="Calendars"
            description="Master schedule view for all operations."
            stats={[
                { label: "Today's Events", value: "4", icon: Calendar },
                { label: "Pending Approvals", value: "2", icon: Clock, trend: "Urgent" },
            ]}
        />
    );
}
