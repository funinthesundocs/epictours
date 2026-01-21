import { PageShell } from "@/components/shell/page-shell";
import { BookingsCalendarWrapper } from "@/features/bookings/components/bookings-calendar-wrapper";

export const dynamic = "force-dynamic";

export default function BookingsPage() {
    return (
        <PageShell
            title="Bookings Calendar"
            description="View availability and create new bookings"
        >
            <BookingsCalendarWrapper />
        </PageShell>
    );
}

