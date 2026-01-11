import { PageShell } from "@/components/shell/page-shell";
import { Ticket, DollarSign, CheckCircle } from "lucide-react";

export default function BookingsPage() {
    return (
        <PageShell
            title="Bookings"
            description="Central reservation system."
            stats={[
                { label: "Total Bookings", value: "1,250", icon: Ticket },
                { label: "Revenue (MTD)", value: "$45k", icon: DollarSign, trend: "+12%" },
                { label: "Confirmed", value: "98%", icon: CheckCircle },
            ]}
        />
    );
}
