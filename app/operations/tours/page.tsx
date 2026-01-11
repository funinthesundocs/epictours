import { PageShell } from "@/components/shell/page-shell";
import { Map, Users, Calendar } from "lucide-react";

export default function ToursPage() {
    return (
        <PageShell
            title="Tours & Events"
            description="Manage your tour inventory, schedules, and active events."
            stats={[
                { label: "Active Tours", value: "8", icon: Map, trend: "Running now" },
                { label: "Total Capacity", value: "240", icon: Users },
                { label: "Upcoming Events", value: "15", icon: Calendar, trend: "Next 7 days" },
            ]}
        />
    );
}
