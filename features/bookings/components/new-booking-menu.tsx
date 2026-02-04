"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Availability } from "@/features/availability/components/availability-list-table";
import { useAuth } from "@/features/auth/auth-context";
import { Loader2, CalendarDays, Clock, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { Combobox } from "@/components/ui/combobox";
import { useSidebar } from "@/components/shell/sidebar-context";
import { LoadingState } from "@/components/ui/loading-state";

interface NewBookingMenuProps {
    children: React.ReactNode;
    onSelectAvailability: (availability: Availability) => void;
    defaultExperienceId?: string;
}

export function NewBookingMenu({ children, onSelectAvailability, defaultExperienceId }: NewBookingMenuProps) {
    const { zoom } = useSidebar();
    const { effectiveOrganizationId } = useAuth();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [availabilities, setAvailabilities] = useState<Availability[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedExperienceId(defaultExperienceId || "");
            setAvailabilities([]);
            setDate(new Date());
        } else if (isOpen && defaultExperienceId && !selectedExperienceId) {
            // If opening and we have a default but no current selection, set it
            setSelectedExperienceId(defaultExperienceId);
        }
    }, [isOpen, defaultExperienceId]);

    // Experience Filter State
    const [experiences, setExperiences] = useState<{ id: string, name: string }[]>([]);
    const [selectedExperienceId, setSelectedExperienceId] = useState<string>(defaultExperienceId || "");
    const [isInitializing, setIsInitializing] = useState(true);

    // Month view state for highlighting
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [availableIsoDates, setAvailableIsoDates] = useState<Set<string>>(new Set());

    // Fetch Experiences on Mount
    useEffect(() => {
        if (!isOpen || !effectiveOrganizationId) {
            setIsInitializing(true);
            return;
        }
        const fetchExperiences = async () => {
            setIsInitializing(true);
            const { data } = await supabase
                .from("experiences" as any)
                .select("id, name")
                .eq("organization_id", effectiveOrganizationId)
                .order("name");
            if (data) setExperiences(data as unknown as { id: string; name: string }[]);
            setIsInitializing(false);
        };
        fetchExperiences();
    }, [isOpen, effectiveOrganizationId]);

    // Fetch available dates for the current month view
    useEffect(() => {
        if (!isOpen || !selectedExperienceId || !effectiveOrganizationId) {
            setAvailableIsoDates(new Set());
            return;
        }

        const fetchMonthAvailability = async () => {
            const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

            let query = supabase
                .from("availabilities" as any)
                .select("start_date")
                .eq("organization_id", effectiveOrganizationId)
                .gte("start_date", format(startOfMonth, "yyyy-MM-dd"))
                .lte("start_date", format(endOfMonth, "yyyy-MM-dd"))
                .eq("experience_id", selectedExperienceId);

            const { data, error } = await query;

            if (!error && data) {
                const dateSet = new Set(data.map((d: any) => d.start_date));
                setAvailableIsoDates(dateSet);
            }
        };

        fetchMonthAvailability();
    }, [currentMonth, isOpen, selectedExperienceId, effectiveOrganizationId]);

    // Fetch Availabilities when selected date changes
    useEffect(() => {
        if (!date || !isOpen || !selectedExperienceId || !effectiveOrganizationId) {
            setAvailabilities([]);
            return;
        }

        const fetchAvailabilities = async () => {
            setIsLoading(true);
            const dateStr = format(date, "yyyy-MM-dd");

            let query = supabase
                .from("availabilities" as any)
                .select(`
                    *,
                    bookings:bookings(pax_count, status),
                    experience:experiences(name, short_code),
                    assignments:availability_assignments(transportation_route_id)
                `)
                .eq("organization_id", effectiveOrganizationId)
                .eq("start_date", dateStr)
                .eq("experience_id", selectedExperienceId)
                .order("start_time");

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching availabilities:", error);
            } else {
                const processed = (data || []).map((item: any) => {
                    const validBookings = (item.bookings || []).filter((b: any) => b.status?.toLowerCase() !== 'cancelled');
                    const totalPax = validBookings.reduce((sum: number, b: any) => sum + Number(b.pax_count || 0), 0);

                    // Extract transportation_route_id from first assignment (for smart pickup)
                    const primaryAssignment = item.assignments?.[0] || null;

                    const result = {
                        ...item,
                        experience_name: item.experience?.name,
                        experience_short_code: item.experience?.short_code,
                        booked_count: totalPax,
                        transportation_route_id: primaryAssignment?.transportation_route_id || item.transportation_route_id,
                        // Ensure these fields are explicitly included for BookingDesk compatibility
                        booking_option_schedule_id: item.booking_option_schedule_id,
                        pricing_schedule_id: item.pricing_schedule_id,
                    };
                    console.log("DEBUG NewBookingMenu: Processed availability:", {
                        id: result.id,
                        booking_option_schedule_id: result.booking_option_schedule_id,
                        pricing_schedule_id: result.pricing_schedule_id,
                        transportation_route_id: result.transportation_route_id
                    });
                    return result;
                });
                setAvailabilities(processed);
            }
            setIsLoading(false);
        };

        fetchAvailabilities();
    }, [date, isOpen, selectedExperienceId, effectiveOrganizationId]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent
                showCloseButton={false}
                className="z-[9999] w-[350px] p-0 bg-popover border-border gap-0 overflow-hidden shadow-2xl"
                style={{ zoom: zoom / 100 }}
            >
                <DialogTitle className="sr-only">New Booking</DialogTitle>
                <DialogDescription className="sr-only">Select a date and availability to create a new booking.</DialogDescription>

                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-[60]"
                >
                    <X size={16} />
                </button>

                {isInitializing ? (
                    <LoadingState className="h-[300px]" />
                ) : (
                    <div className="flex flex-col divide-y divide-border">

                        {/* Experience Selector */}
                        <div className="p-4 border-b border-border bg-muted/30">

                            <div className="w-full max-w-[280px]">
                                <Combobox
                                    value={selectedExperienceId}
                                    onChange={setSelectedExperienceId}
                                    options={experiences.map(e => ({ value: e.id, label: e.name }))}
                                    placeholder="Select Experience..."
                                    inputClassName="placeholder:text-muted-foreground"
                                />
                            </div>
                        </div>

                        {/* Calendar Section */}
                        <div className="p-1 flex justify-center relative">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                onMonthChange={setCurrentMonth}
                                disabled={(date) => !selectedExperienceId || date < new Date(new Date().setHours(0, 0, 0, 0))}
                                modifiers={{
                                    hasAvailability: (date) => availableIsoDates.has(format(date, "yyyy-MM-dd"))
                                }}
                                modifiersClassNames={{
                                    hasAvailability: "bg-primary/20 !text-primary !font-bold rounded-md border-2 border-background"
                                }}
                                className={cn(
                                    "rounded-md border-0 transition-opacity duration-200",
                                    !selectedExperienceId && "opacity-20 pointer-events-none filter blur-[1px]"
                                )}
                                classNames={{
                                    selected: "border-2 border-primary text-primary bg-transparent hover:text-primary/80 focus:text-primary shadow-none font-bold rounded-md",
                                    today: "bg-muted text-foreground rounded-md",
                                }}
                            />

                            {/* Prompt Overlay */}
                            {!selectedExperienceId && (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <div className="text-sm font-bold text-muted-foreground bg-muted/90 px-4 py-2 rounded-full border border-border shadow-xl backdrop-blur-sm">
                                        Please select an experience
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Availabilities List Section */}
                        {selectedExperienceId && (
                            <div className="w-full max-h-[300px] flex flex-col">
                                <div className="p-4 border-b border-border bg-muted/50">
                                    <h3 className="font-bold text-foreground flex items-center gap-2">
                                        <CalendarDays size={16} className="text-primary" />
                                        {date ? format(date, "MMMM d, yyyy") : "Select a Date"}
                                    </h3>
                                </div>

                                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar min-h-[200px]">
                                    {isLoading ? (
                                        <LoadingState className="h-full" />
                                    ) : availabilities.length > 0 ? (
                                        availabilities.map((avail) => (
                                            <button
                                                key={avail.id}
                                                onClick={() => {
                                                    onSelectAvailability(avail);
                                                    setIsOpen(false);
                                                }}
                                                className="w-full text-left p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted hover:border-muted-foreground/30 transition-all group group/item"
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-sm text-foreground group-hover/item:text-primary transition-colors">
                                                        {avail.experience_name || "Unknown Experience"}
                                                    </span>
                                                    {avail.experience_short_code && (
                                                        <span className="text-[10px] font-black uppercase tracking-wider bg-background text-muted-foreground px-1.5 py-0.5 rounded">
                                                            {avail.experience_short_code}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={12} className="text-muted-foreground group-hover/item:text-primary/70" />
                                                        <span>{avail.start_time ? format(new Date(`2000-01-01T${avail.start_time}`), "h:mm a") : "All Day"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Users size={12} className="text-muted-foreground group-hover/item:text-primary/70" />
                                                        <span className={cn((avail.booked_count || 0) > 0 && "text-primary font-medium")}>
                                                            {Math.max(0, avail.max_capacity - (avail.booked_count || 0))} / {avail.max_capacity} pax
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                                            <CalendarDays size={32} className="mb-2 opacity-20" />
                                            <p className="text-sm">No availabilities scheduled for this date.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Empty State Prompt if no experience selected */}
                        {!selectedExperienceId && (
                            <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/10">
                                <Clock size={32} className="mb-2 opacity-20" />
                                <p className="text-sm">Select an experience to see availability.</p>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
