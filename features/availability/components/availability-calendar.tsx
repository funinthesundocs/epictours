"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Edit,
    Copy,
    Trash2,
    ChevronDown,
    Check,
    Grid,
    List
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Availability, AvailabilityListTable } from "./availability-list-table";

export function AvailabilityCalendar({
    experiences = [],
    onEventClick,
    onEditEvent
}: {
    experiences: { id: string, name: string, short_code?: string }[],
    onEventClick?: (date: string, experienceId?: string) => void,
    onEditEvent?: (availability: Availability) => void
}) {
    const [currentDate, setCurrentDate] = useState(new Date()); // Dynamic Date
    // Default to first available experience or fallback
    const [selectedExperience, setSelectedExperience] = useState(experiences[0]?.name || "Mauna Kea Summit");
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    // Data State
    const [availabilities, setAvailabilities] = useState<Availability[]>([]);
    const [staffMap, setStaffMap] = useState<Record<string, string>>({});
    const [routeMap, setRouteMap] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Pickers State
    const [isExpPickerOpen, setIsExpPickerOpen] = useState(false);
    const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

    // Refs for click outside
    const expPickerRef = useRef<HTMLDivElement>(null);
    const yearPickerRef = useRef<HTMLDivElement>(null);

    // Abbreviation Mapping (Dynamic)
    const currentExp = experiences.find(e => e.name === selectedExperience);
    const abbr = currentExp?.short_code || "EXP";

    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    // ... (Data Fetching omitted for brevity, logic remains same) ...
    // Note: Re-implementing Data Fetching hook here to be safe and complete, or just keep header and change return.
    // To be safe, I will include the full updated function body structure or use precise targeting.

    // 1. Fetch Reference Data (Staff & Routes)
    useEffect(() => {
        const fetchRefs = async () => {
            const { data: staff } = await supabase.from('staff' as any).select('id, name');
            const { data: routes } = await supabase.from('schedules' as any).select('id, name');

            if (staff) setStaffMap(Object.fromEntries((staff as any[]).map(s => [s.id, s.name])));
            if (routes) setRouteMap(Object.fromEntries((routes as any[]).map(r => [r.id, r.name])));
        };
        fetchRefs();
    }, []);

    // 2. Fetch Availabilities for Current Month & Experience
    useEffect(() => {
        if (!currentExp?.id) return;

        const fetchAvail = async () => {
            setIsLoading(true);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0);

            const { data, error } = await supabase
                .from('availabilities' as any)
                .select('*')
                .eq('experience_id', currentExp.id)
                .gte('start_date', startOfMonth.toISOString().split('T')[0])
                .lte('start_date', endOfMonth.toISOString().split('T')[0])
                .order('start_date', { ascending: true });

            if (error) {
                console.error("Error fetching availabilities:", error);
            } else if (data) {
                const enriched: Availability[] = data.map((item: any) => ({
                    ...item,
                    staff_display: item.staff_ids?.map((id: string) => staffMap[id]).filter(Boolean).join(", ") || "",
                    route_name: routeMap[item.transportation_route_id] || ""
                }));
                setAvailabilities(enriched);
            }
            setIsLoading(false);
        }

        fetchAvail();
    }, [currentExp, currentDate, staffMap, routeMap]);

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('availabilities' as any).delete().eq('id', id);
        if (error) {
            console.error("Failed to delete availability:", error);
            alert("Failed to delete. Check console.");
        } else {
            setAvailabilities(prev => prev.filter(item => item.id !== id));
        }
    };



    // --- NAVIGATION LOGIC ---

    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleYearSelect = (year: number) => {
        setCurrentDate(prev => new Date(year, prev.getMonth(), 1));
        setIsYearPickerOpen(false);
    };

    // Close pickers when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (expPickerRef.current && !expPickerRef.current.contains(event.target as Node)) {
                setIsExpPickerOpen(false);
            }
            if (yearPickerRef.current && !yearPickerRef.current.contains(event.target as Node)) {
                setIsYearPickerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Generate Year Range (Current - 2 to Current + 5)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

    return (
        <div className="w-full h-full bg-black p-6 font-sans flex flex-col gap-6">
            {/* TOP COMPONENT: Control Bar */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 pb-6 border-b border-zinc-900">

                {/* LEFT: Title & Navigation */}
                <div className="flex items-center gap-6">
                    {/* Date Display with Year Dropdown */}
                    <div className="flex items-center gap-3">
                        <span className="text-4xl font-black text-white tracking-tighter">
                            {monthNames[currentDate.getMonth()]}
                        </span>

                        {/* Year Selector */}
                        <div className="relative" ref={yearPickerRef}>
                            <button
                                onClick={() => setIsYearPickerOpen(!isYearPickerOpen)}
                                title="Change Year"
                                className="text-4xl font-black text-cyan-500 tracking-tighter flex items-center gap-1 cursor-pointer transition-colors"
                            >
                                {currentDate.getFullYear().toString().slice(-2)}
                                <ChevronDown className="w-5 h-5 stroke-[4] mt-1 text-cyan-500" />
                            </button>

                            {/* Year Dropdown */}
                            {isYearPickerOpen && (
                                <div className="absolute top-full left-0 mt-2 w-[100px] bg-[#0a0a0a] border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                                        {years.map((year) => (
                                            <div
                                                key={year}
                                                className={cn(
                                                    "px-4 py-2.5 text-sm font-bold cursor-pointer transition-colors border-b border-zinc-900 last:border-0",
                                                    currentDate.getFullYear() === year
                                                        ? "bg-cyan-950/30 text-cyan-400"
                                                        : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                                                )}
                                                onClick={() => handleYearSelect(year)}
                                            >
                                                {year}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Buttons (Only allow month nav in calendar mode or if list respects month) */}
                    <div className="flex gap-1">
                        <button
                            onClick={handlePrevMonth}
                            className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition-all active:scale-95"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleNextMonth}
                            className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition-all active:scale-95"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* RIGHT: Selector & Toolbar Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">

                    {/* COMPACT EXPERIENCE SELECTOR */}
                    <div className="relative w-[220px] mr-2" ref={expPickerRef}>
                        <div
                            className={cn(
                                "w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white cursor-pointer flex items-center justify-between transition-all hover:bg-zinc-900 hover:border-zinc-700",
                                isExpPickerOpen && "border-cyan-500/50 bg-zinc-900 ring-1 ring-cyan-500/20"
                            )}
                            onClick={() => setIsExpPickerOpen(!isExpPickerOpen)}
                        >
                            <span className="font-semibold text-sm truncate">{selectedExperience}</span>
                            <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform shrink-0 ml-2", isExpPickerOpen && "rotate-180")} />
                        </div>

                        {/* Dropdown Menu */}
                        {isExpPickerOpen && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                {experiences.map((exp) => (
                                    <div
                                        key={exp.id}
                                        className={cn(
                                            "px-4 py-3 text-sm cursor-pointer flex items-center justify-between transition-colors border-b border-zinc-900 last:border-0",
                                            selectedExperience === exp.name
                                                ? "bg-cyan-900/20 text-cyan-400"
                                                : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                                        )}
                                        onClick={() => {
                                            setSelectedExperience(exp.name);
                                            setIsExpPickerOpen(false);
                                        }}
                                    >
                                        {exp.name}
                                        {selectedExperience === exp.name && <Check className="w-3.5 h-3.5" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800 mr-2">
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                viewMode === 'calendar' ? "bg-cyan-500/20 text-cyan-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                            )}
                            title="Calendar View"
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-1.5 rounded-md transition-all",
                                viewMode === 'list' ? "bg-cyan-500/20 text-cyan-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                            )}
                            title="List View"
                        >
                            <List size={16} />
                        </button>
                    </div>

                    <div className="w-px h-8 bg-zinc-900 mx-2"></div>

                    <ToolbarButton
                        icon={Plus}
                        label="Create"
                        onClick={() => onEventClick?.(currentDate.toISOString().split('T')[0], currentExp?.id)}
                    />
                    <ToolbarButton icon={Edit} label="Edit" />
                    <ToolbarButton icon={Copy} label="Duplicate" />
                    <ToolbarButton icon={Trash2} label="Delete" danger />
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className={cn(
                "flex-1 min-h-0 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative",
                viewMode === 'list' && "bg-transparent border-0 shadow-none overflow-visible"
            )}>
                {viewMode === 'calendar' ? (
                    <MonthView
                        selectedExperience={selectedExperience}
                        abbr={abbr}
                        currentDate={currentDate}
                        availabilities={availabilities}
                        onEventClick={(date, id) => onEventClick?.(date, id)}
                        onEditEvent={onEditEvent}
                    />
                ) : (
                    <AvailabilityListTable
                        data={availabilities}
                        onEdit={(id, item) => {
                            // Pass the full item to the edit handler
                            onEditEvent?.(item);
                        }}
                        onDelete={handleDelete}
                    />
                )}
            </div>
        </div>
    );
}


// --- SUB-COMPONENTS ---

function MonthView({ selectedExperience, abbr, currentDate, availabilities, onEventClick, onEditEvent }: {
    selectedExperience: string,
    abbr: string,
    currentDate: Date,
    availabilities: Availability[],
    onEventClick?: (date: string, experienceId?: string) => void,
    onEditEvent?: (availability: Availability) => void
}) {
    // Helper for date checks
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 1. Calculate Grid offsets
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // 28 - 31

    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    return (
        <div className="h-full grid grid-cols-7 gap-px bg-zinc-600 overflow-y-auto">
            {/* Headers */}
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(day => (
                <div key={day} className="bg-zinc-950/80 p-4 text-sm font-bold text-zinc-500 uppercase text-center backdrop-blur-sm sticky top-0 z-10 border-b border-zinc-900">{day}</div>
            ))}

            {/* Cells: Dynamic calculation to avoid extra rows */}
            {Array.from({ length: Math.ceil((firstDayIndex + daysInMonth) / 7) * 7 }).map((_, i) => {
                const dayNumber = i - firstDayIndex + 1;
                const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;

                // Build ISO Date string (YYYY-MM-DD) for matching
                const cellDateString = isValidDay
                    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
                    : null;

                const isToday = isCurrentMonth && dayNumber === today.getDate();

                // Filter Availabilities for this day
                const daysEvents = isValidDay && cellDateString
                    ? availabilities.filter(a => a.start_date === cellDateString)
                    : [];

                return (
                    <div key={i} className={cn(
                        "relative group transition-colors p-2 min-h-[160px] flex flex-col pl-3 pt-3 gap-1",
                        // Out of month OR Today -> Zinc 950/80. Else (Valid Day) -> Black, Hover -> Zinc 950/80.
                        (!isValidDay || isToday) ? "bg-zinc-950/80" : "bg-black hover:bg-zinc-950/80"
                    )}
                        onClick={() => {
                            if (isValidDay && cellDateString) {
                                // If user clicks empty space, trigger create (pass date only)
                                // If they click a chip, that chip handles proper edit ID
                                // We'll let the parent handle the "Create" logic if no ID passed, or rely on the (+) button
                            }
                        }}
                    >
                        {isValidDay && (
                            <>
                                <span className={cn(
                                    "text-base font-bold block mb-2 transition-colors w-8 h-8 flex items-center justify-center rounded-full",
                                    isToday ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "text-zinc-500 group-hover:text-zinc-300"
                                )}>{dayNumber}</span>

                                {daysEvents.map((event) => (
                                    <EventChip
                                        key={event.id}
                                        color="cyan"
                                        abbr={abbr}
                                        time={event.duration_type === 'all_day' ? 'All Day' : new Date(`1970-01-01T${event.start_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                        bookings="0 Bookings"
                                        cap={`0 / ${event.max_capacity} Capacity`}
                                        note={event.private_announcement}
                                        onClick={(e) => {
                                            e?.stopPropagation(); // Prevent parent click
                                            onEditEvent?.(event);
                                        }}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// --- SHARED HELPERS ---

function ToolbarButton({
    icon: Icon,
    label,
    active = false,
    danger = false,
    onClick
}: {
    icon: any,
    label: string,
    active?: boolean,
    danger?: boolean,
    onClick?: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border",
                active
                    ? "bg-zinc-800 text-white border-zinc-700 shadow-lg"
                    : danger
                        ? "bg-black text-zinc-400 border-zinc-900 hover:bg-red-950/20 hover:text-red-500 hover:border-red-900/50"
                        : "bg-black text-zinc-400 border-zinc-900 hover:bg-zinc-900 hover:text-white hover:border-zinc-800"
            )}>
            <Icon className="w-3.5 h-3.5" />
            {label}
        </button>
    )
}

function EventChip({
    color,
    abbr,
    time,
    bookings,
    cap,
    note,
    onClick
}: {
    color: string,
    abbr: string,
    time: string,
    bookings: string,
    cap: string,
    note?: string,
    onClick?: (e?: React.MouseEvent) => void
}) {
    const style = "bg-cyan-600/90 hover:bg-cyan-500 border-l-[3px] border-cyan-400";

    return (
        <div
            className={cn("mb-1 p-2 rounded-sm shadow-sm cursor-pointer transition-colors backdrop-blur-md flex flex-col items-start gap-0.5 min-h-[fit-content]", style)}
            onClick={onClick}
        >
            <span className="font-bold text-white text-xs leading-tight">{abbr}</span>
            <span className="text-white font-bold text-xs leading-tight">Start: {time}</span>
            <span className="text-white font-bold text-xs leading-tight">{bookings} Bookings</span>
            <span className="text-white font-bold text-xs leading-tight">{cap}</span>
            {note && <span className="text-white font-bold italic text-xs leading-tight mt-0.5">{note}</span>}
        </div>
    );
}

// Just a dummy helper to avoid TS errors if referenced elsewhere (unlikely now)
function hourToPx(start: number, end: number) {
    return true;
}

