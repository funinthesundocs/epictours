"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-context";
import {
    BOOKING_COLUMNS
} from "./bookings-column-picker";

// Color options (70% opacity for soft effect)
const COLOR_MAP: Record<string, string> = {
    red: "bg-red-500/70",
    orange: "bg-orange-500/70",
    yellow: "bg-yellow-500/70",
    green: "bg-emerald-500/70",
    blue: "bg-blue-500/70",
    indigo: "bg-indigo-500/70",
    violet: "bg-violet-500/70",
};

interface CheckInStatus {
    id: string;
    status: string;
    color: string;
}

interface Booking {
    id: string;
    status: string;
    pax_count: number;
    pax_breakdown: any;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    start_date: string;
    start_time: string;
    transportation_route_id?: string;
    experience_short_code: string;
    option_values: any;
    payment_status: string;
    amount_paid: number;
    total_amount: number;
    voucher_numbers?: string;
    confirmation_number?: string;
    notes?: string;
    // Resolved pickup details
    pickup_details?: string;
    // Check-in status
    check_in_status_id?: string;
}

interface BookingsListTableProps {
    startDate: Date;
    endDate: Date;
    searchQuery?: string;
    onBookingClick?: (bookingId: string) => void;
    visibleColumns: string[];
}

// Format phone number to +1 (XXX) XXX-XXXX
function formatPhoneNumber(phone: string | null | undefined): string {
    if (!phone) return "-";

    // Strip all non-numeric characters
    const digits = phone.replace(/\D/g, '');

    // Handle different lengths
    let normalized = digits;

    // If 10 digits, assume US number without country code
    if (digits.length === 10) {
        normalized = '1' + digits;
    }
    // If 11 digits starting with 1, it's already a US number with country code
    else if (digits.length === 11 && digits.startsWith('1')) {
        normalized = digits;
    }
    // If we have exactly 11 digits, format it
    else if (digits.length === 11) {
        normalized = digits;
    }
    // Otherwise, return as-is with minimal formatting
    else if (digits.length < 10) {
        return phone; // Return original if too short
    }

    // Format: +1 (XXX) XXX-XXXX
    if (normalized.length >= 11) {
        const countryCode = normalized.slice(0, 1);
        const areaCode = normalized.slice(1, 4);
        const prefix = normalized.slice(4, 7);
        const line = normalized.slice(7, 11);
        return `+${countryCode} (${areaCode}) ${prefix}-${line}`;
    }

    return phone; // Fallback to original
}

