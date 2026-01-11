import { PageShell } from "@/components/shell/page-shell";
import { Bot, Zap, MessageSquare } from "lucide-react";

export default function AIAgentsPage() {
    return (
        <PageShell
            title="AI Agents"
            description="Configure and monitor autonomous agents."
            stats={[
                { label: "Active Agents", value: "4", icon: Bot },
                { label: "Conversations", value: "1.2k", icon: MessageSquare, trend: "+15% this week" },
                { label: "Response Time", value: "0.2s", icon: Zap },
            ]}
        />
    );
}
