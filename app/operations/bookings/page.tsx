import { PageShell } from "@/components/shell/page-shell";
import { AvailabilityCalendar } from "@/features/availability/components/availability-calendar";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
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
            <AvailabilityCalendar experiences={experiences || []} />
        </PageShell>
    );
}
