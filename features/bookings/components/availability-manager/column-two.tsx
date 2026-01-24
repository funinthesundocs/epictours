"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Availability } from "@/features/availability/components/availability-list-table";
import { FileText, ChevronDown, Loader2 } from "lucide-react";
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

            const { data: ctData } = await supabase.from('customer_types').select('id, name');
            if (ctData) {
                const map: Record<string, string> = {};
                ctData.forEach((ct: any) => map[ct.id] = ct.name);
                setCustomerTypeMap(map);
            }

            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    id, status, pax_count, pax_breakdown, payment_status, 
                    amount_paid, total_amount, voucher_numbers, created_at,
                    customers(name, phone)
                `)
                .eq('availability_id', availability.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
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
                <Loader2 className="animate-spin text-zinc-500" size={24} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Section Header - matches booking-desk styling */}
            <div className="space-y-2">
                <label className="text-base font-medium text-zinc-400 flex items-center gap-2">
                    <FileText size={18} className="text-cyan-500" />
                    Bookings
                </label>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-3 flex-wrap text-sm">
                <span className="text-white font-medium">{totalBooked} booked</span>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-400">{remaining} available</span>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-500">{getPaxSummary()}</span>
            </div>

            {/* Manifest Link */}
            <button
                onClick={onManifestClick}
                className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm flex items-center gap-1"
            >
                + View Manifest
            </button>

            {/* Active Bookings Section */}
            <div className="space-y-2">
                <button
                    onClick={() => setActiveExpanded(!activeExpanded)}
                    className="w-full text-left flex items-center gap-2 text-zinc-400 text-sm font-medium hover:text-white transition-colors"
                >
                    <ChevronDown size={16} className={cn("transition-transform", !activeExpanded && "-rotate-90")} />
                    {activeBookings.length} active booking{activeBookings.length !== 1 ? 's' : ''}
                </button>

                {activeExpanded && (
                    <div className="space-y-2">
                        {activeBookings.length === 0 ? (
                            <div className="text-zinc-600 text-sm py-4">No active bookings</div>
                        ) : (
                            activeBookings.map((booking) => (
                                <button
                                    key={booking.id}
                                    onClick={() => onBookingClick(booking.id)}
                                    className="w-full p-3 bg-black/20 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all text-left"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-white font-medium text-sm">{booking.customer_name}</div>
                                            <div className="text-zinc-500 text-xs mt-0.5">
                                                {booking.pax_count} Pax
                                                {booking.voucher_numbers && ` • #${booking.voucher_numbers}`}
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-xs font-medium",
                                            booking.payment_status === 'paid'
                                                ? "bg-emerald-500/20 text-emerald-400"
                                                : booking.payment_status === 'partial'
                                                    ? "bg-amber-500/20 text-amber-400"
                                                    : "bg-zinc-800 text-zinc-400"
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

            {/* Cancelled Bookings Section */}
            {cancelledBookings.length > 0 && (
                <div className="space-y-2 opacity-60">
                    <button
                        onClick={() => setCancelledExpanded(!cancelledExpanded)}
                        className="w-full text-left flex items-center gap-2 text-zinc-500 text-sm font-medium hover:text-zinc-400 transition-colors"
                    >
                        <ChevronDown size={16} className={cn("transition-transform", !cancelledExpanded && "-rotate-90")} />
                        {cancelledBookings.length} cancelled
                    </button>

                    {cancelledExpanded && (
                        <div className="space-y-2">
                            {cancelledBookings.map((booking) => (
                                <button
                                    key={booking.id}
                                    onClick={() => onBookingClick(booking.id)}
                                    className="w-full p-3 bg-black/10 rounded-lg border border-white/5 text-left"
                                >
                                    <div className="text-zinc-500 text-sm line-through">{booking.customer_name}</div>
                                    <div className="text-zinc-600 text-xs">{booking.pax_count} Pax</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
