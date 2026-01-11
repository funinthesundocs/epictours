import { PageShell } from "@/components/shell/page-shell";
import { Layout, Palette, Monitor } from "lucide-react";

export default function DashSettingsPage() {
    return (
        <PageShell
            title="Dashboard Configuration"
            description="Layout customization and widget preferences."
            stats={[
                { label: "Active Layout", value: "Command Center", icon: Layout },
                { label: "Theme", value: "Deep Dark", icon: Palette },
                { label: "Display Density", value: "Comfortable", icon: Monitor },
            ]}
        />
    );
}
