"use client";

import { useState, useCallback } from "react";
import { BookingsCalendar } from "./bookings-calendar";
import { BookingDesk } from "./booking-desk";
import { AvailabilityActionMenu } from "./availability-action-menu";
import { AvailabilityManager } from "./availability-manager";
import { ManifestPanel } from "./manifest-panel";
import { Availability } from "@/features/availability/components/availability-list-table";
import { NewBookingMenu } from "./new-booking-menu";
import { PageShell } from "@/components/shell/page-shell";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
    const handleEventClick = useCallback((availability: Availability, rect: DOMRect) => {
        setSelectedAvailability(availability);

        // Position menu extending from the top-right of the clicked chip
        setActionMenuPosition({
            x: Math.min(rect.right + 8, window.innerWidth - 300),
            y: rect.top
        });
    }, []);

    // Close action menu
    const closeActionMenu = useCallback(() => {
        setActionMenuPosition(null);
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

    // Handle booking edit from manager panel or list view
    const handleBookingEdit = useCallback(async (bookingId: string) => {
        console.log("DEBUG: handleBookingEdit called with bookingId:", bookingId);

        // Fetch the booking to get its availability
        const { data: booking, error } = await supabase
            .from('bookings' as any)
            .select(`
                availability_id,
                availabilities!inner(
                    id, start_date, start_time, max_capacity, experience_id,
                    pricing_schedule_id, booking_option_schedule_id, transportation_route_id,
                    driver_id, guide_id, vehicle_id, private_announcement, public_announcement,
                    experiences!inner(id, name, short_code)
                )
            `)
            .eq('id', bookingId)
            .single();

        console.log("DEBUG: Fetched booking:", booking, "Error:", error);

        if (booking?.availabilities) {
            const avail = booking.availabilities as any;
            console.log("DEBUG: Setting availability:", avail);
            // Construct availability object that matches the expected shape
            setSelectedAvailability({
                id: avail.id,
                start_date: avail.start_date,
                start_time: avail.start_time,
                max_capacity: avail.max_capacity,
                experience_id: avail.experience_id,
                experience_name: avail.experiences?.name || '',
                experience_short_code: avail.experiences?.short_code || '',
                pricing_schedule_id: avail.pricing_schedule_id,
                booking_option_schedule_id: avail.booking_option_schedule_id,
                transportation_route_id: avail.transportation_route_id,
                driver_id: avail.driver_id,
                guide_id: avail.guide_id,
                vehicle_id: avail.vehicle_id,
                private_announcement: avail.private_announcement,
                public_announcement: avail.public_announcement,
                booking_records_count: 0
            } as Availability);
        }

        setEditingBookingId(bookingId);
        setIsManagerOpen(false); // Close manager if open
        setIsBookingDeskOpen(true); // Open booking desk in edit mode
        console.log("DEBUG: Opening booking desk with bookingId:", bookingId);
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
                onBookingEdit={handleBookingEdit}
                key={refreshTrigger}
            />

            {/* Action Menu Popover */}
            {actionMenuPosition && selectedAvailability && (
                <AvailabilityActionMenu
                    availability={selectedAvailability}
                    position={actionMenuPosition}
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
