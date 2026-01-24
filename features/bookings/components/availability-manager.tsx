"use client";

import { useState, useCallback } from "react";
import { SidePanel } from "@/components/ui/side-panel";
import { Availability } from "@/features/availability/components/availability-list-table";
import { ColumnOne } from "./availability-manager/column-one";
import { ColumnTwo } from "./availability-manager/column-two";
import { ColumnThree } from "./availability-manager/column-three";

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

    const handleSaved = useCallback(() => {
        setRefreshKey(prev => prev + 1);
        onRefresh();
    }, [onRefresh]);

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
            <div className="h-full grid grid-cols-1 lg:grid-cols-[25fr_45fr_30fr] gap-6 p-6 overflow-hidden">

                {/* COLUMN 1: Availability Info */}
                <div className="h-full flex flex-col overflow-y-auto border-r border-zinc-800 pr-6">
                    <ColumnOne availability={availability} />
                </div>

                {/* COLUMN 2: Bookings List */}
                <div className="h-full flex flex-col overflow-y-auto border-r border-zinc-800 pr-6" key={refreshKey}>
                    <ColumnTwo
                        availability={availability}
                        onBookingClick={onBookingEdit}
                        onManifestClick={onManifest}
                    />
                </div>

                {/* COLUMN 3: Quick Settings */}
                <div className="h-full flex flex-col overflow-y-auto">
                    <ColumnThree
                        availability={availability}
                        onSaved={handleSaved}
                    />
                </div>
            </div>
        </SidePanel>
    );
}
