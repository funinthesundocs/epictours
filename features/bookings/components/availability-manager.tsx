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
            size="xl"
        >
            <div className="h-full flex">
                {/* Column 1: Availability Info */}
                <div className="w-80 flex-shrink-0 border-r border-white/10 overflow-y-auto">
                    <ColumnOne availability={availability} />
                </div>

                {/* Column 2: Bookings List */}
                <div className="flex-1 min-w-[320px] border-r border-white/10 overflow-y-auto" key={refreshKey}>
                    <ColumnTwo
                        availability={availability}
                        onBookingClick={onBookingEdit}
                        onManifestClick={onManifest}
                    />
                </div>

                {/* Column 3: Quick Settings */}
                <div className="w-80 flex-shrink-0 overflow-y-auto">
                    <ColumnThree
                        availability={availability}
                        onSaved={handleSaved}
                    />
                </div>
            </div>
        </SidePanel>
    );
}
