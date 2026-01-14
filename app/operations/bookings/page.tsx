import { PageShell } from "@/components/shell/page-shell";
import { BookingCalendar } from "@/features/bookings/components/booking-calendar";

export default function BookingsPage() {
    return (
        <PageShell
            title="Availability Calendar"
            description="Publish and Manage Your Availabilities"
        >
            <BookingCalendar />
        </PageShell>
    );
}
