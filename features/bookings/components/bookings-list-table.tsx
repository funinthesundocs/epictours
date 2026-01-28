"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

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
    notes?: string;
    // Resolved pickup details
    pickup_details?: string;
}

interface BookingsListTableProps {
    startDate: Date;
    endDate: Date;
    searchQuery?: string;
    onBookingClick?: (bookingId: string) => void;
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

export function BookingsListTable({ startDate, endDate, searchQuery = "", onBookingClick }: BookingsListTableProps) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [customerTypeMap, setCustomerTypeMap] = useState<Record<string, string>>({});
    const [customFieldMap, setCustomFieldMap] = useState<Record<string, { label: string, type?: string, options?: any[] }>>({});

    // Smart Pickup Resolution Maps
    const [hotelMap, setHotelMap] = useState<Record<string, { name: string, pickup_point_id: string }>>({});
    const [pickupPointMap, setPickupPointMap] = useState<Record<string, string>>({});
    const [scheduleStopMap, setScheduleStopMap] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchReferenceData = async () => {
            // Fetch Customer Types for Pax Labels
            const { data: ctData } = await supabase.from('customer_types').select('id, name');
            if (ctData) {
                const map: Record<string, string> = {};
                ctData.forEach((ct: any) => map[ct.id] = ct.name);
                setCustomerTypeMap(map);
            }

            // Fetch Custom Field Defs (for smart_pickup detection)
            const { data: cfData } = await supabase.from('custom_field_definitions').select('id, label, type, options');
            if (cfData) {
                const map: Record<string, { label: string, type?: string, options?: any[] }> = {};
                cfData.forEach((cf: any) => map[cf.id] = { label: cf.label, type: cf.type, options: cf.options });
                setCustomFieldMap(map);
            }

            // Fetch Hotels (for smart_pickup resolution)
            const { data: hotelData } = await supabase.from('hotels').select('id, name, pickup_point_id');
            if (hotelData) {
                const map: Record<string, { name: string, pickup_point_id: string }> = {};
                hotelData.forEach((h: any) => map[h.id] = { name: h.name, pickup_point_id: h.pickup_point_id });
                setHotelMap(map);
            }

            // Fetch Pickup Points
            const { data: ppData } = await supabase.from('pickup_points').select('id, name');
            if (ppData) {
                const map: Record<string, string> = {};
                ppData.forEach((pp: any) => map[pp.id] = pp.name);
                setPickupPointMap(map);
            }

            // Fetch Schedule Stops
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
        };

        const fetchBookings = async () => {
            setIsLoading(true);
            try {
                await fetchReferenceData();

                const { data, error } = await supabase
                    .from('bookings')
                    .select(`
                        id, status, pax_count, pax_breakdown, option_values, 
                        payment_status, amount_paid, total_amount, voucher_numbers, notes,
                        customers!inner(name, email, phone),
                        availabilities!inner(
                            start_date, 
                            start_time, 
                            experience_id,
                            transportation_route_id,
                            experiences!inner(short_code)
                        )
                    `)
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
                        notes: b.notes || "",
                        customer_name: b.customers?.name || "Unknown",
                        customer_email: b.customers?.email || "",
                        customer_phone: b.customers?.phone || "",
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
    }, [startDate, endDate]);

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
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-cyan-500" size={32} />
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                No bookings found for this period.
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-white/10 overflow-hidden bg-[#0b1115]">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-white/5 text-zinc-400 font-bold uppercase text-xs tracking-wider border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4">Exp</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Pickup Details</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Pax</th>
                            <th className="px-6 py-4">Phone</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Voucher Numbers</th>
                            <th className="px-6 py-4">Booking Notes</th>
                            <th className="px-6 py-4 text-right">Total</th>
                            <th className="px-6 py-4 text-right">Paid</th>
                            <th className="px-6 py-4 text-right">Due</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-zinc-300">
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
                                    (booking.notes || "").toLowerCase().includes(q) ||
                                    booking.start_date.includes(q) ||
                                    pickupDetails.includes(q)
                                );
                            })
                            .map((booking) => (
                                <tr
                                    key={booking.id}
                                    className="hover:bg-cyan-500/5 transition-colors cursor-pointer group"
                                    onClick={() => onBookingClick?.(booking.id)}
                                >
                                    {/* Exp */}
                                    <td className="px-6 py-4 font-mono text-cyan-400 font-bold">
                                        {booking.experience_short_code}
                                    </td>

                                    {/* Date */}
                                    <td className="px-6 py-4">
                                        {(() => {
                                            const [y, m, d] = booking.start_date.split('-');
                                            return `${m}-${d}-${y}`;
                                        })()}
                                    </td>

                                    {/* Pickup Details */}
                                    <td className="px-6 py-4 text-white font-medium">
                                        {resolvePickupDetails(booking)}
                                    </td>

                                    {/* Customer */}
                                    <td className="px-6 py-4 font-bold text-white">
                                        {booking.customer_name}
                                    </td>

                                    {/* Pax - Just the total number */}
                                    <td className="px-6 py-4 text-center font-medium">
                                        {booking.pax_count}
                                    </td>

                                    {/* Phone */}
                                    <td className="px-6 py-4 font-mono text-xs">
                                        {formatPhoneNumber(booking.customer_phone)}
                                    </td>

                                    {/* Email */}
                                    <td className="px-6 py-4 text-xs text-zinc-400 max-w-[150px] truncate" title={booking.customer_email}>
                                        {booking.customer_email || "-"}
                                    </td>

                                    {/* Voucher Numbers */}
                                    <td className="px-6 py-4 text-xs text-zinc-400 max-w-[120px] truncate" title={booking.voucher_numbers}>
                                        {booking.voucher_numbers || "-"}
                                    </td>

                                    {/* Booking Notes */}
                                    <td className="px-6 py-4 text-xs text-zinc-400 max-w-[150px] truncate" title={booking.notes}>
                                        {booking.notes || "-"}
                                    </td>

                                    {/* Total */}
                                    <td className="px-6 py-4 text-right font-mono text-white font-bold">
                                        ${booking.total_amount.toFixed(2)}
                                    </td>

                                    {/* Paid */}
                                    <td className="px-6 py-4 text-right font-mono text-emerald-400">
                                        ${booking.amount_paid.toFixed(2)}
                                    </td>

                                    {/* Due */}
                                    <td className={cn(
                                        "px-6 py-4 text-right font-mono font-bold",
                                        (booking.total_amount - booking.amount_paid) > 0 ? "text-red-400" : "text-zinc-500"
                                    )}>
                                        ${(booking.total_amount - booking.amount_paid).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
