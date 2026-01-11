import { PageShell } from "@/components/shell/page-shell";
import { Shield, Lock, Key } from "lucide-react";

export default function PermissionsPage() {
    return (
        <PageShell
            title="Roles & Permissions"
            description="RBAC configuration."
            stats={[
                { label: "Defined Roles", value: "5", icon: Shield },
                { label: "Super Admins", value: "1", icon: Lock },
                { label: "API Keys", value: "3", icon: Key },
            ]}
        />
    );
}
