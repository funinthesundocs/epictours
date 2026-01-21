import { PageShell } from "@/components/shell/page-shell";
import { AvailabilityCalendarWrapper } from "@/features/availability/components/availability-calendar-wrapper";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
    // Fetch active experiences sorted by name
    const { data: experiences } = await supabase
        .from('experiences')
        .select('id, name, short_code')
        .eq('is_active', true)
        .order('name') as any;

    return (
        <PageShell
            title="Availability Calendar"
            description="Publish and Manage Your Availabilities"
        >
            <AvailabilityCalendarWrapper experiences={experiences || []} />
        </PageShell>
    );
}
