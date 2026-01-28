import { ActivityFeed } from "@/features/settings/activity-log/components/activity-feed";

export default function ActivityLogPage() {
    return (
        <div className="h-[calc(100vh-2rem)] lg:h-[calc(100vh-4rem)] flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col space-y-4 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Activity Log</h1>
                        <p className="text-zinc-400 text-sm">View the history of all data changes and user actions.</p>
                    </div>
                </div>
            </div>

            {/* Content (Table + Pagination) */}
            <ActivityFeed />
        </div>
    );
}
