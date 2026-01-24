"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
    option_values: any; // Raw JSON of selected options
    payment_status: string;
    amount_paid: number;
    total_amount: number;
}

interface BookingsListTableProps {
    startDate: Date;
    endDate: Date;
    onBookingClick?: (bookingId: string) => void;
}

export function BookingsListTable({ startDate, endDate, onBookingClick }: BookingsListTableProps) {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [dynamicColumns, setDynamicColumns] = useState<string[]>([]);

    const [customerTypeMap, setCustomerTypeMap] = useState<Record<string, string>>({});
    const [customFieldMap, setCustomFieldMap] = useState<Record<string, { label: string, type?: string, options?: any[] }>>({});

    // Smart Pickup Resolution Maps
    const [hotelMap, setHotelMap] = useState<Record<string, { name: string, pickup_point_id: string }>>({});
    const [pickupPointMap, setPickupPointMap] = useState<Record<string, string>>({}); // id -> name
    const [scheduleStopMap, setScheduleStopMap] = useState<Record<string, string>>({}); // "scheduleId_pickupPointId" -> time

    useEffect(() => {
        const fetchReferenceData = async () => {
            // Fetch Customer Types for Pax Labels
            const { data: ctData } = await supabase.from('customer_types').select('id, name');
            if (ctData) {
                const map: Record<string, string> = {};
                ctData.forEach((ct: any) => map[ct.id] = ct.name);
                setCustomerTypeMap(map);
            }

            // Fetch Custom Field Defs for Headers and Option Values (include type for smart_pickup detection)
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

            // Fetch Schedule Stops (links schedule_id + pickup_point_id to pickup_time)
            const { data: ssData } = await supabase.from('schedule_stops').select('schedule_id, pickup_point_id, pickup_time');
            if (ssData) {
                const map: Record<string, string> = {};
                ssData.forEach((ss: any) => {
                    const key = `${ss.schedule_id}_${ss.pickup_point_id}`;
                    // Format time as HH:MM AM/PM
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
                // Fetch reference data first (or in parallel)
                await fetchReferenceData();

                // Fetch bookings with joins
                // Note: deeply nested joins can be tricky in Supabase JS client depending on FK naming
                // We'll try the direct relation syntax assuming FKs are standard
                const { data, error } = await supabase
                    .from('bookings')
                    .select(`
                        id, status, pax_count, pax_breakdown, option_values, 
                        payment_status, amount_paid, total_amount,
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
                    // Flatten data structure
                    const flatBookings = data.map((b: any) => ({
                        id: b.id,
                        status: b.status,
                        pax_count: b.pax_count,
                        pax_breakdown: b.pax_breakdown,
                        option_values: b.option_values || {},
                        payment_status: b.payment_status,
                        amount_paid: b.amount_paid || 0,
                        total_amount: b.total_amount || 0,
                        customer_name: b.customers?.name || "Unknown",
                        customer_email: b.customers?.email || "",
                        customer_phone: b.customers?.phone || "",
                        start_date: b.availabilities?.start_date,
                        start_time: b.availabilities?.start_time,
                        transportation_route_id: b.availabilities?.transportation_route_id,
                        experience_short_code: b.availabilities?.experiences?.short_code || "EXP"
                    }));

                    setBookings(flatBookings);

                    // Calculate Dynamic Columns
                    // Scan all bookings, collect all keys from option_values that have non-null/non-empty values
                    const keys = new Set<string>();
                    flatBookings.forEach(booking => {
                        Object.entries(booking.option_values).forEach(([key, val]) => {
                            if (val !== null && val !== undefined && val !== "") {
                                keys.add(key);
                            }
                        });
                    });
                    setDynamicColumns(Array.from(keys));
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
                            <th className="px-6 py-4">Pickup Time</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Pax</th>
                            <th className="px-6 py-4">Phone</th>
                            <th className="px-6 py-4">Email</th>
                            {/* Dynamic Option Columns */}
                            {dynamicColumns.map(col => (
                                <th key={col} className="px-6 py-4 text-cyan-500/80">
                                    {customFieldMap[col]?.label || col}
                                </th>
                            ))}
                            <th className="px-6 py-4 text-right">Total</th>
                            <th className="px-6 py-4 text-right">Paid</th>
                            <th className="px-6 py-4 text-right">Due</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-zinc-300">
                        {bookings.map((booking) => (
                            <tr
                                key={booking.id}
                                className="hover:bg-cyan-500/5 transition-colors cursor-pointer group"
                                onClick={() => onBookingClick?.(booking.id)}
                            >
                                <td className="px-6 py-4 font-mono text-cyan-400 font-bold">{booking.experience_short_code}</td>
                                <td className="px-6 py-4">
                                    {(() => {
                                        const [y, m, d] = booking.start_date.split('-');
                                        return `${m}-${d}-${y}`;
                                    })()}
                                </td>
                                <td className="px-6 py-4 text-white font-medium">
                                    {booking.start_time ? booking.start_time.slice(0, 5) : "All Day"}
                                </td>
                                <td className="px-6 py-4 font-bold text-white">{booking.customer_name}</td>
                                <td className="px-6 py-4">
                                    {/* Parse Pax Breakdown */}
                                    {booking.pax_breakdown && Object.keys(booking.pax_breakdown).length > 0 ? (
                                        <div className="flex flex-col gap-0.5 text-xs text-zinc-400">
                                            {Object.entries(booking.pax_breakdown).map(([typeId, count]) => (
                                                <span key={typeId}>{count} {customerTypeMap[typeId] || "Pax"}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-zinc-500">{booking.pax_count} Pax</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-mono text-xs">{booking.customer_phone || "-"}</td>
                                <td className="px-6 py-4 text-xs text-zinc-400 max-w-[150px] truncate" title={booking.customer_email}>{booking.customer_email}</td>

                                {/* Dynamic Options */}
                                {dynamicColumns.map(col => {
                                    const val = booking.option_values[col];
                                    let displayVal = val || "-";

                                    const fieldDef = customFieldMap[col];

                                    // 1. Smart Pickup Logic
                                    if (fieldDef?.type === 'smart_pickup' && val) {
                                        // val is Hotel ID
                                        const hotel = hotelMap[val];
                                        if (hotel) {
                                            const pickupName = pickupPointMap[hotel.pickup_point_id] || "Unknown Stop";
                                            let timeStr = "";

                                            // Attempt to find time if we have a route
                                            if (booking.transportation_route_id && hotel.pickup_point_id) {
                                                const key = `${booking.transportation_route_id}_${hotel.pickup_point_id}`;
                                                if (scheduleStopMap[key]) {
                                                    timeStr = scheduleStopMap[key];
                                                }
                                            }

                                            displayVal = timeStr ? `${pickupName} @ ${timeStr}` : pickupName;
                                        }
                                    }
                                    // 2. Standard Options Logic
                                    else if (fieldDef?.options && Array.isArray(fieldDef.options)) {
                                        // Check both 'id' and 'value' properties, and potentially 'name' if it's a legacy structure
                                        const foundOption = fieldDef.options.find((opt: any) =>
                                            opt.id === val || opt.value === val
                                        );

                                        if (foundOption) {
                                            displayVal = foundOption.label || foundOption.name || displayVal;

                                            // Special handling for transport/time
                                            if (fieldDef.type === 'transport' && foundOption.time) {
                                                displayVal = `${displayVal} (${foundOption.time})`;
                                            }
                                        }
                                    }

                                    return (
                                        <td key={col} className="px-6 py-4 text-xs text-zinc-400">
                                            {typeof val === 'object' ? JSON.stringify(val) : displayVal}
                                        </td>
                                    );
                                })}

                                {/* Financials */}
                                <td className="px-6 py-4 text-right font-mono text-white font-bold">${booking.total_amount.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right font-mono text-emerald-400">${booking.amount_paid.toFixed(2)}</td>
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
