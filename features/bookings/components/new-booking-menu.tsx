"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Availability } from "@/features/availability/components/availability-list-table";
import { Loader2, CalendarDays, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewBookingMenuProps {
    children: React.ReactNode;
    onSelectAvailability: (availability: Availability) => void;
}

export function NewBookingMenu({ children, onSelectAvailability }: NewBookingMenuProps) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [availabilities, setAvailabilities] = useState<Availability[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Month view state for highlighting
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [availableIsoDates, setAvailableIsoDates] = useState<Set<string>>(new Set());

    // Fetch available dates for the current month view
    useEffect(() => {
        if (!isOpen) return;

        const fetchMonthAvailability = async () => {
            const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

            const { data, error } = await supabase
                .from("availabilities" as any)
                .select("start_date")
                .gte("start_date", format(startOfMonth, "yyyy-MM-dd"))
                .lte("start_date", format(endOfMonth, "yyyy-MM-dd"));

            if (!error && data) {
                const dateSet = new Set(data.map((d: any) => d.start_date));
                setAvailableIsoDates(dateSet);
            }
        };

        fetchMonthAvailability();
    }, [currentMonth, isOpen]);

    // Fetch Availabilities when selected date changes
    useEffect(() => {
        if (!date || !isOpen) return;

        const fetchAvailabilities = async () => {
            setIsLoading(true);
            const dateStr = format(date, "yyyy-MM-dd");

            const { data, error } = await supabase
                .from("availabilities" as any)
                .select(`
                    *,
                    bookings:bookings(count),
                    experience:experiences(name, short_code)
                `)
                .eq("start_date", dateStr)
                .order("start_time");

            if (error) {
                console.error("Error fetching availabilities:", error);
            } else {
                // Transform data to match Availability interface
                const processed = (data || []).map((item: any) => ({
                    ...item,
                    experience_name: item.experience?.name,
                    experience_short_code: item.experience?.short_code,
                    booked_count: item.bookings?.[0]?.count || 0
                }));
                setAvailabilities(processed);
            }
            setIsLoading(false);
        };

        fetchAvailabilities();
    }, [date, isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-none w-auto p-0 bg-[#0a0a0a] border-zinc-800 gap-0 overflow-hidden">
                <div className="sr-only">
                    <DialogTitle>Select Booking Date</DialogTitle>
                </div>
                <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
                    {/* Calendar Section */}
                    <div className="p-3">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            onMonthChange={setCurrentMonth}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            modifiers={{
                                hasAvailability: (date) => availableIsoDates.has(format(date, "yyyy-MM-dd"))
                            }}
                            modifiersClassNames={{
                                hasAvailability: "bg-cyan-900/50 !text-cyan-400 !font-bold rounded-md border-2 border-[#0a0a0a]"
                            }}
                            className="rounded-md border-0"
                            classNames={{
                                day_selected: "bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500/30 hover:text-cyan-300 focus:bg-cyan-500/30 focus:text-cyan-300",
                                day_today: "bg-zinc-800 text-white",
                            }}
                        />
                    </div>

                    {/* Availabilities List Section */}
                    <div className="w-full sm:w-[400px] max-h-[400px] flex flex-col">
                        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <CalendarDays size={16} className="text-cyan-500" />
                                {date ? format(date, "MMMM d, yyyy") : "Select a Date"}
                            </h3>
                            <p className="text-xs text-zinc-500 mt-1">
                                {isLoading ? "Checking schedule..." :
                                    availabilities.length === 0 ? "No availabilities found" :
                                        `${availabilities.length} bookings available`}
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar min-h-[200px]">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center text-zinc-500 gap-2">
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>Loading...</span>
                                </div>
                            ) : availabilities.length > 0 ? (
                                availabilities.map((avail) => (
                                    <button
                                        key={avail.id}
                                        onClick={() => {
                                            onSelectAvailability(avail);
                                            setIsOpen(false);
                                        }}
                                        className="w-full text-left p-3 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800 hover:border-zinc-700 transition-all group group/item"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-sm text-white group-hover/item:text-cyan-400 transition-colors">
                                                {avail.experience_name || "Unknown Experience"}
                                            </span>
                                            {avail.experience_short_code && (
                                                <span className="text-[10px] font-black uppercase tracking-wider bg-white/5 text-zinc-500 px-1.5 py-0.5 rounded">
                                                    {avail.experience_short_code}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-zinc-400">
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={12} className="text-zinc-600 group-hover/item:text-cyan-500/70" />
                                                <span>{avail.start_time ? format(new Date(`2000-01-01T${avail.start_time}`), "h:mm a") : "All Day"}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Users size={12} className="text-zinc-600 group-hover/item:text-cyan-500/70" />
                                                <span>{avail.max_capacity} Cap</span>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-600 p-8 text-center">
                                    <CalendarDays size={32} className="mb-2 opacity-20" />
                                    <p className="text-sm">No availabilities scheduled for this date.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
