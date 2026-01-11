import { PageShell } from "@/components/shell/page-shell";
import { Globe, Users, MousePointer } from "lucide-react";

export default function WebsitePage() {
    return (
        <PageShell
            title="Website Manager"
            description="CMS and Traffic Analytics."
            stats={[
                { label: "Daily Visitors", value: "1.2k", icon: Users, trend: "+5%" },
                { label: "Conversion Rate", value: "3.2%", icon: MousePointer },
                { label: "Page Health", value: "100%", icon: Globe },
            ]}
        />
    );
}
