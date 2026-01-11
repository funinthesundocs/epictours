import { PageShell } from "@/components/shell/page-shell";
import { PenTool, Eye, FileText } from "lucide-react";

export default function BlogPage() {
    return (
        <PageShell
            title="Blog Manager"
            description="Content creation and SEO."
            stats={[
                { label: "Published Posts", value: "42", icon: FileText },
                { label: "Monthly Reads", value: "8.5k", icon: Eye, trend: "+12%" },
                { label: "Drafts", value: "3", icon: PenTool },
            ]}
        />
    );
}
