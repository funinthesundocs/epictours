"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { format, parseISO, isSameDay } from "date-fns";
import { Loader2, MapPin, Clock, User, CheckCircle2, XCircle, AlertCircle, Bus, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";
import { MasterReportRow } from "@/features/reports/master-report/types";

interface ManifestViewProps {
    onBookingEdit: (bookingId: string) => void;
    currentDate: Date;
    onDateChange: (date: Date) => void;
}

export function ManifestView({ onBookingEdit, currentDate, onDateChange }: ManifestViewProps) {
    const { effectiveOrganizationId } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [bookings, setBookings] = useState<MasterReportRow[]>([]);
    // Date state is now managed by parent
    const [checkInStatuses, setCheckInStatuses] = useState<{ id: string; status: string; color: string }[]>([]);

    // Fetch data optimized for daily view
    useEffect(() => {
        if (!effectiveOrganizationId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Check-In Statuses
                const { data: statuses } = await supabase
                    .from('check_in_statuses' as any)
                    .select('id, status, color')
                    .eq('organization_id', effectiveOrganizationId);

                if (statuses) setCheckInStatuses(statuses);

                // 2. Fetch Bookings for the selected date
                const { data: rawBookings, error } = await supabase
                    .from('bookings' as any)
                    .select(`
                        id, status, pax_count, total_amount, amount_paid, payment_status, 
                        confirmation_number, notes, check_in_status_id,
                        customers(id, user:users(name, email, phone_number), metadata),
                        availabilities!inner(
                            id, start_date, start_time, 
                            experiences(name, short_code),
                            availability_assignments(
                                vehicle:vehicles(name),
                                driver:staff(user:users(name))
                            )
                        ),
                        option_values
                    `)
                    .eq('organization_id', effectiveOrganizationId)
                    .eq('availabilities.start_date', format(currentDate, 'yyyy-MM-dd'))
                    .order('availabilities(start_time)', { ascending: true });

                if (error) throw error;

                // Transform to MasterReportRow-like shape for rendering
                const rows = (rawBookings || []).map((b: any) => {
                    const avail = b.availabilities;
                    const customer = b.customers;
                    const assignment = avail.availability_assignments?.[0] || {};

                    return {
                        booking_id: b.id,
                        confirmation_number: b.confirmation_number,
                        pax_count: b.pax_count,
                        notes: b.notes,
                        status: b.status,
                        check_in_status_id: b.check_in_status_id,

                        customer_name: customer?.user?.name || 'Unknown',
                        customer_hotel: customer?.metadata?.hotel || 'No Hotel',

                        experience_name: avail.experiences?.name,
                        start_time: avail.start_time,

                        vehicle_name: assignment.vehicle?.name,
                        driver_name: assignment.driver?.user?.name,

                        // Option Values for robust pickup handling would go here
                        pickup_location: customer?.metadata?.hotel || 'No Hotel'
                    };
                });

                setBookings(rows as any[]);

            } catch (err) {
                console.error("Error fetching manifest:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [effectiveOrganizationId, currentDate]);

    const handleCheckInUpdate = async (bookingId: string, statusId: string) => {
        // Optimistic UI
        setBookings(prev => prev.map(b =>
            b.booking_id === bookingId ? { ...b, check_in_status_id: statusId } : b
        ));

        await supabase
            .from('bookings')
            .update({ check_in_status_id: statusId === 'null' ? null : statusId })
            .eq('id', bookingId);
    };

    // Group by Time -> Experience
    const groupedBookings = useMemo(() => {
        const groups: Record<string, typeof bookings> = {};
        bookings.forEach(b => {
            const time = b.start_time?.slice(0, 5) || 'Unknown';
            if (!groups[time]) groups[time] = [];
            groups[time].push(b);
        });
        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }, [bookings]);

    return (
        <div className="h-full flex flex-col bg-muted/10">
            {/* Control Bar */}
            <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">Daily Manifest</h2>
                    <div className="text-muted-foreground font-medium">
                        {format(currentDate, "EEEE, MMMM do, yyyy")}
                    </div>
                </div>

                <style>{`
                    @media print {
                        aside, .print-hide, button, nav, header { display: none !important; }
                        body, .bg-muted\\/10 { background: white !important; }
                        .h-full { height: auto !important; overflow: visible !important; }
                        .overflow-y-auto { overflow: visible !important; }
                    }
                `}</style>

                <div className="flex items-center gap-2 print-hide">
                    {/* Date Nav (Simplified) */}
                    <button
                        onClick={() => {
                            const d = new Date(currentDate);
                            d.setDate(d.getDate() - 1);
                            onDateChange(d);
                        }}
                        className="p-2 hover:bg-muted rounded-full"
                    >
                        ←
                    </button>
                    <button
                        onClick={() => {
                            const d = new Date(currentDate);
                            d.setDate(d.getDate() + 1);
                            onDateChange(d);
                        }}
                        className="p-2 hover:bg-muted rounded-full"
                    >
                        →
                    </button>
                    <button
                        onClick={() => onDateChange(new Date())}
                        className="text-xs font-bold px-3 py-1.5 bg-primary/10 text-primary rounded-md uppercase"
                    >
                        Today
                    </button>
                </div>
            </div>

            {/* Manifest Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-muted-foreground" />
                    </div>
                ) : groupedBookings.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                        No bookings found for this date.
                    </div>
                ) : (
                    groupedBookings.map(([time, groupBookings]) => (
                        <div key={time} className="space-y-3">
                            {/* Time Header */}
                            <div className="flex items-baseline gap-3 pb-2 border-b border-border/50">
                                <h3 className="text-2xl font-bold font-mono tracking-tight text-foreground">{time}</h3>
                                <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Departure</div>
                            </div>

                            {/* Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {groupBookings.map(booking => {
                                    const currentStatus = checkInStatuses.find(s => s.id === booking.check_in_status_id);

                                    return (
                                        <div
                                            key={booking.booking_id}
                                            className={cn(
                                                "group relative bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden",
                                                currentStatus?.status === "Checked-in" ? "opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0" : ""
                                            )}
                                        >
                                            {/* Status Strip */}
                                            <div
                                                className="absolute left-0 top-0 bottom-0 w-1.5"
                                                style={{ backgroundColor: currentStatus ? `var(--${currentStatus.color}-500)` : 'transparent' }}
                                            />

                                            <div className="p-4 pl-6 flex flex-col gap-3">
                                                {/* Top Row: Experience & Hotel */}
                                                <div className="flex justify-between items-start gap-2">
                                                    <div>
                                                        <div className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                                                            {booking.experience_name}
                                                        </div>
                                                        <div className="flex items-start gap-1.5 text-foreground font-medium text-sm leading-snug">
                                                            <MapPin size={14} className="mt-0.5 text-muted-foreground shrink-0" />
                                                            <span className="line-clamp-2">{booking.pickup_location}</span>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 flex flex-col items-end">
                                                        <div className="text-2xl font-bold tabular-nums text-foreground">
                                                            {booking.pax_count}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground font-bold uppercase">PAX</div>
                                                    </div>
                                                </div>

                                                <hr className="border-border/50 border-dashed" />

                                                {/* Middle: Customer */}
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                                        <User size={16} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div
                                                            onClick={() => onBookingEdit(booking.booking_id)}
                                                            className="text-base font-semibold text-foreground truncate cursor-pointer hover:underline decoration-primary underline-offset-4"
                                                        >
                                                            {booking.customer_name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground font-mono">
                                                            #{booking.confirmation_number}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bottom: Check In Action */}
                                                <div className="mt-1 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 flex-1 relative z-10">
                                                        <select
                                                            className="w-full h-9 pl-3 pr-8 text-sm bg-muted/30 border border-border rounded-lg appearance-none cursor-pointer hover:bg-muted/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                                            value={booking.check_in_status_id || ''}
                                                            onChange={(e) => handleCheckInUpdate(booking.booking_id, e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <option value="null">Pending</option>
                                                            {checkInStatuses.map(s => (
                                                                <option key={s.id} value={s.id}>
                                                                    {s.status}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {/* Custom Arrow */}
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                                            <MoreVertical size={14} />
                                                        </div>
                                                    </div>

                                                    {booking.notes && (
                                                        <div className="relative group/tooltip">
                                                            <AlertCircle size={18} className="text-amber-500 cursor-help" />
                                                            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg border border-border hidden group-hover/tooltip:block z-50">
                                                                {booking.notes}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
