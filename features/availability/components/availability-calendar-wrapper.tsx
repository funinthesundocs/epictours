"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { AvailabilityCalendar } from "@/features/availability/components/availability-calendar";
import { EditAvailabilitySheet } from "@/features/availability/components/edit-availability-sheet";
import { Availability } from "@/features/availability/components/availability-list-table";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/auth-context";
import { PageShell } from "@/components/shell/page-shell";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { LoadingState } from "@/components/ui/loading-state";

export function AvailabilityCalendarWrapper() {
    const { effectiveOrganizationId } = useAuth();
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Experiences fetched internally with org filtering
    const [experiences, setExperiences] = useState<{ id: string, name: string, short_code?: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Lifted State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedExperience, setSelectedExperience] = useState("");

    // Internal state
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [initialData, setInitialData] = useState<any>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch experiences with org filtering
    const fetchExperiences = useCallback(async () => {
        if (!effectiveOrganizationId) {
            setExperiences([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('experiences')
                .select('id, name, short_code')
                .eq('organization_id', effectiveOrganizationId)
                .eq('is_active', true)
                .order('name');

            if (error) throw error;

            // Inject "All Experiences" option
            const allOption = { id: "all", name: "All Experiences", short_code: "ALL" };
            const loadedExps = data || [];

            setExperiences([allOption, ...loadedExps]);

            // Default to "All Experiences" if nothing selected, or if current selection is invalid (though we keep simple default here)
            if (!selectedExperience) {
                setSelectedExperience(allOption.name);
            }
        } catch (err) {
            console.error("Error loading experiences:", err);
            setExperiences([{ id: "all", name: "All Experiences", short_code: "ALL" }]);
        } finally {
            setIsLoading(false);
        }
    }, [effectiveOrganizationId, selectedExperience]);

    useEffect(() => {
        fetchExperiences();
    }, [fetchExperiences]);

    const handleCreateEvent = (date: string, experienceId?: string) => {
        setInitialData({ experience_id: experienceId });
        setSelectedDate(date);
        setIsSheetOpen(true);
    };

    const handleEditEvent = (availability: Availability) => {
        setInitialData(availability);
        setSelectedDate(availability.start_date);
        setIsSheetOpen(true);
    };

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
        setIsSheetOpen(false);
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('availabilities').delete().eq('id', id);
        if (error) {
            console.error("Failed to delete availability:", error);
        } else {
            toast.success("Availability deleted");
            handleSuccess();
        }
    };

    const handleHeaderCreate = () => {
        const currentExpId = experiences.find(e => e.name === selectedExperience)?.id;
        handleCreateEvent(format(currentDate, 'yyyy-MM-dd'), currentExpId === "all" ? undefined : currentExpId);
    };

    if (isLoading) {
        return (
            <PageShell
                title="Availability Calendar"
                description="Publish and Manage Your Availabilities"
            >
                <LoadingState message="Loading experiences..." />
            </PageShell>
        );
    }

    if (!effectiveOrganizationId) {
        return (
            <PageShell
                title="Availability Calendar"
                description="Publish and Manage Your Availabilities"
            >
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Please select an organization to view availabilities.
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell
            title="Availability Calendar"
            description="Publish and Manage Your Availabilities"
            action={
                <button
                    onClick={handleHeaderCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-lg transition-colors shadow-glow"
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
