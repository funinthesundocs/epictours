import { PageShell } from "@/components/shell/page-shell";
import { Building2, MapPin, Globe } from "lucide-react";

export default function OrganizationPage() {
    return (
        <PageShell
            title="Organization Profile"
            description="Company details and branding."
            stats={[
                { label: "Legal Entity", value: "EpicTours LLC", icon: Building2 },
                { label: "HQ Location", value: "New York, NY", icon: MapPin },
                { label: "Domain", value: "epictours.ai", icon: Globe },
            ]}
        />
    );
}
