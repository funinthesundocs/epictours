import { ActivityFeed } from "@/features/settings/activity-log/components/activity-feed";
import { Activity } from "lucide-react";

export default function ActivityLogPage() {
    return (
        <div
            className="flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
        >
            {/* Header */}
            <div className="flex flex-col space-y-4 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 shrink-0">
                            <Activity size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Activity Log</h1>
                            <p className="text-zinc-400 text-sm">View the history of all data changes and user actions.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content (Table + Pagination) */}
            <ActivityFeed />
        </div>
    );
}
