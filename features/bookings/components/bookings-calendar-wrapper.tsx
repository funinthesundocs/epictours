"use client";

import { useState } from "react";
import { BookingsCalendar } from "./bookings-calendar";
import { CreateBookingSheet } from "./create-booking-sheet";
import { Availability } from "@/features/availability/components/availability-list-table";

export function BookingsCalendarWrapper() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedAvailability, setSelectedAvailability] = useState<Availability | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleCreateBooking = (availability: Availability) => {
        setSelectedAvailability(availability);
        setIsSheetOpen(true);
    };

    const handleSuccess = () => {
        // Refresh data (if we added bookings count to the calendar later, this would be useful)
        // For now, it just closes the sheet.
        setRefreshTrigger(prev => prev + 1);
        setIsSheetOpen(false);
        // Maybe show toast?
    };

    return (
        <>
            <BookingsCalendar
                onEventClick={handleCreateBooking}
                key={refreshTrigger}
            />

            <CreateBookingSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={handleSuccess}
                availability={selectedAvailability}
            />
        </>
    );
}
