"use client";

import { useState, useCallback } from "react";
import { BookingsCalendar } from "./bookings-calendar";
import { BookingDesk } from "./booking-desk";
import { AvailabilityActionMenu } from "./availability-action-menu";
import { AvailabilityManager } from "./availability-manager";
import { ManifestPanel } from "./manifest-panel";
import { Availability } from "@/features/availability/components/availability-list-table";
import { NewBookingMenu } from "./new-booking-menu";
import { useSidebar } from "@/components/shell/sidebar-context";
import { PageShell } from "@/components/shell/page-shell";
import { Plus } from "lucide-react";

export function BookingsCalendarWrapper() {
    const { zoom } = useSidebar();
    // Calendar refresh
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Selected availability
    const [selectedAvailability, setSelectedAvailability] = useState<Availability | null>(null);

    // Action Menu State
    const [actionMenuTriggerRect, setActionMenuTriggerRect] = useState<DOMRect | null>(null);

    // Panel States
    const [isBookingDeskOpen, setIsBookingDeskOpen] = useState(false);
    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const [isManifestOpen, setIsManifestOpen] = useState(false);

    // Edit mode state
    const [editingBookingId, setEditingBookingId] = useState<string | null>(null);

    // Handle click on availability chip
    const handleEventClick = useCallback((availability: Availability, event: React.MouseEvent) => {
        event.stopPropagation();
        setSelectedAvailability(availability);

        // Capture trigger rect for the menu to position itself
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        setActionMenuTriggerRect(rect);
    }, []);

    // Close action menu
    const closeActionMenu = useCallback(() => {
        setActionMenuTriggerRect(null);
        setSelectedAvailability(null);
    }, []);

    // Action handlers
    const handleNewBooking = useCallback((availability?: Availability) => {
        setEditingBookingId(null); // Ensure we're in create mode
        if (availability) {
            setSelectedAvailability(availability);
        }
        setIsBookingDeskOpen(true);
    }, []);

    const handleActionsSettings = useCallback(() => {
        setIsManagerOpen(true);
    }, []);

    const handleManifest = useCallback(() => {
        setIsManifestOpen(true);
    }, []);

    // Handle booking edit from manager panel
    const handleBookingEdit = useCallback((bookingId: string) => {
        setEditingBookingId(bookingId);
        setIsManagerOpen(false); // Close manager
        setIsBookingDeskOpen(true); // Open booking desk in edit mode
    }, []);

    // Handle successful save
    const handleSuccess = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
        setIsBookingDeskOpen(false);
        setEditingBookingId(null);
    }, []);

    // Handle refresh from manager
    const handleRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    return (
        <PageShell
            title="Bookings Calendar"
            description="View availability and create new bookings"
            action={
                <NewBookingMenu onSelectAvailability={handleNewBooking}>
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black text-sm font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                        <Plus size={16} />
                        New Booking
                    </button>
                </NewBookingMenu>
            }
        >
            <BookingsCalendar
                onEventClick={handleEventClick}
                key={refreshTrigger}
                selectedAvailabilityId={selectedAvailability?.id}
            />

            {/* Action Menu Popover */}
            {actionMenuTriggerRect && selectedAvailability && (
                <AvailabilityActionMenu
                    availability={selectedAvailability}
                    triggerRect={actionMenuTriggerRect}
                    zoom={zoom}
                    onClose={closeActionMenu}
                    onNewBooking={() => handleNewBooking(selectedAvailability)}
                    onActionsSettings={handleActionsSettings}
                    onManifest={handleManifest}
                />
            )}

            {/* Booking Desk (Create/Edit) */}
            <BookingDesk
                isOpen={isBookingDeskOpen}
                onClose={() => {
                    setIsBookingDeskOpen(false);
                    setEditingBookingId(null);
                }}
                onSuccess={handleRefresh}
                availability={selectedAvailability}
                editingBookingId={editingBookingId}
            />

            {/* Availability Manager (Actions & Settings) */}
            <AvailabilityManager
                isOpen={isManagerOpen}
                onClose={() => setIsManagerOpen(false)}
                availability={selectedAvailability}
                onBookingEdit={handleBookingEdit}
                onManifest={handleManifest}
                onRefresh={handleRefresh}
            />

            {/* Manifest Panel (Coming Soon) */}
            <ManifestPanel
                isOpen={isManifestOpen}
                onClose={() => setIsManifestOpen(false)}
                availability={selectedAvailability}
            />
        </PageShell>
    );
}
