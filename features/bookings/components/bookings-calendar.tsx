"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    ChevronLeft,
    ChevronRight,
    Grid,
    List,
    Plus,
    ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Availability } from "@/features/availability/components/availability-list-table";
import { BookingsListTable } from "./bookings-list-table";

export function BookingsCalendar({
    onEventClick
}: {
    onEventClick?: (availability: Availability, event: React.MouseEvent) => void
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    // Data State
    const [availabilities, setAvailabilities] = useState<Availability[]>([]);
    const [staffMap, setStaffMap] = useState<Record<string, string>>({});
    const [routeMap, setRouteMap] = useState<Record<string, string>>({});
    const [vehicleMap, setVehicleMap] = useState<Record<string, string>>({});
    const [expMap, setExpMap] = useState<Record<string, { name: string, short_code: string }>>({});
    const [isLoading, setIsLoading] = useState(false);

    const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
    const yearPickerRef = useRef<HTMLDivElement>(null);

    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    // 1. Fetch Reference Data
    useEffect(() => {
        const fetchRefs = async () => {
            const { data: staff } = await supabase.from('staff' as any).select('id, name');
            const { data: routes } = await supabase.from('schedules' as any).select('id, name');
            const { data: vehicles } = await supabase.from('vehicles' as any).select('id, name');
            const { data: exps } = await supabase.from('experiences' as any).select('id, name, short_code');

            if (staff) setStaffMap(Object.fromEntries((staff as any[]).map(s => [s.id, s.name])));
            if (routes) setRouteMap(Object.fromEntries((routes as any[]).map(r => [r.id, r.name])));
            if (vehicles) setVehicleMap(Object.fromEntries((vehicles as any[]).map(v => [v.id, v.name])));
            if (exps) setExpMap(Object.fromEntries((exps as any[]).map(e => [e.id, { name: e.name, short_code: e.short_code }])));
        };
        fetchRefs();
    }, []);

    // 2. Fetch Availabilities (ALL) for Current Month
    useEffect(() => {
        const fetchAvail = async () => {
            setIsLoading(true);
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const startOfMonth = new Date(year, month, 1);
            const endOfMonth = new Date(year, month + 1, 0);

            const { data, error } = await supabase
                .from('availabilities' as any)
                .select('*')
                // No experience filter = Universal View
                .gte('start_date', startOfMonth.toISOString().split('T')[0])
                .lte('start_date', endOfMonth.toISOString().split('T')[0])
                .order('start_date', { ascending: true });

            if (error) {
                console.error("Error fetching availabilities:", error);
            } else if (data) {
                const enriched: Availability[] = data.map((item: any) => ({
                    ...item,
                    booked_count: item.booked_count || 0, // Ensure this is always present
                    staff_display: item.staff_ids?.map((id: string) => staffMap[id]).filter(Boolean).join(", ") || "",
                    route_name: routeMap[item.transportation_route_id] || "",
                    vehicle_name: vehicleMap[item.vehicle_id] || "",
                    experience_name: expMap[item.experience_id || ""]?.name || "",
                    experience_short_code: expMap[item.experience_id || ""]?.short_code || "EXP"
                }));
                setAvailabilities(enriched);
            }
            setIsLoading(false);
        }

        fetchAvail();
    }, [currentDate, staffMap, routeMap, vehicleMap]); // Re-fetch when refs change to ensure map is ready? Or mostly just Date.

    // --- NAVIGATION LOGIC ---
    const handlePrevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    const handleYearSelect = (year: number) => {
        setCurrentDate(prev => new Date(year, prev.getMonth(), 1));
        setIsYearPickerOpen(false);
    };

    // Close pickers
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (yearPickerRef.current && !yearPickerRef.current.contains(event.target as Node)) {
                setIsYearPickerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

    // List View State
    const [listStartDate, setListStartDate] = useState(new Date());
    const [listEndDate, setListEndDate] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));

    return (
        <div className="w-full h-[calc(100vh_-_9rem)] font-sans flex flex-col">
            {/* TOP COMPONENT: Control Bar */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 pb-6 border-b border-zinc-900 sticky top-0 z-30">

                {/* LEFT: Title & Navigation */}
                <div className="flex items-center gap-6">
                    {viewMode === 'calendar' ? (
                        <>
                            <div className="flex items-center gap-3">
                                <span className="text-4xl font-black text-white tracking-tighter">
                                    {monthNames[currentDate.getMonth()]}
                                </span>
                                <div className="relative" ref={yearPickerRef}>
                                    <button
                                        onClick={() => setIsYearPickerOpen(!isYearPickerOpen)}
                                        className="text-4xl font-black text-cyan-500 tracking-tighter flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                        {currentDate.getFullYear().toString().slice(-2)}
                                        <ChevronDown className="w-5 h-5 stroke-[4] mt-1 text-cyan-500" />
                                    </button>
                                    {isYearPickerOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-[100px] bg-[#0a0a0a] border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
                                                {years.map((year) => (
                                                    <div
                                                        key={year}
                                                        className={cn(
                                                            "px-4 py-2.5 text-sm font-bold cursor-pointer transition-colors border-b border-zinc-900 last:border-0",
                                                            currentDate.getFullYear() === year ? "bg-cyan-950/30 text-cyan-400" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
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

                            <div className="flex gap-1">
                                <button onClick={handlePrevMonth} className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition-all active:scale-95">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button onClick={handleNextMonth} className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition-all active:scale-95">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4">
                            <span className="text-2xl font-black text-white tracking-tighter uppercase">Booking List</span>
                            <div className="h-8 w-px bg-zinc-800 mx-2" />
                            {/* Simple Date Inputs for now */}
                            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
                                <input
                                    type="date"
                                    value={listStartDate.toISOString().split('T')[0]}
                                    onChange={(e) => e.target.value && setListStartDate(new Date(e.target.value))}
                                    className="bg-transparent text-sm text-zinc-300 outline-none px-2 font-mono"
                                />
                                <span className="text-zinc-600">-</span>
                                <input
                                    type="date"
                                    value={listEndDate.toISOString().split('T')[0]}
                                    onChange={(e) => e.target.value && setListEndDate(new Date(e.target.value))}
                                    className="bg-transparent text-sm text-zinc-300 outline-none px-2 font-mono"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT: Toolbar Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                    <div className="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800 mr-2">
                        <button onClick={() => setViewMode('calendar')} className={cn("p-1.5 rounded-md transition-all", viewMode === 'calendar' ? "bg-cyan-500/20 text-cyan-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300")}>
                            <Grid size={16} />
                        </button>
                        <button onClick={() => setViewMode('list')} className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-cyan-500/20 text-cyan-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300")}>
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className={cn(
                "flex-1 min-h-0 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative",
                viewMode === 'list' && "bg-transparent border-0 shadow-none overflow-visible"
            )}>
                {viewMode === 'calendar' ? (
                    <MonthView
                        currentDate={currentDate}
                        availabilities={availabilities}
                        onEventClick={onEventClick}
                        expMap={expMap}
                    />
                ) : (
                    <BookingsListTable
                        startDate={listStartDate}
                        endDate={listEndDate}
                        // For now clicking a booking does nothing or could open edit. User didn't specify.
                        // We'll leave empty for now.
                        onBookingClick={() => { }}
                    />
                )}
            </div>
        </div>
    );
}

function MonthView({
    currentDate,
    availabilities,
    onEventClick,
    expMap
}: {
    currentDate: Date,
    availabilities: Availability[],
    onEventClick?: (availability: Availability) => void,
    expMap: Record<string, { name: string, short_code: string }>
}) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    return (
        <div className="h-full overflow-auto rounded-xl relative bg-[#0b1115]">
            <table className="w-full border-separate border-spacing-0">
                <thead className="bg-white/5 backdrop-blur-sm text-zinc-400 text-xs uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
                    <tr>
                        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day, idx) => (
                            <th key={day} className={cn(
                                "px-6 py-4 text-center",
                                idx === 0 && "rounded-tl-xl",
                                idx === 6 && "rounded-tr-xl"
                            )}>{day}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: Math.ceil((firstDayIndex + daysInMonth) / 7) }).map((_, rowIndex) => (
                        <tr key={rowIndex}>
                            {Array.from({ length: 7 }).map((_, colIndex) => {
                                const i = rowIndex * 7 + colIndex;
                                const dayNumber = i - firstDayIndex + 1;
                                const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;
                                const cellDateString = isValidDay ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}` : null;
                                const isToday = isCurrentMonth && dayNumber === today.getDate();
                                const daysEvents = isValidDay && cellDateString ? availabilities.filter(a => a.start_date === cellDateString) : [];

                                return (
                                    <td key={colIndex} className={cn(
                                        "relative group transition-colors p-2 min-h-[160px] align-top border-b border-r border-white/5",
                                        (!isValidDay || isToday) ? "bg-white/5" : "hover:bg-white/5"
                                    )} style={{ minHeight: '160px', height: '160px' }}>
                                        {isValidDay && (
                                            <div className="flex flex-col pl-1 pt-1 gap-1">
                                                <span className={cn("text-base font-bold block mb-2 w-8 h-8 flex items-center justify-center rounded-full", isToday ? "bg-cyan-500 text-black shadow-glow" : "text-zinc-500")}>{dayNumber}</span>
                                                {daysEvents.map((event) => (
                                                    <EventChip
                                                        key={event.id}
                                                        abbr={event.experience_short_code || "EXP"}
                                                        time={event.duration_type === 'all_day' ? 'All Day' : new Date(`1970-01-01T${event.start_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                                        bookings={`${event.booked_count || 0} Bookings`}
                                                        cap={`${event.booked_count || 0} / ${event.max_capacity} Capacity`}
                                                        onClick={(e) => {
                                                            e?.stopPropagation();
                                                            if (e) onEventClick?.(event, e);
                                                        }}
                                                        note={event.private_announcement}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function EventChip({ abbr, time, bookings, cap, note, onClick }: { abbr: string, time: string, bookings: string, cap: string, note?: string, onClick?: (e?: React.MouseEvent) => void }) {
    return (
        <div className="mb-1 p-2 rounded-sm shadow-sm cursor-pointer transition-all backdrop-blur-md flex flex-col items-start gap-0.5 min-h-[fit-content] select-none bg-cyan-600/90 hover:bg-cyan-500" onClick={onClick}>
            <span className="font-bold text-white text-xs leading-tight">{abbr}</span>
            <span className="text-white font-bold text-xs leading-tight">{time}</span>
            <span className="text-white font-bold text-xs leading-tight">{bookings}</span>
            <span className="text-white font-bold text-xs leading-tight">{cap}</span>
            {note && <span className="text-white font-bold italic text-xs leading-tight mt-0.5 max-w-full truncate">{note}</span>}
        </div>
    );
}
