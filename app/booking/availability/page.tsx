"use client";

import { AvailabilityCalendarWrapper } from "@/features/availability/components/availability-calendar-wrapper";

export default function AvailabilityPage() {
    // Experiences are now fetched inside the wrapper using useAuth for org filtering
    return (
        <AvailabilityCalendarWrapper />
    );
}
