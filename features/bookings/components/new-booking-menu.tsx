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
import { Loader2, CalendarDays, Clock, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { useSidebar } from "@/components/shell/sidebar-context";
import { Combobox } from "@/components/ui/combobox";

interface NewBookingMenuProps {
    children: React.ReactNode;
    onSelectAvailability: (availability: Availability) => void;
    defaultExperienceId?: string;
}

export function NewBookingMenu({ children, onSelectAvailability, defaultExperienceId }: NewBookingMenuProps) {
    const { isCollapsed } = useSidebar();
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
        if (!isOpen) {
            setIsInitializing(true);
            return;
        }
        const fetchExperiences = async () => {
            setIsInitializing(true);
            const { data } = await supabase
                .from("experiences" as any)
                .select("id, name")
                .order("name");
            if (data) setExperiences(data as unknown as { id: string; name: string }[]);
            setIsInitializing(false);
        };
        fetchExperiences();
    }, [isOpen]);

    // Fetch available dates for the current month view
    useEffect(() => {
        if (!isOpen || !selectedExperienceId) {
            setAvailableIsoDates(new Set());
            return;
        }

        const fetchMonthAvailability = async () => {
            const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

            let query = supabase
                .from("availabilities" as any)
                .select("start_date")
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
    }, [currentMonth, isOpen, selectedExperienceId]);

    // Fetch Availabilities when selected date changes
    useEffect(() => {
        if (!date || !isOpen || !selectedExperienceId) {
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
                    experience:experiences(name, short_code)
                `)
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

                    return {
                        ...item,
                        experience_name: item.experience?.name,
                        experience_short_code: item.experience?.short_code,
                        booked_count: totalPax
                    };
                });
                setAvailabilities(processed);
            }
            setIsLoading(false);
        };

        fetchAvailabilities();
    }, [date, isOpen, selectedExperienceId]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent
                portal={true}
                overlayClassName="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-[left] duration-300 ease-in-out"
                overlayStyle={{ left: isCollapsed ? "80px" : "240px" }}
                className="fixed top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-none w-[300px] p-0 bg-[#0a0a0a] border-zinc-800 gap-0 overflow-hidden shadow-2xl transition-[left] duration-300 ease-in-out"
                style={{
                    left: `calc(50% + ${isCollapsed ? 40 : 120}px)`
                }}
                showCloseButton={false}
            >
                <div className="sr-only">
                    <DialogTitle>Select Booking Date</DialogTitle>
                </div>

                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-3 right-3 p-1 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-colors z-[60]"
                >
                    <X size={16} />
                </button>

                {isInitializing ? (
                    <div className="h-[300px] flex flex-col items-center justify-center text-zinc-500 gap-3">
                        <Loader2 className="animate-spin text-cyan-400" size={24} />
                        <span className="text-xs font-medium uppercase tracking-wider">Loading...</span>
                    </div>
                ) : (
                    <div className="flex flex-col divide-y divide-zinc-800">

                        {/* Experience Selector */}
                        <div className="p-4 border-b border-zinc-800 bg-zinc-900/30">

                            <div className="w-full max-w-[240px]">
                                <Combobox
                                    value={selectedExperienceId}
                                    onChange={setSelectedExperienceId}
                                    options={experiences.map(e => ({ value: e.id, label: e.name }))}
                                    placeholder="Select Experience..."
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
                                    hasAvailability: "bg-cyan-900/50 !text-cyan-400 !font-bold rounded-md border-2 border-[#0a0a0a]"
                                }}
                                className={cn(
                                    "rounded-md border-0 transition-opacity duration-200",
                                    !selectedExperienceId && "opacity-20 pointer-events-none filter blur-[1px]"
                                )}
                                classNames={{
                                    selected: "border-2 border-cyan-400 text-cyan-400 bg-transparent hover:text-cyan-300 focus:text-cyan-300 shadow-none font-bold rounded-md",
                                    today: "bg-zinc-800 text-white rounded-md",
                                }}
                            />

                            {/* Prompt Overlay */}
                            {!selectedExperienceId && (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <div className="text-sm font-bold text-zinc-400 bg-zinc-900/90 px-4 py-2 rounded-full border border-zinc-800 shadow-xl backdrop-blur-sm">
                                        Please select an experience
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Availabilities List Section */}
                        {selectedExperienceId && (
                            <div className="w-full max-h-[300px] flex flex-col">
                                <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <CalendarDays size={16} className="text-cyan-400" />
                                        {date ? format(date, "MMMM d, yyyy") : "Select a Date"}
                                    </h3>
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
                                                        <Clock size={12} className="text-zinc-600 group-hover/item:text-cyan-400/70" />
                                                        <span>{avail.start_time ? format(new Date(`2000-01-01T${avail.start_time}`), "h:mm a") : "All Day"}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Users size={12} className="text-zinc-600 group-hover/item:text-cyan-400/70" />
                                                        <span className={cn((avail.booked_count || 0) > 0 && "text-cyan-400 font-medium")}>
                                                            {Math.max(0, avail.max_capacity - (avail.booked_count || 0))} / {avail.max_capacity} pax
                                                        </span>
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
                        )}

                        {/* Empty State Prompt if no experience selected */}
                        {!selectedExperienceId && (
                            <div className="h-[200px] flex flex-col items-center justify-center text-zinc-600 p-8 text-center bg-zinc-950/50">
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
