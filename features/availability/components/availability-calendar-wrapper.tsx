"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AvailabilityCalendar } from "@/features/availability/components/availability-calendar";
import { EditAvailabilitySheet } from "@/features/availability/components/edit-availability-sheet";
import { Availability } from "@/features/availability/components/availability-list-table";
import { supabase } from "@/lib/supabase";
import { PageShell } from "@/components/shell/page-shell";
import { Plus } from "lucide-react";
import { format } from "date-fns";

interface AvailabilityCalendarWrapperProps {
    experiences: { id: string, name: string, short_code?: string }[];
}

export function AvailabilityCalendarWrapper({ experiences }: AvailabilityCalendarWrapperProps) {
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Lifted State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedExperience, setSelectedExperience] = useState(experiences[0]?.name || "Mauna Kea Summit");

    // Internal state
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
        // Force refresh calendar data by triggering date change effect effectively? 
        // Actually the calendar uses currentDate as dependency, so triggering a re-mount or using the key approach is fine.
        // We are passing refreshTrigger as key to Calendar, so that works.
        // But wait, key={refreshTrigger} resets the state in Calendar? 
        // No, Calendar receives state as props now :) So it just re-renders. 
        // Actually, we don't need key={refreshTrigger} if the data fetching is inside Calendar and depends on refreshTrigger or similar.
        // The previous code had key={refreshTrigger}. We can keep it or improve data fetching trigger.
        // Since we are passing currentDate, Calendar fetches on currentDate change. 
        // If we add an explicit refresh dependency to Calendar, that's better.
        // For now, let's keep the key approach to force re-fresh, but it might reset view mode?
        // Ah, viewMode is in Calendar. Resetting it might be annoying.
        // Let's rely on standard data re-fetching.
        // Actually, easier: Update current date reference slightly or just use key. Key is easiest for now.
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('availabilities').delete().eq('id', id);
        if (error) {
            console.error("Failed to delete availability:", error);
            // In a real app, maybe show a toast
        } else {
            toast.success("Availability deleted");
            handleSuccess(); // Triggers refresh and close
        }
    };

    const handleHeaderCreate = () => {
        const currentExpId = experiences.find(e => e.name === selectedExperience)?.id;
        handleCreateEvent(format(currentDate, 'yyyy-MM-dd'), currentExpId);
    };

    return (
        <PageShell
            title="Availability Calendar"
            description="Publish and Manage Your Availabilities"
            action={
                <button
                    onClick={handleHeaderCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                    <Plus size={16} />
                    Create Availability
                </button>
            }
        >
            <AvailabilityCalendar
                experiences={experiences}
                onEventClick={handleCreateEvent}
                onEditEvent={handleEditEvent}
                key={refreshTrigger}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                selectedExperience={selectedExperience}
                onExperienceChange={setSelectedExperience}
            />

            <EditAvailabilitySheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={handleSuccess}
                onDelete={handleDelete}
                selectedDate={selectedDate}
                initialData={initialData}
            />
        </PageShell>
    );
}
