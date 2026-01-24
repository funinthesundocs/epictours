"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Availability } from "@/features/availability/components/availability-list-table";
import { FileText, ChevronDown, ChevronRight, UserCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingItem {
    id: string;
    status: string;
    pax_count: number;
    pax_breakdown: any;
    customer_name: string;
    customer_phone: string;
    payment_status: string;
    amount_paid: number;
    total_amount: number;
    voucher_numbers?: string;
    created_at: string;
}

interface ColumnTwoProps {
    availability: Availability;
    onBookingClick: (bookingId: string) => void;
    onManifestClick: () => void;
}

export function ColumnTwo({ availability, onBookingClick, onManifestClick }: ColumnTwoProps) {
    const [bookings, setBookings] = useState<BookingItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeExpanded, setActiveExpanded] = useState(true);
    const [cancelledExpanded, setCancelledExpanded] = useState(false);
    const [customerTypeMap, setCustomerTypeMap] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchBookings = async () => {
            setIsLoading(true);

            // Fetch customer types for pax labels
            const { data: ctData } = await supabase.from('customer_types').select('id, name');
            if (ctData) {
                const map: Record<string, string> = {};
                ctData.forEach((ct: any) => map[ct.id] = ct.name);
                setCustomerTypeMap(map);
            }

            // Fetch bookings for this availability
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id, status, pax_count, pax_breakdown, payment_status, 
                    amount_paid, total_amount, voucher_numbers, created_at,
                    customers(name, phone)
                `)
                .eq('availability_id', availability.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching bookings:", error);
            } else if (data) {
                const flat = data.map((b: any) => ({
                    id: b.id,
                    status: b.status,
                    pax_count: b.pax_count,
                    pax_breakdown: b.pax_breakdown,
                    customer_name: b.customers?.name || "Unknown",
                    customer_phone: b.customers?.phone || "",
                    payment_status: b.payment_status || "unpaid",
                    amount_paid: b.amount_paid || 0,
                    total_amount: b.total_amount || 0,
                    voucher_numbers: b.voucher_numbers || "",
                    created_at: b.created_at
                }));
                setBookings(flat);
            }

            setIsLoading(false);
        };

        fetchBookings();
    }, [availability.id]);

    const activeBookings = bookings.filter(b => b.status !== 'cancelled');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

    const totalBooked = activeBookings.reduce((sum, b) => sum + b.pax_count, 0);
    const remaining = Math.max(0, (availability.max_capacity || 0) - totalBooked);

    // Format pax breakdown summary
    const getPaxSummary = () => {
        const summary: Record<string, number> = {};
        activeBookings.forEach(b => {
            if (b.pax_breakdown) {
                Object.entries(b.pax_breakdown).forEach(([typeId, count]) => {
                    summary[typeId] = (summary[typeId] || 0) + (count as number);
                });
            }
        });
        return Object.entries(summary).map(([typeId, count]) =>
            `${count} ${customerTypeMap[typeId] || 'Pax'}`
        ).join(', ') || `${totalBooked} Pax`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-cyan-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-4">
            {/* Header Stats */}
            <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-sm font-bold">
                    {totalBooked} booked
                </span>
                <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold">
                    {remaining} available
                </span>
            </div>

            {/* Pax Summary */}
            <div className="text-zinc-400 text-sm">
                {getPaxSummary()}
            </div>

            {/* Manifest Link */}
            <button
                onClick={onManifestClick}
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
            >
                <FileText size={16} />
                <span>View Manifest</span>
            </button>

            {/* Active Bookings Accordion */}
            <div className="border border-white/10 rounded-lg overflow-hidden">
                <button
                    onClick={() => setActiveExpanded(!activeExpanded)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <span className="text-white font-medium flex items-center gap-2">
                        {activeExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        {activeBookings.length} active booking{activeBookings.length !== 1 ? 's' : ''}
                    </span>
                </button>

                {activeExpanded && (
                    <div className="divide-y divide-white/5">
                        {activeBookings.length === 0 ? (
                            <div className="px-4 py-6 text-center text-zinc-500 text-sm">
                                No active bookings yet
                            </div>
                        ) : (
                            activeBookings.map((booking) => (
                                <button
                                    key={booking.id}
                                    onClick={() => onBookingClick(booking.id)}
                                    className="w-full px-4 py-3 text-left hover:bg-cyan-500/5 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <UserCircle size={32} className="text-zinc-600 flex-shrink-0" />
                                            <div>
                                                <div className="text-white font-bold">{booking.customer_name}</div>
                                                <div className="text-zinc-500 text-xs">
                                                    {booking.pax_count} Pax • {booking.customer_phone || 'No phone'}
                                                </div>
                                                {booking.voucher_numbers && (
                                                    <div className="text-zinc-500 text-xs mt-0.5">
                                                        #{booking.voucher_numbers}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "px-2 py-1 rounded text-xs font-bold flex-shrink-0",
                                            booking.payment_status === 'paid'
                                                ? "bg-emerald-500/20 text-emerald-400"
                                                : booking.payment_status === 'partial'
                                                    ? "bg-amber-500/20 text-amber-400"
                                                    : "bg-red-500/20 text-red-400"
                                        )}>
                                            {booking.payment_status === 'paid' ? 'Paid' :
                                                booking.payment_status === 'partial' ? 'Partial' : 'Unpaid'}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Cancelled Bookings Accordion */}
            {cancelledBookings.length > 0 && (
                <div className="border border-white/10 rounded-lg overflow-hidden opacity-60">
                    <button
                        onClick={() => setCancelledExpanded(!cancelledExpanded)}
                        className="w-full px-4 py-3 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <span className="text-zinc-400 font-medium flex items-center gap-2">
                            {cancelledExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            {cancelledBookings.length} cancelled or rebooked
                        </span>
                    </button>

                    {cancelledExpanded && (
                        <div className="divide-y divide-white/5">
                            {cancelledBookings.map((booking) => (
                                <button
                                    key={booking.id}
                                    onClick={() => onBookingClick(booking.id)}
                                    className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <UserCircle size={24} className="text-zinc-700" />
                                        <div>
                                            <div className="text-zinc-400 line-through">{booking.customer_name}</div>
                                            <div className="text-zinc-600 text-xs">{booking.pax_count} Pax</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
