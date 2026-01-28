import { PageShell } from "@/components/shell/page-shell";
import { ActivityFeed } from "@/features/settings/activity-log/components/activity-feed";

export default function ActivityLogPage() {
    return (
        <PageShell
            title="Activity Log"
            description="View the history of all data changes and user actions."
        >
            <div className="max-w-4xl">
                <ActivityFeed />
            </div>
        </PageShell>
    );
}
