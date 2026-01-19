"use client";

import { useState } from "react";
import { AvailabilityCalendar } from "@/features/availability/components/availability-calendar";
import { EditAvailabilitySheet } from "@/features/availability/components/edit-availability-sheet";
import { Availability } from "@/features/availability/components/availability-list-table";

interface AvailabilityCalendarWrapperProps {
    experiences: { id: string, name: string, short_code?: string }[];
}

export function AvailabilityCalendarWrapper({ experiences }: AvailabilityCalendarWrapperProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [initialData, setInitialData] = useState<any>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleCreateEvent = (date: string, experienceId?: string) => {
        setInitialData({ experience_id: experienceId });
        setSelectedDate(date);
        setIsSheetOpen(true);
    };

    const handleEditEvent = (availability: Availability) => {
        // Pass the availability object as initial data
        setInitialData(availability);
        setSelectedDate(availability.start_date);
        setIsSheetOpen(true);
    };

    const handleSuccess = () => {
        // Refresh data and close sheet
        setRefreshTrigger(prev => prev + 1);
        setIsSheetOpen(false);
    };

    return (
        <>
            <AvailabilityCalendar
                experiences={experiences}
                onEventClick={handleCreateEvent}
                onEditEvent={handleEditEvent}
                key={refreshTrigger} // Simple way to force re-mount/re-fetch on save
            />

            <EditAvailabilitySheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={handleSuccess}
                selectedDate={selectedDate}
                initialData={initialData}
            />
        </>
    );
}
