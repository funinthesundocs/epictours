"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Availability } from "@/features/availability/components/availability-list-table";
import { FileText, ChevronDown, Loader2, Search, Ticket } from "lucide-react";
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
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchBookings = async () => {
            setIsLoading(true);

            const { data: ctData } = await supabase.from('customer_types' as any).select('id, name');
            if (ctData) {
                const map: Record<string, string> = {};
                ctData.forEach((ct: any) => map[ct.id] = ct.name);
                setCustomerTypeMap(map);
            }

            const { data, error } = await supabase
                .from('bookings' as any)
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

    // Filter by search query
    const filteredActive = activeBookings.filter(b =>
        b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.voucher_numbers && b.voucher_numbers.includes(searchQuery))
    );

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
        <div className="flex flex-col h-full bg-transparent animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
            {/* Fixed Header */}
            <div className="shrink-0 flex flex-col gap-1.5 px-6 py-4 bg-white/5 backdrop-blur-md border-b border-white/5 sticky top-0 z-10 w-full">
                <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-2 shrink-0">
                        <Ticket size={16} className="text-cyan-400" />
                        <span className="text-sm font-bold text-white uppercase tracking-wider">Bookings ({bookings.length})</span>
                    </div>

                    {/* Search & Manifest Controls */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <div className="relative w-full max-w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search passengers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-md pl-9 pr-3 h-8 text-xs text-white focus:outline-none focus:border-cyan-500/50 placeholder:text-zinc-600 transition-all hover:border-white/20"
                            />
                        </div>
                        <button
                            onClick={onManifestClick}
                            className="h-8 px-3 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-md text-xs font-medium text-zinc-300 hover:text-white transition-colors whitespace-nowrap flex items-center gap-2"
                        >
                            <FileText size={14} />
                            Manifest
                        </button>
                    </div>
                </div>
            </div>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                {/* Stats Header */}
                <div className="px-6 py-3 border-b border-white/5 bg-black/40 backdrop-blur-sm sticky top-0 z-10 w-full">
                    <div className="flex items-center gap-3 flex-wrap text-sm text-zinc-400">
                        <span className="text-zinc-300 font-medium">{totalBooked} booked</span>
                        <span className="text-zinc-600">|</span>
                        <span className="text-zinc-400">{remaining} available</span>
                        <span className="text-zinc-600">|</span>
                        <span className="text-zinc-500">{getPaxSummary()}</span>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Active Bookings Section */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setActiveExpanded(!activeExpanded)}
                            className="w-full text-left flex items-center gap-2 text-zinc-400 text-sm font-medium hover:text-white transition-colors"
                        >
                            <ChevronDown size={16} className={cn("transition-transform", !activeExpanded && "-rotate-90")} />
                            {filteredActive.length} active booking{filteredActive.length !== 1 ? 's' : ''}
                        </button>

                        {activeExpanded && (
                            <div className="space-y-2">
                                {filteredActive.length === 0 ? (
                                    <div className="text-zinc-600 text-sm py-4">No active bookings</div>
                                ) : (
                                    filteredActive.map((booking) => (
                                        <button
                                            key={booking.id}
                                            onClick={() => onBookingClick(booking.id)}
                                            className="w-full p-3 bg-zinc-900/80 rounded-lg border border-white/10 hover:border-cyan-500/30 transition-all text-left"
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
                                            className="w-full p-3 bg-zinc-900/40 rounded-lg border border-white/5 text-left"
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
            </div>
        </div>
    );
}
