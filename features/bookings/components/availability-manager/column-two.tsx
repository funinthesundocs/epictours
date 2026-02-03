"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Availability } from "@/features/availability/components/availability-list-table";
import { FileText, ChevronDown, Search, Ticket } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-context";

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
    check_in_status_id?: string | null;
}

interface ColumnTwoProps {
    availability: Availability;
    onBookingClick: (bookingId: string) => void;
    onManifestClick: () => void;
}

export function ColumnTwo({ availability, onBookingClick, onManifestClick }: ColumnTwoProps) {
    const { effectiveOrganizationId } = useAuth();
    const [bookings, setBookings] = useState<BookingItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeExpanded, setActiveExpanded] = useState(true);
    const [cancelledExpanded, setCancelledExpanded] = useState(false);
    const [customerTypeMap, setCustomerTypeMap] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [checkInStatuses, setCheckInStatuses] = useState<CheckInStatus[]>([]);

    useEffect(() => {
        if (!effectiveOrganizationId) return;

        const fetchBookings = async () => {
            setIsLoading(true);

            const { data: ctData } = await supabase.from('customer_types' as any).select('id, name').eq('organization_id', effectiveOrganizationId);
            if (ctData) {
                const map: Record<string, string> = {};
                ctData.forEach((ct: any) => map[ct.id] = ct.name);
                setCustomerTypeMap(map);
            }

            // Fetch check-in statuses
            const { data: cisData } = await supabase.from('check_in_statuses').select('id, status, color').order('created_at', { ascending: true });
            if (cisData) setCheckInStatuses(cisData as CheckInStatus[]);

            const { data, error } = await supabase
                .from('bookings' as any)
                .select(`
                    id, status, pax_count, pax_breakdown, payment_status, 
                    amount_paid, total_amount, voucher_numbers, confirmation_number, notes, created_at, check_in_status_id,
                    customers(id, user:users(name, email, phone_number))
                `)
                .eq('availability_id', availability.id)
                .order('created_at', { ascending: false });

            if (!error && data) {
                const flat = data.map((b: any) => ({
                    id: b.id,
                    status: b.status,
                    pax_count: b.pax_count,
                    pax_breakdown: b.pax_breakdown,
                    customer_name: b.customers?.user?.name || "Unknown",
                    customer_email: b.customers?.user?.email || "",
                    customer_phone: b.customers?.user?.phone_number || "",
                    payment_status: b.payment_status || "unpaid",
                    amount_paid: b.amount_paid || 0,
                    total_amount: b.total_amount || 0,
                    voucher_numbers: b.voucher_numbers || "",
                    confirmation_number: b.confirmation_number || "",
                    notes: b.notes || "",
                    created_at: b.created_at,
                    check_in_status_id: b.check_in_status_id || null
                }));
                setBookings(flat);
            }

            setIsLoading(false);
        };

        fetchBookings();
    }, [availability.id, effectiveOrganizationId]);

    const handleCheckInChange = async (bookingId: string, statusId: string | null) => {
        const { error } = await supabase.from('bookings').update({ check_in_status_id: statusId }).eq('id', bookingId);
        if (error) {
            toast.error("Failed to update check-in status");
        } else {
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, check_in_status_id: statusId } : b));
        }
    };

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
            <LoadingState className="h-64" />
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
                                            <div className="flex items-center gap-4">
                                                {/* Section 1: Customer Info */}
                                                <div className="basis-1/4 min-w-0">
                                                    <div className="text-foreground font-medium text-base">{booking.customer_name}</div>
                                                    <div className="text-foreground text-base mt-0.5">
                                                        {booking.confirmation_number && (
                                                            <span className="text-primary font-mono mr-2">{booking.confirmation_number}</span>
                                                        )}
                                                        {booking.voucher_numbers && `#${booking.voucher_numbers}`}
                                                    </div>
                                                </div>

                                                {/* Vertical Divider */}
                                                <div className="w-px h-10 bg-border/50" />

                                                {/* Section 2: Contact & Notes */}
                                                <div className="basis-1/4 min-w-0 text-foreground text-base space-y-0.5">
                                                    {booking.customer_phone && <div>{booking.customer_phone}</div>}
                                                    {booking.customer_email && <div className="truncate">{booking.customer_email}</div>}
                                                    {booking.notes && <div className="italic truncate">{booking.notes}</div>}
                                                </div>

                                                {/* Vertical Divider */}
                                                <div className="w-px h-10 bg-border/50" />

                                                {/* Section 3: Payment Amounts */}
                                                <div className="basis-1/4 flex items-center justify-center">
                                                    <div className="text-foreground text-base space-y-0.5">
                                                        <div>Paid: <span className="font-medium text-emerald-500">${booking.amount_paid.toFixed(2)}</span></div>
                                                        <div>Due: <span className={cn("font-medium", booking.total_amount > booking.amount_paid ? "text-red-500" : "text-emerald-500")}>${(booking.total_amount - booking.amount_paid).toFixed(2)}</span></div>
                                                    </div>
                                                </div>

                                                {/* Vertical Divider */}
                                                <div className="w-px h-10 bg-border/50" />

                                                {/* Section 4: Pax & Check-In Status */}
                                                <div className="basis-1/4 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                                                    <div className="text-foreground text-base space-y-1">
                                                        <div className="font-medium">{booking.pax_count} Pax</div>
                                                        <select
                                                            value={booking.check_in_status_id || ""}
                                                            onChange={(e) => handleCheckInChange(booking.id, e.target.value || null)}
                                                            className={cn(
                                                                "w-full h-7 px-2 rounded text-xs font-medium text-white border-0 cursor-pointer [&>option]:bg-zinc-900 [&>option]:text-white",
                                                                booking.check_in_status_id
                                                                    ? COLOR_MAP[checkInStatuses.find(s => s.id === booking.check_in_status_id)?.color || "blue"]
                                                                    : "bg-muted text-muted-foreground"
                                                            )}
                                                        >
                                                            <option value="">Select</option>
                                                            {checkInStatuses.map(status => (
                                                                <option key={status.id} value={status.id}>{status.status}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
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
