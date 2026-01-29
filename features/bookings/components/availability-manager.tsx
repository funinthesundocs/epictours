"use client";

import { useState, useCallback, useRef } from "react";
import { SidePanel } from "@/components/ui/side-panel";
import { Availability } from "@/features/availability/components/availability-list-table";
import { ColumnOne } from "./availability-manager/column-one";
import { ColumnTwo } from "./availability-manager/column-two";
import { ColumnThree } from "./availability-manager/column-three";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader2, Save } from "lucide-react";

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

    const handleStateChange = useCallback((state: { hasChanges: boolean; isSaving: boolean }) => {
        setFormState(prev => ({ ...prev, ...state }));
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
            title="Manage Booking Availability"
            description=""
            width="full-content"
            contentClassName="p-0 h-full flex flex-col"
            titleClassName="text-2xl"
        >
            <div className="flex-1 grid grid-cols-[25fr_45fr_30fr] min-h-0 divide-x divide-zinc-800 bg-transparent">
                {/* COLUMN 1: Availability Info + Transportation & Staff + Quick Settings */}
                <div className="flex flex-col h-full overflow-hidden">
                    <ColumnOne
                        availability={availability}
                        onStateChange={handleStateChange}
                        saveRef={saveRef}
                    />
                </div>

                {/* COLUMN 2: Bookings List */}
                <div className="flex flex-col h-full overflow-hidden" key={refreshKey}>
                    <ColumnTwo
                        availability={availability}
                        onBookingClick={onBookingEdit}
                        onManifestClick={onManifest}
                    />
                </div>

                {/* COLUMN 3: Actions */}
                <div className="flex flex-col h-full overflow-hidden">
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

            {/* Footer */}
            <div className="shrink-0 flex justify-end items-center gap-4 px-6 py-4 border-t border-white/10 bg-zinc-950/40 backdrop-blur-md">
                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={formState.isSaving || !formState.hasChanges}
                        className={cn(
                            "px-6 py-2 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors",
                            formState.isSaving
                                ? "bg-cyan-400/50 text-white cursor-not-allowed" // Saving state
                                : formState.hasChanges
                                    ? "bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]" // Active save state
                                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5" // No changes state
                        )}
                    >
                        {formState.isSaving ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Saving...
                            </>
                        ) : formState.hasChanges ? (
                            <>
                                <Save size={16} />
                                Save Changes
                            </>
                        ) : (
                            "No Changes"
                        )}
                    </button>
                </div>
            </div>
        </SidePanel>
    );
}
