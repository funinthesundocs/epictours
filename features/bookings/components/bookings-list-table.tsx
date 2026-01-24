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

    useEffect(() => {
        const fetchBookings = async () => {
            setIsLoading(true);
            try {
                // Fetch bookings with joins
                // Note: deeply nested joins can be tricky in Supabase JS client depending on FK naming
                // We'll try the direct relation syntax assuming FKs are standard
                const { data, error } = await supabase
                    .from('bookings')
                    .select(`
                        id, status, pax_count, pax_breakdown, option_values, 
                        payment_status, amount_paid, total_amount,
                        customers!inner(name, email, phone),
                        availabilities!inner(start_date, start_time, experience_id),
                        availabilities!inner(experiences!inner(short_code))
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
                        experience_short_code: b.availabilities?.experiences?.short_code || "EXP"
                    }));

                    setBookings(flatBookings);

                    // Calculate Dynamic Columns
                    // Scan all bookings, collect all keys from option_values that have non-null/non-empty values
                    const keys = new Set<string>();
                    flatBookings.forEach(booking => {
                        Object.entries(booking.option_values).forEach(([key, val]) => {
                            if (val !== null && val !== undefined && val !== "") {
                                // Try to make label readable if possible, or just use key
                                // Ideally we would map ID to Label, but we might not have dynamic fields definitions loaded here.
                                // Use key for now. User said "Separate Column for Each *Used* Option"
                                keys.add(key);
                            }
                        });
                    });
                    setDynamicColumns(Array.from(keys));
                }
            } catch (err) {
                console.error("Error fetching booking list:", err);
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
                            <th className="px-6 py-4">Time</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Pax</th>
                            <th className="px-6 py-4">Phone</th>
                            <th className="px-6 py-4">Email</th>
                            {/* Dynamic Option Columns */}
                            {dynamicColumns.map(col => (
                                <th key={col} className="px-6 py-4 text-cyan-500/80">{col}</th>
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
                                <td className="px-6 py-4">{booking.start_date}</td>
                                <td className="px-6 py-4 text-white font-medium">
                                    {booking.start_time ? booking.start_time.slice(0, 5) : "All Day"}
                                </td>
                                <td className="px-6 py-4 font-bold text-white">{booking.customer_name}</td>
                                <td className="px-6 py-4">
                                    {/* Parse Pax Breakdown */}
                                    {booking.pax_breakdown && Object.keys(booking.pax_breakdown).length > 0 ? (
                                        <div className="flex flex-col gap-0.5 text-xs text-zinc-400">
                                            {Object.entries(booking.pax_breakdown).map(([type, count]) => (
                                                <span key={type}>{count} {type}</span> // Note: Type is likely UUID, might need map if we want pretty names
                                            ))}
                                            {/* Fallback to simple total if breakdown is messy IDs */}
                                            {/* For now, just showing raw breakdown or total if empty */}
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
                                    return (
                                        <td key={col} className="px-6 py-4 text-xs text-zinc-400">
                                            {typeof val === 'object' ? JSON.stringify(val) : (val || "-")}
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
