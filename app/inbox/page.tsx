import { PageShell } from "@/components/shell/page-shell";
import { Mail, MessageSquare, Inbox as InboxIcon } from "lucide-react";

export default function InboxPage() {
    return (
        <PageShell
            title="Inbox"
            description="Unified Communications Center"
            stats={[
                { label: "Unread", value: "12", icon: Mail, trend: "+2 since last login" },
                { label: "Support Tickets", value: "5", icon: MessageSquare },
                { label: "Archived", value: "1,240", icon: InboxIcon },
            ]}
        >
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                <Mail size={48} className="mb-4 opacity-20" />
                <p>Gmail Integration Module Loading...</p>
                <p className="text-xs mt-2">Connecting to secure mail server</p>
            </div>
        </PageShell>
    );
}
