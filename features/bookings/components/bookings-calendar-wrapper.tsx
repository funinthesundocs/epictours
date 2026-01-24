"use client";

import { useState, useCallback } from "react";
import { BookingsCalendar } from "./bookings-calendar";
import { BookingDesk } from "./booking-desk";
import { AvailabilityActionMenu } from "./availability-action-menu";
import { AvailabilityManager } from "./availability-manager";
import { ManifestPanel } from "./manifest-panel";
import { Availability } from "@/features/availability/components/availability-list-table";

export function BookingsCalendarWrapper() {
    // Calendar refresh
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Selected availability
    const [selectedAvailability, setSelectedAvailability] = useState<Availability | null>(null);

    // Action Menu State
    const [actionMenuPosition, setActionMenuPosition] = useState<{ x: number; y: number } | null>(null);

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

        // Position menu near the click
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setActionMenuPosition({
            x: Math.min(rect.right + 10, window.innerWidth - 300),
            y: Math.min(rect.top, window.innerHeight - 300)
        });
    }, []);

    // Close action menu
    const closeActionMenu = useCallback(() => {
        setActionMenuPosition(null);
    }, []);

    // Action handlers
    const handleNewBooking = useCallback(() => {
        setEditingBookingId(null); // Ensure we're in create mode
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
        <>
            <BookingsCalendar
                onEventClick={handleEventClick}
                key={refreshTrigger}
            />

            {/* Action Menu Popover */}
            {actionMenuPosition && selectedAvailability && (
                <AvailabilityActionMenu
                    availability={selectedAvailability}
                    position={actionMenuPosition}
                    onClose={closeActionMenu}
                    onNewBooking={handleNewBooking}
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
        </>
    );
}
