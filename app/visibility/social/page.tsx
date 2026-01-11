import { PageShell } from "@/components/shell/page-shell";
import { Share2, Heart, MessageCircle } from "lucide-react";

export default function SocialPage() {
    return (
        <PageShell
            title="Social Media"
            description="Social signals and engagement."
            stats={[
                { label: "Total Followers", value: "15.4k", icon: Share2 },
                { label: "Engagement", value: "4.5%", icon: Heart, trend: "High" },
                { label: "Mentions", value: "24", icon: MessageCircle },
            ]}
        />
    );
}
