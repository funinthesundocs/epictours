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
    Columns,
    Search,
    Clock,
    ZoomIn,
    ZoomOut,
    Minus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Availability } from "@/features/availability/components/availability-list-table";
import { BookingsListTable } from "./bookings-list-table";
import { addDays, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isToday, differenceInMinutes, startOfDay, addMinutes } from "date-fns";

export function BookingsCalendar({
    onEventClick
}: {
    onEventClick?: (availability: Availability, event: React.MouseEvent) => void
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');

    // Zoom Level for Day View (Pixels Per Minute)
    // Default 2px = 1 min (1 hour = 120px)
    const [pixelsPerMinute, setPixelsPerMinute] = useState(2);

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

    // 2. Fetch Availabilities
    useEffect(() => {
        const fetchAvail = async () => {
            setIsLoading(true);

            // Determine fetch range based on view mode
            let startRange: Date;
            let endRange: Date;

            if (viewMode === 'week') {
                startRange = startOfWeek(currentDate);
                endRange = endOfWeek(currentDate);
            } else if (viewMode === 'day') {
                // Fetch full week around the day to allow smoother next/prev, or just the day?
                // Fetches are cheap. Let's do the day.
                startRange = startOfDay(currentDate);
                endRange = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59);
            } else {
                // Month or List (default to month context)
                startRange = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                endRange = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            }

            const { data, error } = await supabase
                .from('availabilities' as any)
                .select('*, bookings:bookings(pax_count, status), bookings_count:bookings(count), assignments:availability_assignments(*)')
                .gte('start_date', startRange.toISOString().split('T')[0])
                .lte('start_date', endRange.toISOString().split('T')[0])
                .order('start_date', { ascending: true });

            if (error) {
                console.error("Error fetching availabilities:", error);
            } else if (data) {
                const enriched: Availability[] = data.map((item: any) => {
                    // Resource Clustering Logic - Determine Primary Assignment
                    const assignments = item.assignments || [];
                    const primaryAssignment = assignments.length > 0
                        ? assignments.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))[0]
                        : null;

                    // Extract legacy staff_ids just in case we need logic (currently strict mode disables fallback)
                    const staffIds = item.staff_ids || [];

                    let driverName = "";
                    let guideName = "";
                    let routeName = "";
                    let vehicleName = "";
                    let staffDisplayList: string[] = [];

                    // STRICT ASSIGNMENT MODE: Only populate if Assignment exists
                    if (primaryAssignment) {
                        if (primaryAssignment.driver_id) {
                            const name = staffMap[primaryAssignment.driver_id];
                            if (name) {
                                driverName = name;
                                staffDisplayList.push(name);
                            }
                        }
                        if (primaryAssignment.guide_id) {
                            const name = staffMap[primaryAssignment.guide_id];
                            if (name) {
                                guideName = name;
                                staffDisplayList.push(name);
                            }
                        }
                        routeName = routeMap[primaryAssignment.transportation_route_id] || "";
                        vehicleName = vehicleMap[primaryAssignment.vehicle_id] || "";
                    }

                    // Calculate bookings
                    const validBookings = (item.bookings || []).filter((b: any) => b.status?.toLowerCase() !== 'cancelled');
                    const totalPax = validBookings.reduce((sum: number, b: any) => sum + Number(b.pax_count || 0), 0);
                    const bookingRecords = validBookings.length;

                    return {
                        ...item,
                        booked_count: totalPax,
                        booking_records_count: bookingRecords,
                        staff_display: staffDisplayList.join(", ") || "",
                        route_name: routeName,
                        vehicle_name: vehicleName,
                        driver_name: driverName,
                        guide_name: guideName,
                        experience_name: expMap[item.experience_id || ""]?.name || "",
                        experience_short_code: expMap[item.experience_id || ""]?.short_code || "EXP",
                        assignments: assignments
                    };
                });
                setAvailabilities(enriched);
            }
            setIsLoading(false);
        }

        fetchAvail();
    }, [currentDate, viewMode, staffMap, routeMap, vehicleMap]);

    // --- NAVIGATION LOGIC ---
    const handlePrev = () => {
        if (viewMode === 'week') {
            setCurrentDate(prev => subWeeks(prev, 1));
        } else if (viewMode === 'day') {
            setCurrentDate(prev => addDays(prev, -1));
        } else {
            setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
        }
    };

    const handleNext = () => {
        if (viewMode === 'week') {
            setCurrentDate(prev => addWeeks(prev, 1));
        } else if (viewMode === 'day') {
            setCurrentDate(prev => addDays(prev, 1));
        } else {
            setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
        }
    };

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
                    {viewMode === 'list' ? (
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
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                {/* Month Selector */}
                                <CustomSelect
                                    value={currentDate.getMonth()}
                                    options={monthNames.map((m, i) => ({ label: m, value: i }))}
                                    onChange={(val) => {
                                        const newDate = new Date(currentDate);
                                        newDate.setMonth(val);
                                        setCurrentDate(newDate);
                                    }}
                                    className="w-[90px]"
                                />

                                {/* Day Selector */}
                                <CustomSelect
                                    value={currentDate.getDate()}
                                    options={Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map((d) => ({ label: d.toString(), value: d }))}
                                    onChange={(val) => {
                                        const newDate = new Date(currentDate);
                                        newDate.setDate(val);
                                        setCurrentDate(newDate);
                                    }}
                                    className="w-[70px]"
                                />

                                {/* Year Selector */}
                                <CustomSelect
                                    value={currentDate.getFullYear()}
                                    options={years.map((y) => ({ label: y.toString(), value: y }))}
                                    onChange={(val) => {
                                        const newDate = new Date(currentDate);
                                        newDate.setFullYear(val);
                                        setCurrentDate(newDate);
                                    }}
                                    className="w-[90px] text-cyan-500"
                                />
                            </div>

                            <div className="flex gap-1">
                                <button onClick={handlePrev} className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition-all active:scale-95">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button onClick={handleNext} className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center transition-all active:scale-95">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* RIGHT: Toolbar Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                    <div className="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800 mr-2">
                        <button
                            onClick={() => setViewMode('month')}
                            className={cn("p-1.5 rounded-md transition-all", viewMode === 'month' ? "bg-cyan-500/20 text-cyan-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                            title="Month View"
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={cn("p-1.5 rounded-md transition-all", viewMode === 'week' ? "bg-cyan-500/20 text-cyan-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                            title="Week View"
                        >
                            <Columns size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('day')}
                            className={cn("p-1.5 rounded-md transition-all", viewMode === 'day' ? "bg-cyan-500/20 text-cyan-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                            title="Day View"
                        >
                            <Clock size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-cyan-500/20 text-cyan-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                            title="List View"
                        >
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
                {viewMode === 'month' && (
                    <MonthView
                        currentDate={currentDate}
                        availabilities={availabilities}
                        onEventClick={onEventClick}
                        expMap={expMap}
                    />
                )}
                {viewMode === 'week' && (
                    <WeekView
                        currentDate={currentDate}
                        availabilities={availabilities}
                        onEventClick={onEventClick}
                    />
                )}
                {viewMode === 'day' && (
                    <DailyView
                        currentDate={currentDate}
                        availabilities={availabilities}
                        onEventClick={onEventClick}
                        pixelsPerMinute={pixelsPerMinute}
                        setPixelsPerMinute={setPixelsPerMinute}
                        expMap={expMap}
                    />
                )}
                {viewMode === 'list' && (
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
    onEventClick?: (availability: Availability, event: React.MouseEvent) => void,
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
                                                        bookedCount={event.booked_count || 0}
                                                        maxCapacity={event.max_capacity}
                                                        bookingRecordsCount={event.booking_records_count || 0}
                                                        resources={[event.vehicle_name, event.driver_name, event.guide_name].filter(Boolean).join(", ")}
                                                        onClick={(e) => {
                                                            e?.stopPropagation();
                                                            if (onEventClick && e) onEventClick(event, e);
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

function WeekView({
    currentDate,
    availabilities,
    onEventClick
}: {
    currentDate: Date,
    availabilities: Availability[],
    onEventClick?: (availability: Availability, event: React.MouseEvent) => void
}) {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start, end });

    // Helper to get events
    const getEventsForDay = (day: Date) => {
        const dateStr = format(day, "yyyy-MM-dd");
        return availabilities.filter(a => a.start_date === dateStr);
    };

    return (
        <div className="flex flex-col h-full bg-[#0b1115]">
            {/* Header Row (Sticky) */}
            <div className="flex divide-x divide-white/5 border-b border-white/5 overflow-hidden pr-[var(--scrollbar-width)]">
                {days.map((day) => {
                    const events = getEventsForDay(day);
                    const isDayToday = isToday(day);

                    return (
                        <div key={day.toString()} className={cn(
                            "flex-1 min-w-[220px] p-2 text-center transition-colors border-b border-white/5",
                            isDayToday ? "bg-cyan-950/20 border-t-2 border-cyan-500" : "bg-white/5 backdrop-blur-sm"
                        )}>
                            <div className="text-zinc-500 text-sm font-bold uppercase tracking-wider">{format(day, 'EEE')}</div>
                            <div className={cn("text-3xl font-black mt-0 tracking-tight", isDayToday ? "text-cyan-400" : "text-white")}>
                                {format(day, 'd')}
                            </div>
                            <div className="mt-1 text-sm text-zinc-500 font-bold uppercase">
                                {events.length} Event{events.length !== 1 && 's'}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Scrollable Columns */}
            <div className="flex-1 overflow-auto">
                <div className="flex h-full min-h-0 divide-x divide-white/5">
                    {days.map((day) => {
                        const events = getEventsForDay(day);
                        const isDayToday = isToday(day);
                        const formattedDate = format(day, "yyyy-MM-dd");

                        return (
                            <div key={day.toString()} className={cn(
                                "flex-1 min-w-[220px] flex flex-col transition-colors",
                                isDayToday && "bg-cyan-950/5"
                            )}>
                                {/* Click-to-Create Area (Fill space) */}
                                <div
                                    className="flex-1 p-2 space-y-2 cursor-pointer hover:bg-white/[0.02]"
                                    onClick={() => {
                                        // TODO: Pass intent to create new booking for this date
                                        console.log("Create for", formattedDate);
                                    }}
                                >
                                    {events.map(event => (
                                        <EventChip
                                            key={event.id}
                                            abbr={event.experience_short_code || "EXP"}
                                            time={event.duration_type === 'all_day' ? 'All Day' : new Date(`1970-01-01T${event.start_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                            bookedCount={event.booked_count || 0}
                                            maxCapacity={event.max_capacity}
                                            bookingRecordsCount={event.booking_records_count || 0}
                                            resources={[event.vehicle_name, event.driver_name, event.guide_name].filter(Boolean).join(", ")}
                                            onClick={(e) => {
                                                e?.stopPropagation();
                                                if (onEventClick && e) onEventClick(event, e);
                                            }}
                                            note={event.private_announcement}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function DailyView({
    currentDate,
    availabilities,
    onEventClick,
    pixelsPerMinute,
    setPixelsPerMinute,
    expMap
}: {
    currentDate: Date,
    availabilities: Availability[],
    onEventClick?: (availability: Availability, event: React.MouseEvent) => void,
    pixelsPerMinute: number,
    setPixelsPerMinute: (ppm: number) => void,
    expMap: Record<string, { name: string, short_code: string }>
}) {
    // 1. Group by Experience (Swimlanes)
    // We want to iterate experiences, even empty ones? Or just ones with events?
    // "Premium" usually implies seeing all capacities.
    // Let's use the expMap to drive the rows if we have it, otherwise fallback to finding unique IDs in availabilities.
    // However, if we only fetched availabilities, we might miss empty experiences.
    // But we have expMap from the parent ref fetch!

    // Sort experiences by Short Code for consistency
    const sortedExperienceIds = Object.keys(expMap).sort((a, b) =>
        expMap[a].short_code.localeCompare(expMap[b].short_code)
    );

    // Filter availabilities for the day
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const daysEvents = availabilities.filter(a => a.start_date === dateStr);

    // Grouping
    const grouped: Record<string, Availability[]> = {};
    sortedExperienceIds.forEach(id => grouped[id] = []);
    daysEvents.forEach(e => {
        if (e.experience_id) {
            if (!grouped[e.experience_id]) grouped[e.experience_id] = [];
            grouped[e.experience_id].push(e);
        }
    });

    // Time Config
    const startHour = 6; // 6 AM
    const endHour = 22; // 10 PM
    const totalMinutes = (endHour - startHour) * 60;
    const viewWidth = totalMinutes * pixelsPerMinute;

    // Grid Lines (every 15 mins)
    const gridMarkers = [];
    for (let m = 0; m <= totalMinutes; m += 15) {
        gridMarkers.push(m);
    }

    // "Now" Indicator Logic
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const getMinutesFromStart = (date: Date) => {
        const h = date.getHours();
        const m = date.getMinutes();
        return (h * 60 + m) - (startHour * 60);
    };

    const nowOffset = getMinutesFromStart(now);
    const isTodayView = isSameDay(currentDate, now);

    return (
        <div className="flex flex-col h-full bg-[#0b1115] relative group/view">
            {/* Zoom Control (Floating in top right of content area, or integrated?) 
                Let's put it in a nice absolute container in the top right
            */}
            <div className="absolute top-4 right-4 z-40 flex items-center gap-2 bg-zinc-900/90 backdrop-blur border border-zinc-800 p-1 rounded-lg shadow-xl">
                <button
                    onClick={() => setPixelsPerMinute(Math.max(1, pixelsPerMinute - 0.5))}
                    className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded"
                >
                    <ZoomOut size={14} />
                </button>
                <span className="text-[10px] font-mono text-zinc-500 min-w-[30px] text-center">{pixelsPerMinute}x</span>
                <button
                    onClick={() => setPixelsPerMinute(Math.min(5, pixelsPerMinute + 0.5))}
                    className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded"
                >
                    <ZoomIn size={14} />
                </button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-auto relative custom-scrollbar">

                {/* Header: Time Scale */}
                <div className="sticky top-0 z-30 bg-[#0b1115] border-b border-zinc-800 flex items-end h-10 shadow-sm" style={{ width: viewWidth, minWidth: '100%' }}>
                    {/* Sticky Left Spacer for Row Headers */}
                    <div className="sticky left-0 w-[140px] h-full bg-[#0b1115] z-40 border-r border-zinc-800 shrink-0"></div>

                    {/* Time Labels */}
                    <div className="relative flex-1 h-full">
                        {Array.from({ length: (endHour - startHour) + 1 }).map((_, i) => {
                            const hour = startHour + i;
                            const isPM = hour >= 12;
                            const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
                            const label = `${displayHour} ${isPM ? 'PM' : 'AM'}`;
                            const offset = i * 60 * pixelsPerMinute;

                            return (
                                <div
                                    key={hour}
                                    className="absolute bottom-1 text-xs font-bold text-zinc-500 pl-1 border-l-2 border-zinc-700 h-4"
                                    style={{ left: offset }}
                                >
                                    {label}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Main Grid Area */}
                <div className="relative flex" style={{ width: viewWidth, minWidth: '100%' }}>

                    {/* 1. Global Grid Lines (Background) */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <div className="pl-[140px] h-full relative">
                            {gridMarkers.map(m => (
                                <div
                                    key={m}
                                    className={cn(
                                        "absolute top-0 bottom-0 border-r",
                                        m % 60 === 0 ? "border-zinc-800" : "border-zinc-800/30"
                                    )}
                                    style={{ left: m * pixelsPerMinute }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 2. Live "Now" Line */}
                    {isTodayView && nowOffset >= 0 && nowOffset <= totalMinutes && (
                        <div
                            className="absolute top-0 bottom-0 border-l-[2px] border-red-500 z-20 pointer-events-none flex flex-col items-center"
                            style={{ left: 140 + (nowOffset * pixelsPerMinute) }}
                        >
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 -mt-1.5 shadow-[0_0_8px_2px_rgba(239,68,68,0.6)] animate-pulse" />
                            <div className="bg-red-500 text-black text-[9px] font-bold px-1 rounded mt-1">Now</div>
                        </div>
                    )}

                    {/* 3. Crosshair (Visible on Group Hover) */}
                    <div className="absolute top-0 bottom-0 w-px bg-cyan-500/50 z-10 hidden group-hover/view:block pointer-events-none translate-x-[var(--mouse-x)]"
                        style={{
                            // Logic for crosshair following mouse would require mouse tracking on the container.
                            // For simplicity in React without heavy listeners, we can rely on hover of specific columns or just omit for now if complexity is high.
                            // Let's omit the dynamic CSS var tracking for V1 stability.
                            display: 'none'
                        }}
                    />

                    {/* 4. Swimlanes */}
                    <div className="flex flex-col w-full z-10 relative">
                        {sortedExperienceIds.map(expId => {
                            const exp = expMap[expId];
                            const events = grouped[expId] || [];
                            const totalCap = events.reduce((sum, e) => sum + e.max_capacity, 0);
                            const totalPax = events.reduce((sum, e) => sum + (e.booked_count || 0), 0);
                            const occupancy = totalCap > 0 ? Math.round((totalPax / totalCap) * 100) : 0;

                            return (
                                <div key={expId} className="flex border-b border-zinc-800 min-h-[80px] hover:bg-white/[0.02] transition-colors group/row">
                                    {/* KPI Header */}
                                    <div className="sticky left-0 w-[140px] bg-[#0b1115] border-r border-zinc-800 p-3 flex flex-col justify-center shrink-0 z-20 group-hover/row:bg-zinc-900/80 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-black text-white text-lg tracking-tight">{exp.short_code}</span>
                                            {occupancy > 90 && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="High Occupancy" />}
                                        </div>
                                        <div className="text-[10px] text-zinc-500 font-medium">
                                            {events.length} Trips
                                        </div>
                                        <div className={cn("text-[10px] font-bold mt-0.5", occupancy > 80 ? "text-amber-400" : "text-zinc-400")}>
                                            {occupancy}% Cap
                                        </div>
                                    </div>

                                    {/* Timeline Track */}
                                    {/* 
                                         Click to Create: We need to capture clicks on this track, calculate time, and trigger create.
                                         The track is `totalMinutes * pixelsPerMinute` wide.
                                     */}
                                    <div
                                        className="relative flex-1 h-full"
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = e.clientX - rect.left;
                                            const minutesClicked = x / pixelsPerMinute;
                                            const timeClicked = addMinutes(startOfDay(currentDate), startHour * 60 + minutesClicked);
                                            console.log("Create Schedule at:", format(timeClicked, "HH:mm"));
                                            // Future: onEventClick(null, {date: timeClicked, expId})
                                        }}
                                    >
                                        {events.map(event => {
                                            // Calculate Position and Width
                                            const startTime = new Date(`${event.start_date}T${event.start_time}`);
                                            const startOffset = getMinutesFromStart(startTime);
                                            // Duration: Default to 60 if missing? Or calculate from end_time?
                                            // Availabilities usually have start/end. If not, assume 2 hours?
                                            let duration = 120; // Default
                                            if (event.end_time) {
                                                const endTime = new Date(`${event.start_date}T${event.end_time}`);
                                                // Handle crossing midnight?
                                                duration = differenceInMinutes(endTime, startTime);
                                            } else if (event.duration_minutes) {
                                                duration = event.duration_minutes;
                                            }

                                            const width = Math.max(duration * pixelsPerMinute, 40); // Min width for visibility

                                            return (
                                                <div
                                                    key={event.id}
                                                    className="absolute top-2 bottom-2 rounded-md shadow-md overflow-hidden bg-cyan-600/90 hover:bg-cyan-500 hover:ring-1 hover:ring-white border border-white/10 cursor-pointer transition-all hover:z-50 group/chip"
                                                    style={{
                                                        left: startOffset * pixelsPerMinute,
                                                        width: width - 4 // Gap
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onEventClick?.(event, e);
                                                    }}
                                                >
                                                    {/* Chip Content - Simplified for timeline */}
                                                    <div className="h-full px-2 py-1 flex flex-col justify-center">
                                                        {/* Line 1: Code */}
                                                        <div className="items-center gap-1 hidden sm:flex">
                                                            <span className="font-bold text-white text-xs truncate">{exp.short_code}</span>
                                                        </div>

                                                        {/* Show Only if Wide Enough */}
                                                        {width > 60 && (
                                                            <div className="text-[10px] text-white/90 font-medium truncate">
                                                                {event.booked_count}/{event.max_capacity}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                </div>
            </div>
        </div>
    );
}

function EventChip({
    abbr,
    time,
    bookedCount,
    maxCapacity,
    bookingRecordsCount,
    resources,
    note,
    onClick
}: {
    abbr: string,
    time: string,
    bookedCount: number,
    maxCapacity: number,
    bookingRecordsCount: number,
    resources: string,
    note?: string,
    onClick?: (e: React.MouseEvent) => void
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const openCount = maxCapacity - bookedCount;

    // Uniform text class
    const textClass = "font-bold text-white text-xs leading-tight";

    return (
        <div
            className="mb-1 p-1.5 rounded-sm shadow-sm cursor-pointer transition-all backdrop-blur-md flex flex-col items-start gap-1 min-h-[fit-content] select-none bg-cyan-600/90 hover:bg-cyan-500 overflow-hidden ring-1 ring-white/10"
            onClick={(e) => {
                e.stopPropagation();
                onClick?.(e);
            }}
        >
            {/* Header / Line 1: Code Only + Toggle */}
            <div className="flex justify-between items-start w-full gap-2">
                <span className={cn(textClass, "truncate flex-1")}>
                    {abbr}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="text-white/80 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors shrink-0 -mt-0.5"
                >
                    <ChevronDown size={14} className={cn("transition-transform duration-200 stroke-[3]", isExpanded && "rotate-180")} />
                </button>
            </div>

            {/* Line 2: Capacity Stats */}
            <div className={cn(textClass, "truncate w-full")}>
                {bookedCount} / {maxCapacity} Capacity | {openCount} Open
            </div>

            {/* Line 3: Private Note (Always visible if present) */}
            {note && (
                <div className={cn(textClass, "text-white/90 truncate w-full")}>
                    {note}
                </div>
            )}

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-1 pt-1 border-t border-white/20 w-full space-y-1 animate-in slide-in-from-top-1 fade-in duration-200">
                    {/* Line 3: Time */}
                    <div className={textClass}>
                        {time}
                    </div>
                    {/* Line 4: Booking Records */}
                    <div className={textClass}>
                        {bookingRecordsCount} Booking{bookingRecordsCount !== 1 && 's'}
                    </div>
                    {/* Line 5: Resources */}
                    {resources && (
                        <div className={cn(textClass, "truncate")}>
                            {resources}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function CustomSelect({
    value,
    options,
    onChange,
    className
}: {
    value: number | string,
    options: { label: string, value: number | string }[],
    onChange: (value: any) => void,
    className?: string
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find(o => o.value === value)?.label || value;

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center justify-between gap-2 bg-zinc-900/50 border border-zinc-800 text-white text-lg font-bold py-1.5 px-3 rounded-lg hover:border-zinc-700 transition-all min-w-[fit-content]",
                    className
                )}
            >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDown className={cn("w-4 h-4 text-zinc-500 stroke-[3] transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full min-w-[120px] max-h-[300px] overflow-y-auto bg-[#0a0a0a] border border-zinc-800 rounded-lg shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 scrollbar-thin scrollbar-thumb-zinc-800">
                    {options.map((opt) => (
                        <div
                            key={opt.value}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "px-3 py-2 text-sm font-bold cursor-pointer transition-colors border-b border-zinc-900 last:border-0",
                                opt.value === value ? "bg-zinc-900 text-cyan-500" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                            )}
                        >
                            {opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
