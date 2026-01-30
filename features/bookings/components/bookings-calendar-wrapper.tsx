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
import { supabase } from "@/lib/supabase";

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
        setActionMenuTriggerRect(null);
    }, []);

    const handleActionsSettings = useCallback(() => {
        setIsManagerOpen(true);
        setActionMenuTriggerRect(null);
    }, []);

    const handleManifest = useCallback(() => {
        setIsManifestOpen(true);
        setActionMenuTriggerRect(null);
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
                    is_repeating, duration_type, hours_long, online_booking_status, repeat_days,
                    experiences!inner(id, name, short_code)
                )
            `)
            .eq('id', bookingId)
            .single();

        console.log("DEBUG: Fetched booking:", booking, "Error:", error);

        if ((booking as any)?.availabilities) {
            const avail = (booking as any).availabilities;
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
                is_repeating: avail.is_repeating ?? false,
                duration_type: avail.duration_type || 'time_range',
                hours_long: avail.hours_long,
                online_booking_status: avail.online_booking_status || 'closed',
                repeat_days: avail.repeat_days,
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
        setSelectedAvailability(null);
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
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-lg transition-colors shadow-glow"
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
                    setSelectedAvailability(null);
                }}
                onSuccess={handleRefresh}
                availability={selectedAvailability}
                editingBookingId={editingBookingId}
            />

            {/* Availability Manager (Actions & Settings) */}
            <AvailabilityManager
                isOpen={isManagerOpen}
                onClose={() => {
                    setIsManagerOpen(false);
                    setSelectedAvailability(null);
                }}
                availability={selectedAvailability}
                onBookingEdit={handleBookingEdit}
                onManifest={handleManifest}
                onRefresh={handleRefresh}
            />

            {/* Manifest Panel (Coming Soon) */}
            <ManifestPanel
                isOpen={isManifestOpen}
                onClose={() => {
                    setIsManifestOpen(false);
                    setSelectedAvailability(null);
                }}
                availability={selectedAvailability}
            />
        </PageShell>
    );
}
