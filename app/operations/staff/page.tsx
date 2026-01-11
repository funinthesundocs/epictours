import { PageShell } from "@/components/shell/page-shell";
import { Users, UserCheck, Briefcase } from "lucide-react";

export default function StaffPage() {
    return (
        <PageShell
            title="Staff Management"
            description="HR, Payroll, and Shift Scheduling."
            stats={[
                { label: "Total Staff", value: "45", icon: Users },
                { label: "On Shift", value: "18", icon: UserCheck, trend: "Active now" },
                { label: "Open Positions", value: "3", icon: Briefcase },
            ]}
        />
    );
}
