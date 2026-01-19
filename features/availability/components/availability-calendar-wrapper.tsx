"use client";

import { useState } from "react";
import { AvailabilityCalendar } from "@/features/availability/components/availability-calendar";
import { EditAvailabilitySheet } from "@/features/availability/components/edit-availability-sheet";

interface AvailabilityCalendarWrapperProps {
    experiences: { id: string, name: string, short_code?: string }[];
}

export function AvailabilityCalendarWrapper({ experiences }: AvailabilityCalendarWrapperProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>("");

    const handleEventClick = (date: string) => {
        setSelectedDate(date);
        setIsSheetOpen(true);
    };

    const handleSuccess = () => {
        // Could refresh data here
        setIsSheetOpen(false);
    };

    return (
        <>
            <AvailabilityCalendar
                experiences={experiences}
                onEventClick={handleEventClick}
            />

            <EditAvailabilitySheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={handleSuccess}
                selectedDate={selectedDate}
            />
        </>
    );
}
