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
            <div className="w-full max-w-md space-y-4">
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative flex items-center bg-zinc-900 rounded-lg border border-white/10 p-1">
                        <Mail className="ml-3 text-zinc-500" size={20} />
                        <input
                            type="email"
                            placeholder="Enter email address..."
                            className="w-full bg-transparent text-white placeholder-zinc-500 px-3 py-2 focus:outline-none"
                        />
                        <button className="bg-white text-black px-4 py-1.5 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors">
                            Add
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center p-8 text-zinc-500 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <InboxIcon size={48} className="mb-4 opacity-20" />
                    <p>Gmail Integration Module Loading...</p>
                    <p className="text-xs mt-2">Connecting to secure mail server</p>
                </div>
            </div>
        </PageShell>
    );
}
