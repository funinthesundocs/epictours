"use client";

import { useState, useCallback, useRef } from "react";
import { SidePanel } from "@/components/ui/side-panel";
import { Availability } from "@/features/availability/components/availability-list-table";
import { ColumnOne } from "./availability-manager/column-one";
import { ColumnTwo } from "./availability-manager/column-two";
import { ColumnThree } from "./availability-manager/column-three";
import { toast } from "sonner";

interface AvailabilityManagerProps {
    isOpen: boolean;
    onClose: () => void;
    availability: Availability | null;
    onBookingEdit: (bookingId: string) => void;
    onManifest: () => void;
    onRefresh: () => void;
}

export function AvailabilityManager({
    isOpen,
    onClose,
    availability,
    onBookingEdit,
    onManifest,
    onRefresh
}: AvailabilityManagerProps) {
    const [refreshKey, setRefreshKey] = useState(0);
    const [formState, setFormState] = useState({ hasChanges: false, isSaving: false, formData: {} });
    const [bookingCount, setBookingCount] = useState(0);

    // Ref to call save from column-three
    const saveRef = useRef<(() => Promise<void>) | null>(null);

    const handleStateChange = useCallback((state: { hasChanges: boolean; isSaving: boolean; formData: any }) => {
        setFormState(state);
    }, []);

    const handleSave = useCallback(async () => {
        if (saveRef.current) {
            await saveRef.current();
            toast.success("Settings saved");
            onRefresh();
        }
    }, [onRefresh]);

    const handleCancelTour = useCallback(() => {
        toast.info("Cancel Tour - Coming Soon");
    }, []);

    const handleDeleteAvailability = useCallback(() => {
        toast.info("Delete Availability - Coming Soon");
    }, []);

    const handleEmailTour = useCallback(() => {
        toast.info("Email Tour - Coming Soon");
    }, []);

    const handleSmsTour = useCallback(() => {
        toast.info("SMS Tour - Coming Soon");
    }, []);

    if (!availability) return null;

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title="Manage Availability"
            description={`${availability.experience_name || 'Experience'} on ${(() => {
                const [y, m, d] = availability.start_date.split('-');
                return `${m}-${d}-${y}`;
            })()}`}
            width="w-[90vw] max-w-[90vw]"
            contentClassName="p-0"
        >
            <div className="h-full grid grid-cols-1 lg:grid-cols-[25fr_55fr_20fr] gap-6 p-6 overflow-hidden">

                {/* COLUMN 1: Availability Info + Transportation & Staff + Quick Settings */}
                <div className="h-full flex flex-col overflow-y-auto border-r border-zinc-800 pr-6">
                    <ColumnOne
                        availability={availability}
                        onStateChange={handleStateChange}
                        saveRef={saveRef}
                    />
                </div>

                {/* COLUMN 2: Bookings List */}
                <div className="h-full flex flex-col overflow-y-auto border-r border-zinc-800 pr-6" key={refreshKey}>
                    <ColumnTwo
                        availability={availability}
                        onBookingClick={onBookingEdit}
                        onManifestClick={onManifest}
                    />
                </div>

                {/* COLUMN 3: Actions */}
                <div className="h-full flex flex-col overflow-y-auto">
                    <ColumnThree
                        onSave={handleSave}
                        isSaving={formState.isSaving}
                        hasChanges={formState.hasChanges}
                        bookingCount={bookingCount}
                        onCancelTour={handleCancelTour}
                        onDeleteAvailability={handleDeleteAvailability}
                        onEmailTour={handleEmailTour}
                        onSmsTour={handleSmsTour}
                    />
                </div>
            </div>
        </SidePanel>
    );
}
