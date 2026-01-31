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
    customer_email: string;
    customer_phone: string;
    payment_status: string;
    amount_paid: number;
    total_amount: number;
    voucher_numbers?: string;
    confirmation_number?: string;
    notes?: string;
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
                    amount_paid, total_amount, voucher_numbers, confirmation_number, notes, created_at,
                    customers(name, email, phone)
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
                    customer_email: b.customers?.email || "",
                    customer_phone: b.customers?.phone || "",
                    payment_status: b.payment_status || "unpaid",
                    amount_paid: b.amount_paid || 0,
                    total_amount: b.total_amount || 0,
                    voucher_numbers: b.voucher_numbers || "",
                    confirmation_number: b.confirmation_number || "",
                    notes: b.notes || "",
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

    // Filter by search query (includes confirmation number)
    const filteredActive = activeBookings.filter(b =>
        b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.voucher_numbers && b.voucher_numbers.includes(searchQuery)) ||
        (b.confirmation_number && b.confirmation_number.toLowerCase().includes(searchQuery.toLowerCase()))
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
                <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-transparent animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
            {/* Fixed Header */}
            <div className="shrink-0 flex flex-col gap-1.5 px-6 py-4 bg-background/95 backdrop-blur border-b border-border sticky top-0 z-10 w-full supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-2 shrink-0">
                        <Ticket size={16} className="text-primary" />
                        <span className="text-base font-bold text-foreground uppercase tracking-wider">Bookings ({bookings.length})</span>
                    </div>

                    {/* Search & Manifest Controls */}
                    <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                        <div className="relative w-full max-w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search passengers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-muted/50 border border-border rounded-md pl-9 pr-3 h-8 text-xs text-foreground focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground transition-all hover:border-sidebar-accent"
                            />
                        </div>
                        <button
                            onClick={onManifestClick}
                            className="h-8 px-3 bg-muted hover:bg-muted/80 border border-border rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap flex items-center gap-2"
                        >
                            <FileText size={16} />
                            Manifest
                        </button>
                    </div>
                </div>
            </div>
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                {/* Stats Header */}
                <div className="px-6 py-3 border-b border-border bg-muted/30 backdrop-blur-sm sticky top-0 z-10 w-full">
                    <div className="flex items-center gap-3 flex-wrap text-base text-muted-foreground">
                        <span className="text-foreground font-medium">{totalBooked} booked</span>
                        <span className="text-muted-foreground/50">|</span>
                        <span className="text-muted-foreground">{remaining} available</span>
                        <span className="text-muted-foreground/50">|</span>
                        <span className="text-muted-foreground">{getPaxSummary()}</span>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Active Bookings Section */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setActiveExpanded(!activeExpanded)}
                            className="w-full text-left flex items-center gap-2 text-muted-foreground text-base font-medium hover:text-foreground transition-colors"
                        >
                            <ChevronDown size={18} className={cn("transition-transform", !activeExpanded && "-rotate-90")} />
                            {filteredActive.length} active booking{filteredActive.length !== 1 ? 's' : ''}
                        </button>

                        {activeExpanded && (
                            <div className="space-y-2">
                                {filteredActive.length === 0 ? (
                                    <div className="text-muted-foreground text-sm py-4">No active bookings</div>
                                ) : (
                                    filteredActive.map((booking) => (
                                        <button
                                            key={booking.id}
                                            onClick={() => onBookingClick(booking.id)}
                                            className="w-full p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-all text-left shadow-sm"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-foreground font-medium text-base">{booking.customer_name}</div>
                                                    <div className="text-muted-foreground text-sm mt-0.5">
                                                        {booking.confirmation_number && (
                                                            <span className="text-primary font-mono mr-2">{booking.confirmation_number}</span>
                                                        )}
                                                        {booking.pax_count} Pax
                                                        {booking.voucher_numbers && ` • #${booking.voucher_numbers}`}
                                                    </div>
                                                    {/* Contact Info */}
                                                    {(booking.customer_email || booking.customer_phone) && (
                                                        <div className="text-muted-foreground text-xs mt-1 space-y-0.5">
                                                            {booking.customer_phone && (
                                                                <div>{booking.customer_phone}</div>
                                                            )}
                                                            {booking.customer_email && (
                                                                <div className="truncate">{booking.customer_email}</div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {/* Notes */}
                                                    {booking.notes && (
                                                        <div className="text-muted-foreground text-xs mt-1 italic line-clamp-2">
                                                            {booking.notes}
                                                        </div>
                                                    )}
                                                    {/* Balance Due */}
                                                    {booking.total_amount > booking.amount_paid && (
                                                        <div className="text-amber-500 text-xs mt-1 font-medium">
                                                            Due: ${(booking.total_amount - booking.amount_paid).toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-sm font-medium shrink-0",
                                                    booking.payment_status === 'paid'
                                                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                        : booking.payment_status === 'partial'
                                                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                                            : "bg-muted text-muted-foreground"
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
                                className="w-full text-left flex items-center gap-2 text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
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
                                            className="w-full p-3 bg-muted/30 rounded-lg border border-border text-left"
                                        >
                                            <div className="text-muted-foreground text-sm line-through">{booking.customer_name}</div>
                                            <div className="text-muted-foreground/70 text-xs">{booking.pax_count} Pax</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