export function BookingsListTable({ startDate, endDate, searchQuery = "", onBookingClick, visibleColumns }: BookingsListTableProps) {
    const { effectiveOrganizationId } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [customerTypeMap, setCustomerTypeMap] = useState<Record<string, string>>({});
    const [customFieldMap, setCustomFieldMap] = useState<Record<string, { label: string, type?: string, options?: any[] }>>({});
    const [checkInStatuses, setCheckInStatuses] = useState<CheckInStatus[]>([]);

    // Smart Pickup Resolution Maps
    const [hotelMap, setHotelMap] = useState<Record<string, { name: string, pickup_point_id: string }>>({});
    const [pickupPointMap, setPickupPointMap] = useState<Record<string, string>>({});
    const [scheduleStopMap, setScheduleStopMap] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!effectiveOrganizationId) return;

        const fetchReferenceData = async () => {
            // Fetch Customer Types for Pax Labels
            const { data: ctData } = await supabase.from('customer_types' as any).select('id, name').eq('organization_id', effectiveOrganizationId);
            if (ctData) {
                const map: Record<string, string> = {};
                ctData.forEach((ct: any) => map[ct.id] = ct.name);
                setCustomerTypeMap(map);
            }

            // Fetch Custom Field Defs (for smart_pickup detection)
            const { data: cfData } = await supabase.from('custom_field_definitions' as any).select('id, label, type, options').eq('organization_id', effectiveOrganizationId);
            if (cfData) {
                const map: Record<string, { label: string, type?: string, options?: any[] }> = {};
                cfData.forEach((cf: any) => map[cf.id] = { label: cf.label, type: cf.type, options: cf.options });
                setCustomFieldMap(map);
            }

            // Fetch Hotels (for smart_pickup resolution)
            const { data: hotelData } = await supabase.from('hotels').select('id, name, pickup_point_id').eq('organization_id', effectiveOrganizationId);
            if (hotelData) {
                const map: Record<string, { name: string, pickup_point_id: string }> = {};
                hotelData.forEach((h: any) => map[h.id] = { name: h.name, pickup_point_id: h.pickup_point_id });
                setHotelMap(map);
            }

            // Fetch Pickup Points
            const { data: ppData } = await supabase.from('pickup_points').select('id, name').eq('organization_id', effectiveOrganizationId);
            if (ppData) {
                const map: Record<string, string> = {};
                ppData.forEach((pp: any) => map[pp.id] = pp.name);
                setPickupPointMap(map);
            }

            // Fetch Schedule Stops (filter via schedules -> organization_id)
            const { data: ssData } = await supabase.from('schedule_stops').select('schedule_id, pickup_point_id, pickup_time');
            if (ssData) {
                const map: Record<string, string> = {};
                ssData.forEach((ss: any) => {
                    const key = `${ss.schedule_id}_${ss.pickup_point_id}`;
                    if (ss.pickup_time) {
                        const [h, m] = ss.pickup_time.split(':');
                        const hour = parseInt(h, 10);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const hour12 = hour % 12 || 12;
                        map[key] = `${hour12}:${m} ${ampm}`;
                    }
                });
                setScheduleStopMap(map);
            }

            // Fetch Check-In Statuses
            const { data: cisData } = await supabase.from('check_in_statuses').select('id, status, color').order('created_at', { ascending: true });
            if (cisData) {
                setCheckInStatuses(cisData as CheckInStatus[]);
            }
        };

        const fetchBookings = async () => {
            setIsLoading(true);
            try {
                await fetchReferenceData();

                const { data, error } = await supabase
                    .from('bookings' as any)
                    .select(`
                        id, status, pax_count, pax_breakdown, option_values, 
                        payment_status, amount_paid, total_amount, voucher_numbers, confirmation_number, notes, check_in_status_id,
                        customers!inner(
                            id,
                            users!inner(name, email, phone_number)
                        ),
                        availabilities!inner(
                            start_date, 
                            start_time, 
                            experience_id,
                            transportation_route_id,
                            experiences!inner(short_code)
                        )
                    `)
                    .eq('organization_id', effectiveOrganizationId)
                    .gte('availabilities.start_date', format(startDate, 'yyyy-MM-dd'))
                    .lte('availabilities.start_date', format(endDate, 'yyyy-MM-dd'))
                    .order('availabilities(start_date)', { ascending: true });

                if (error) throw error;

                if (data) {
                    const flatBookings = data.map((b: any) => ({
                        id: b.id,
                        status: b.status,
                        pax_count: b.pax_count,
                        pax_breakdown: b.pax_breakdown,
                        option_values: b.option_values || {},
                        payment_status: b.payment_status,
                        amount_paid: b.amount_paid || 0,
                        total_amount: b.total_amount || 0,
                        voucher_numbers: b.voucher_numbers || "",
                        confirmation_number: b.confirmation_number || "",
                        notes: b.notes || "",
                        check_in_status_id: b.check_in_status_id || null,
                        customer_name: b.customers?.users?.name || "Unknown",
                        customer_email: b.customers?.users?.email || "",
                        customer_phone: b.customers?.users?.phone_number || "",
                        start_date: b.availabilities?.start_date,
                        start_time: b.availabilities?.start_time,
                        transportation_route_id: b.availabilities?.transportation_route_id,
                        experience_short_code: b.availabilities?.experiences?.short_code || "EXP"
                    }));

                    setBookings(flatBookings);
                }
            } catch (err: any) {
                console.error("Error fetching booking list:", {
                    message: err.message,
                    code: err.code,
                    details: err.details,
                    hint: err.hint
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchBookings();
    }, [startDate, endDate, effectiveOrganizationId]);

    // Helper function to resolve pickup details from option_values
    const resolvePickupDetails = (booking: Booking): string => {
        const optionValues = booking.option_values || {};

        // Find the smart_pickup field in option_values
        for (const [fieldId, value] of Object.entries(optionValues)) {
            const fieldDef = customFieldMap[fieldId];
            if (fieldDef?.type === 'smart_pickup' && value) {
                const hotel = hotelMap[value as string];
                if (hotel) {
                    const pickupName = pickupPointMap[hotel.pickup_point_id] || hotel.name || "Unknown";
                    let timeStr = "";

                    if (booking.transportation_route_id && hotel.pickup_point_id) {
                        const key = `${booking.transportation_route_id}_${hotel.pickup_point_id}`;
                        if (scheduleStopMap[key]) {
                            timeStr = scheduleStopMap[key];
                        }
                    }

                    return timeStr ? `${pickupName} @ ${timeStr}` : pickupName;
                }
            }
        }

        // Fallback to start_time if no smart pickup found
        return booking.start_time ? booking.start_time.slice(0, 5) : "-";
    };

    if (isLoading) {
        return (
            <LoadingState className="h-64" />
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground bg-muted/50 border border-dashed border-border rounded-xl">
                No bookings found for this period.
            </div>
        );
    }

    // Helper to render cell content based on column key
    const renderCell = (booking: Booking, columnKey: string) => {
        const column = BOOKING_COLUMNS.find(c => c.key === columnKey);
        const alignClass = column?.align === "right" ? "text-right" : column?.align === "center" ? "text-center" : "";

        switch (columnKey) {
            case "confirmation_number":
                return <td key={columnKey} className={cn("px-6 py-4 text-foreground text-sm", alignClass)}>{booking.confirmation_number || "-"}</td>;

            case "experience_short_code":
                return <td key={columnKey} className={cn("px-6 py-4 text-foreground text-sm", alignClass)}>{booking.experience_short_code}</td>;

            case "start_date":
                return (
                    <td key={columnKey} className={cn("px-6 py-4 text-foreground text-sm", alignClass)}>
                        {(() => {
                            const [y, m, d] = booking.start_date.split('-');
                            return `${m}-${d}-${y}`;
                        })()}
                    </td>
                );

            case "start_time":
                return <td key={columnKey} className={cn("px-6 py-4 text-foreground text-sm", alignClass)}>{booking.start_time?.slice(0, 5) || "-"}</td>;

            case "status":
                return (
                    <td key={columnKey} className={cn("px-6 py-4 text-foreground text-sm", alignClass)}>
                        <span className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            booking.status === "confirmed" && "bg-emerald-500/20 text-emerald-400",
                            booking.status === "pending" && "bg-yellow-500/20 text-yellow-400",
                            booking.status === "cancelled" && "bg-red-500/20 text-red-400"
                        )}>
                            {booking.status}
                        </span>
                    </td>
                );

            case "check_in_status":
                return (
                    <td key={columnKey} className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <select
                            value={booking.check_in_status_id || ""}
                            onChange={async (e) => {
                                const newStatusId = e.target.value || null;
                                const { error } = await supabase
                                    .from('bookings')
                                    .update({ check_in_status_id: newStatusId })
                                    .eq('id', booking.id);
                                if (error) {
                                    toast.error("Failed to update check-in status");
                                } else {
                                    setBookings(prev => prev.map(b =>
                                        b.id === booking.id ? { ...b, check_in_status_id: newStatusId } : b
                                    ));
                                }
                            }}
                            className={cn(
                                "h-8 px-2 rounded text-xs font-medium text-white border-0 cursor-pointer min-w-[130px] [&>option]:bg-zinc-900 [&>option]:text-white",
                                booking.check_in_status_id
                                    ? COLOR_MAP[checkInStatuses.find(s => s.id === booking.check_in_status_id)?.color || "blue"]
                                    : "bg-muted text-muted-foreground"
                            )}
                        >
                            <option value="">Select Status</option>
                            {checkInStatuses.map(status => (
                                <option key={status.id} value={status.id}>{status.status}</option>
                            ))}
                        </select>
                    </td>
                );

            case "pickup_details":
                return <td key={columnKey} className={cn("px-6 py-4 text-foreground text-sm", alignClass)}>{resolvePickupDetails(booking)}</td>;

            case "customer_name":
                return <td key={columnKey} className={cn("px-6 py-4 text-foreground text-sm", alignClass)}>{booking.customer_name}</td>;

            case "pax_count":
                return <td key={columnKey} className={cn("px-6 py-4 text-foreground text-sm", alignClass)}>{booking.pax_count}</td>;

            case "customer_phone":
                return <td key={columnKey} className={cn("px-6 py-4 text-foreground text-sm", alignClass)}>{formatPhoneNumber(booking.customer_phone)}</td>;

            case "customer_email":
                return <td key={columnKey} className={cn("px-6 py-4 text-foreground text-sm max-w-[150px] truncate", alignClass)} title={booking.customer_email}>{booking.customer_email || "-"}</td>;

            case "voucher_numbers":
                return <td key={columnKey} className={cn("px-6 py-4 text-foreground text-sm max-w-[120px] truncate", alignClass)} title={booking.voucher_numbers}>{booking.voucher_numbers || "-"}</td>;

            case "notes":
                return <td key={columnKey} className={cn("px-6 py-4 text-foreground text-sm max-w-[150px] truncate", alignClass)} title={booking.notes}>{booking.notes || "-"}</td>;

            case "total_amount":
                return <td key={columnKey} className={cn("px-6 py-4 text-foreground text-sm", alignClass)}>${booking.total_amount.toFixed(2)}</td>;

            case "amount_paid":
                return <td key={columnKey} className={cn("px-6 py-4 text-foreground text-sm", alignClass)}>${booking.amount_paid.toFixed(2)}</td>;

            case "balance_due":
                return <td key={columnKey} className={cn("px-6 py-4 text-foreground text-sm", alignClass)}>${(booking.total_amount - booking.amount_paid).toFixed(2)}</td>;

            default:
                return <td key={columnKey} className="px-6 py-4 text-foreground text-sm">-</td>;
        }
    };

    return (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-muted/50 text-foreground font-bold uppercase text-xs tracking-wider border-b border-border">
                        <tr>
                            {visibleColumns.map(colKey => {
                                const column = BOOKING_COLUMNS.find(c => c.key === colKey);
                                const alignClass = column?.align === "right" ? "text-right" : column?.align === "center" ? "text-center" : "";
                                return (
                                    <th key={colKey} className={cn("px-6 py-4", alignClass)}>
                                        {column?.label || colKey}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-muted-foreground">
                        {bookings
                            .filter((booking) => {
                                if (!searchQuery.trim()) return true;
                                const q = searchQuery.toLowerCase();
                                const pickupDetails = resolvePickupDetails(booking).toLowerCase();
                                return (
                                    booking.customer_name.toLowerCase().includes(q) ||
                                    booking.customer_email.toLowerCase().includes(q) ||
                                    booking.customer_phone.toLowerCase().includes(q) ||
                                    booking.experience_short_code.toLowerCase().includes(q) ||
                                    booking.status.toLowerCase().includes(q) ||
                                    booking.id.toLowerCase().includes(q) ||
                                    (booking.voucher_numbers || "").toLowerCase().includes(q) ||
                                    (booking.confirmation_number || "").toLowerCase().includes(q) ||
                                    (booking.notes || "").toLowerCase().includes(q) ||
                                    booking.start_date.includes(q) ||
                                    pickupDetails.includes(q)
                                );
                            })
                            .map((booking) => (
                                <tr
                                    key={booking.id}
                                    className="hover:bg-muted transition-colors cursor-pointer group"
                                    onClick={() => onBookingClick?.(booking.id)}
                                >
                                    {visibleColumns.map(colKey => renderCell(booking, colKey))}
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
