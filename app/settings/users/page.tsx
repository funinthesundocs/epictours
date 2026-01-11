import { PageShell } from "@/components/shell/page-shell";
import { UserCog, Shield, Users } from "lucide-react";

export default function UsersPage() {
    return (
        <PageShell
            title="User Management"
            description="Team access and invite links."
            stats={[
                { label: "Total Seats", value: "50", icon: Users },
                { label: "Active Users", value: "12", icon: UserCog },
                { label: "Admins", value: "2", icon: Shield },
            ]}
        />
    );
}
