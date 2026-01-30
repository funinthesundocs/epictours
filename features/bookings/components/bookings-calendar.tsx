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
    X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Availability } from "@/features/availability/components/availability-list-table";
import { BookingsListTable } from "./bookings-list-table";
import {
    addDays, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isToday, differenceInMinutes,
    addMinutes,
    subDays,
    startOfDay
} from "date-fns";

export function BookingsCalendar({
    onEventClick,
    selectedAvailabilityId
}: {
    onEventClick?: (availability: Availability, event: React.MouseEvent) => void;
    selectedAvailabilityId?: string | null;
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');

    // Zoom Level for Day View (Pixels Per Minute)
    // Default 1.5px = 1 min
    const [pixelsPerMinute, setPixelsPerMinute] = useState(1.5);

    // Data State
    const [availabilities, setAvailabilities] = useState<Availability[]>([]);
    const [staffMap, setStaffMap] = useState<Record<string, string>>({});
    const [routeMap, setRouteMap] = useState<Record<string, string>>({});
    const [vehicleMap, setVehicleMap] = useState<Record<string, string>>({});
    const [expMap, setExpMap] = useState<Record<string, { name: string, short_code: string }>>({});
    const [isLoading, setIsLoading] = useState(false);

    const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
    const yearPickerRef = useRef<HTMLDivElement>(null);

    // Experience Filter State
    const [selectedExperienceId, setSelectedExperienceId] = useState<string>("all");
    const [isExpPickerOpen, setIsExpPickerOpen] = useState(false);
    const expPickerRef = useRef<HTMLDivElement>(null);

    // List View State
    const [listStartDate, setListStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d;
    });
    const [listEndDate, setListEndDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d;
    });
    const [listSearchQuery, setListSearchQuery] = useState("");

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
                // BUG FIX: Widen the net. Fetch +/- 1 day to ensure we don't miss anything due to TZ or strict bounds
                startRange = subDays(startOfDay(currentDate), 1);
                endRange = addDays(startOfDay(currentDate), 1);
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
            if (expPickerRef.current && !expPickerRef.current.contains(event.target as Node)) {
                setIsExpPickerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 8 }, (_, i) => currentYear - 2 + i);

    // Experience Options for Filter
    const experienceOptions = [
        { id: "all", name: "All Experiences", short_code: "ALL" },
        ...Object.entries(expMap).map(([id, exp]) => ({ id, ...exp }))
    ];
    const selectedExpName = experienceOptions.find(e => e.id === selectedExperienceId)?.name || "All Experiences";

    // Filtered Availabilities
    const filteredAvailabilities = selectedExperienceId === "all"
        ? availabilities
        : availabilities.filter(a => a.experience_id === selectedExperienceId);


    return (
        <div
            className="w-full font-sans flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 9rem)' }}
        >
            {/* TOP COMPONENT: Control Bar */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 pb-6 border-b border-zinc-900 sticky top-0 z-40">

                {/* LEFT: Title & Navigation */}
                <div className="flex items-center gap-6">
                    {viewMode === 'list' ? (
                        null
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
                                    className="w-[90px] text-cyan-400"
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

                {/* RIGHT: Toolbar Actions - Hidden in List View */}
                {viewMode !== 'list' && (
                    <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                        {/* Experience Filter Dropdown */}
                        <div className="relative w-[220px] mr-2" ref={expPickerRef}>
                            <div
                                className={cn(
                                    "w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-white cursor-pointer flex items-center justify-between transition-all hover:bg-zinc-900 hover:border-zinc-700",
                                    isExpPickerOpen && "border-cyan-400/50 bg-zinc-900 ring-1 ring-cyan-400/20"
                                )}
                                onClick={() => setIsExpPickerOpen(!isExpPickerOpen)}
                            >
                                <span className="font-semibold text-sm truncate">{selectedExpName}</span>
                                <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform shrink-0 ml-2", isExpPickerOpen && "rotate-180")} />
                            </div>

                            {/* Dropdown Menu */}
                            {isExpPickerOpen && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    {experienceOptions.map((exp) => (
                                        <div
                                            key={exp.id}
                                            className={cn(
                                                "px-4 py-3 text-sm cursor-pointer flex items-center justify-between transition-colors border-b border-zinc-900 last:border-0",
                                                selectedExperienceId === exp.id
                                                    ? "bg-cyan-900/20 text-cyan-400"
                                                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                                            )}
                                            onClick={() => {
                                                setSelectedExperienceId(exp.id);
                                                setIsExpPickerOpen(false);
                                            }}
                                        >
                                            {exp.name}
                                            {selectedExperienceId === exp.id && <span className="text-cyan-400">✓</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800 mr-2">
                            <button
                                onClick={() => setViewMode('month')}
                                className={cn("p-1.5 rounded-md transition-all", viewMode === 'month' ? "bg-cyan-400/20 text-cyan-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                                title="Month View"
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('week')}
                                className={cn("p-1.5 rounded-md transition-all", viewMode === 'week' ? "bg-cyan-400/20 text-cyan-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                                title="Week View"
                            >
                                <Columns size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('day')}
                                className={cn("p-1.5 rounded-md transition-all", viewMode === 'day' ? "bg-cyan-400/20 text-cyan-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300")}
                                title="Day View"
                            >
                                <Clock size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn("p-1.5 rounded-md transition-all", "text-zinc-500 hover:text-zinc-300")}
                                title="List View"
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* CONTENT AREA */}
            <div className={cn(
                "flex-1 min-h-0 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative",
                viewMode === 'list' && "bg-transparent border-0 shadow-none overflow-visible"
            )}>
                {viewMode === 'month' && (
                    <MonthView
                        currentDate={currentDate}
                        availabilities={filteredAvailabilities}
                        onEventClick={onEventClick}
                        expMap={expMap}
                        selectedAvailabilityId={selectedAvailabilityId}
                    />
                )}
                {viewMode === 'week' && (
                    <WeekView
                        currentDate={currentDate}
                        availabilities={filteredAvailabilities}
                        onEventClick={onEventClick}
                        selectedAvailabilityId={selectedAvailabilityId}
                    />
                )}
                {viewMode === 'day' && (
                    <DailyView
                        currentDate={currentDate}
                        availabilities={filteredAvailabilities}
                        onEventClick={onEventClick}
                        pixelsPerMinute={pixelsPerMinute}
                        setPixelsPerMinute={setPixelsPerMinute}
                        expMap={expMap}
                        selectedAvailabilityId={selectedAvailabilityId}
                    />
                )}
                {viewMode === 'list' && (
                    <div className="flex flex-col gap-3">
                        {/* Single Toolbar Row - All Controls */}
                        <div className="flex items-end justify-between gap-4">
                            {/* LEFT: Date Range + Search */}
                            <div className="flex items-end gap-4">
                                {/* Date Range Selectors - Double Decker */}
                                <div className="flex flex-col gap-1 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider w-10">From</span>
                                        <CustomSelect value={listStartDate.getMonth()} options={monthNames.map((m, i) => ({ label: m, value: i }))} onChange={(val) => { const d = new Date(listStartDate); d.setMonth(val); setListStartDate(d); }} className="w-[80px] text-xs" />
                                        <CustomSelect value={listStartDate.getDate()} options={Array.from({ length: new Date(listStartDate.getFullYear(), listStartDate.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map((d) => ({ label: d.toString(), value: d }))} onChange={(val) => { const d = new Date(listStartDate); d.setDate(val); setListStartDate(d); }} className="w-[60px] text-xs" />
                                        <CustomSelect value={listStartDate.getFullYear()} options={years.map((y) => ({ label: y.toString(), value: y }))} onChange={(val) => { const d = new Date(listStartDate); d.setFullYear(val); setListStartDate(d); }} className="w-[80px] text-xs text-cyan-400" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider w-10">To</span>
                                        <CustomSelect value={listEndDate.getMonth()} options={monthNames.map((m, i) => ({ label: m, value: i }))} onChange={(val) => { const d = new Date(listEndDate); d.setMonth(val); setListEndDate(d); }} className="w-[80px] text-xs" />
                                        <CustomSelect value={listEndDate.getDate()} options={Array.from({ length: new Date(listEndDate.getFullYear(), listEndDate.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map((d) => ({ label: d.toString(), value: d }))} onChange={(val) => { const d = new Date(listEndDate); d.setDate(val); setListEndDate(d); }} className="w-[60px] text-xs" />
                                        <CustomSelect value={listEndDate.getFullYear()} options={years.map((y) => ({ label: y.toString(), value: y }))} onChange={(val) => { const d = new Date(listEndDate); d.setFullYear(val); setListEndDate(d); }} className="w-[80px] text-xs text-cyan-400" />
                                    </div>
                                </div>
                                {/* Search Bar - 25% larger */}
                                <div className="flex items-center gap-2 w-[350px]">
                                    <div className="relative flex-1">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                        <input
                                            type="text"
                                            value={listSearchQuery}
                                            onChange={(e) => setListSearchQuery(e.target.value)}
                                            placeholder="Search customer, experience, status..."
                                            className="w-full h-8 bg-[#0b1115] border border-white/10 rounded-lg pl-8 pr-3 text-sm text-white focus:outline-none focus:border-cyan-400/50 transition-colors placeholder:text-zinc-600"
                                        />
                                    </div>
                                    {listSearchQuery && (
                                        <button
                                            onClick={() => setListSearchQuery("")}
                                            className="h-8 px-2 flex items-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-xs"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* RIGHT: Filter + View Buttons */}
                            <div className="flex items-center gap-2">
                                <div className="relative w-[180px]" ref={expPickerRef}>
                                    <div className={cn("w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-white cursor-pointer flex items-center justify-between transition-all hover:bg-zinc-900 hover:border-zinc-700", isExpPickerOpen && "border-cyan-400/50 bg-zinc-900 ring-1 ring-cyan-400/20")} onClick={() => setIsExpPickerOpen(!isExpPickerOpen)}>
                                        <span className="font-semibold text-xs truncate">{selectedExpName}</span>
                                        <ChevronDown className={cn("w-3 h-3 text-zinc-500 transition-transform shrink-0 ml-1", isExpPickerOpen && "rotate-180")} />
                                    </div>
                                    {isExpPickerOpen && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-[#0a0a0a] border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            {experienceOptions.map((exp) => (
                                                <div key={exp.id} className={cn("px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors border-b border-zinc-900 last:border-0", selectedExperienceId === exp.id ? "bg-cyan-900/20 text-cyan-400" : "text-zinc-400 hover:bg-zinc-900 hover:text-white")} onClick={() => { setSelectedExperienceId(exp.id); setIsExpPickerOpen(false); }}>
                                                    {exp.name}
                                                    {selectedExperienceId === exp.id && <span className="text-cyan-400">✓</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                                    <button onClick={() => setViewMode('month')} className={cn("p-1.5 rounded-md transition-all", "text-zinc-500 hover:text-zinc-300")} title="Month View"><Grid size={14} /></button>
                                    <button onClick={() => setViewMode('week')} className={cn("p-1.5 rounded-md transition-all", "text-zinc-500 hover:text-zinc-300")} title="Week View"><Columns size={14} /></button>
                                    <button onClick={() => setViewMode('day')} className={cn("p-1.5 rounded-md transition-all", "text-zinc-500 hover:text-zinc-300")} title="Day View"><Clock size={14} /></button>
                                    <button onClick={() => setViewMode('list')} className={cn("p-1.5 rounded-md transition-all", "bg-cyan-400/20 text-cyan-400 shadow-sm")} title="List View"><List size={14} /></button>
                                </div>
                            </div>
                        </div>
                        {/* Table */}
                        <BookingsListTable startDate={listStartDate} endDate={listEndDate} searchQuery={listSearchQuery} onBookingClick={() => { }} />
                    </div>
                )}
            </div>
        </div>
    );
}

function MonthView({
    currentDate,
    availabilities,
    onEventClick,
    expMap,
    selectedAvailabilityId
}: {
    currentDate: Date,
    availabilities: Availability[],
    onEventClick?: (availability: Availability, event: React.MouseEvent) => void,
    expMap: Record<string, { name: string, short_code: string }>,
    selectedAvailabilityId?: string | null
}) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    // Auto-scroll to today's row
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const todayRowRef = useRef<HTMLTableRowElement>(null);

    useEffect(() => {
        if (isCurrentMonth && todayRowRef.current && scrollContainerRef.current) {
            // Scroll to make today's row visible (with some offset from the top)
            const rowTop = todayRowRef.current.offsetTop;
            scrollContainerRef.current.scrollTo({
                top: rowTop, // Scroll so today's row is at the top
                behavior: 'smooth'
            });
        }
    }, [isCurrentMonth, month, year]);

    // Calculate which row contains today
    const todayRowIndex = isCurrentMonth
        ? Math.floor((firstDayIndex + today.getDate() - 1) / 7)
        : -1;

    return (
        <div ref={scrollContainerRef} className="h-full overflow-auto rounded-xl relative bg-[#010e0f]">
            <table className="w-full table-fixed border-separate border-spacing-0">
                <thead className="bg-zinc-900/40 backdrop-blur-sm text-zinc-400 text-sm uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
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
                        <tr key={rowIndex} ref={rowIndex === todayRowIndex ? todayRowRef : undefined}>
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
                                        (!isValidDay || isToday) ? "bg-zinc-900/40" : "hover:bg-zinc-900/40"
                                    )} style={{ minHeight: '160px', height: '160px' }}>
                                        {isValidDay && (
                                            <div className="flex flex-col pl-1 pt-1 gap-1">
                                                <span className={cn("text-base font-bold block mb-2 w-8 h-8 flex items-center justify-center rounded-full", isToday ? "bg-cyan-400 text-black shadow-glow" : "text-zinc-500")}>{dayNumber}</span>
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
                                                        isSelected={selectedAvailabilityId === event.id}
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
    onEventClick,
    selectedAvailabilityId
}: {
    currentDate: Date,
    availabilities: Availability[],
    onEventClick?: (availability: Availability, event: React.MouseEvent) => void,
    selectedAvailabilityId?: string | null
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
                            isDayToday ? "bg-cyan-950/20 border-t-2 border-cyan-400" : "bg-white/5 backdrop-blur-sm"
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
                                            isSelected={selectedAvailabilityId === event.id}
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
    expMap,
    selectedAvailabilityId
}: {
    currentDate: Date,
    availabilities: Availability[],
    onEventClick?: (availability: Availability, event: React.MouseEvent) => void,
    pixelsPerMinute: number,
    setPixelsPerMinute: (ppm: number) => void,
    expMap: Record<string, { name: string, short_code: string }>,
    selectedAvailabilityId?: string | null
}) {
    // 1. Group by Experience
    const sortedExperienceIds = Object.keys(expMap).sort((a, b) =>
        expMap[a].short_code.localeCompare(expMap[b].short_code)
    );

    // Filter availabilities for the day
    const dateStr = format(currentDate, "yyyy-MM-dd");

    // DEBUG: Log all availabilities passed to DailyView
    console.log(`[DEBUG DailyView] CurrentDate=${dateStr}, TotalAvailabilities=${availabilities.length}`);

    // Relaxed Filter: If it's within the window, show it?
    // Or stick to strict date matching?
    // Let's Log what gets filtered OUT vs IN
    const daysEvents = availabilities.filter(a => {
        const match = a.start_date === dateStr;
        if (!match) console.log(`[DEBUG] Skipped event ${a.id} date=${a.start_date} (Expected ${dateStr})`);
        return match;
    });

    console.log(`[DEBUG DailyView] Filtered Events for ${dateStr}:`, daysEvents.length);

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
    // 1. Calculate Earliest Start Time
    let earliestMinute = 24 * 60; // Default to end of day
    let hasAllDay = false;

    daysEvents.forEach(e => {
        if (e.duration_type === 'all_day') {
            hasAllDay = true;
        } else if (e.start_time) {
            const [h, m] = e.start_time.split(':').map(Number);
            const totalM = h * 60 + m;
            if (totalM < earliestMinute) earliestMinute = totalM;
        }
    });

    // If All Day exists, force start to 00:00 (0 minutes)
    // If no events found (earliestMinute still max), default to 08:00 (480 min) or 00:00? Let's default to 6 AM (360) for emptiness.
    if (hasAllDay) {
        earliestMinute = 0;
    } else if (earliestMinute === 24 * 60) {
        earliestMinute = 360; // Default 6 AM if no events
    }

    const startHour = Math.floor(earliestMinute / 60);
    const endHour = startHour + 24; // Show full 24 hour cycle from start
    const totalMinutes = (endHour - startHour) * 60;
    const viewWidth = totalMinutes * pixelsPerMinute;

    // "Now" Indicator Logic
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const getMinutesFromStart = (date: Date) => {
        const h = date.getHours();
        const m = date.getMinutes();
        // Handle wrapping if we want? No, pure subtraction.
        // If startHour is 8, and time is 10, returns 120.
        // If time is 01:00 (next day implicity?), Date object usually is specific point in time.
        // BUT our availabilities are "Start Date + Start Time".
        // Daily View usually implies "One Calendar Day".
        // If we "run 8am to 8am", we are showing 08:00 (Day 1) to 08:00 (Day 2).
        // Standard "Day View" clipping usually hides Day 2.
        // But the user requested "Run the timeline from 8am to 8am".
        // This implies visual wrapping or extended axis.

        let diff = (h * 60 + m) - (startHour * 60);
        return diff;
    };

    const nowOffset = getMinutesFromStart(now);
    const isTodayView = isSameDay(currentDate, now);

    return (
        <div className="flex flex-col h-full bg-[#0b1115] relative group/view">
            {/* Zoom Control */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-zinc-900/90 backdrop-blur border border-zinc-800 p-1 rounded-lg shadow-xl">
                <button
                    onClick={() => setPixelsPerMinute(Math.max(0.5, pixelsPerMinute - 0.25))}
                    className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded"
                >
                    <ZoomOut size={14} />
                </button>
                <span className="text-[10px] font-mono text-zinc-500 min-w-[30px] text-center">{pixelsPerMinute}x</span>
                <button
                    onClick={() => setPixelsPerMinute(Math.min(5, pixelsPerMinute + 0.25))}
                    className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded"
                >
                    <ZoomIn size={14} />
                </button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-auto relative custom-scrollbar">

                {/* Header: Time Scale */}
                <div className="sticky top-0 z-40 bg-[#0b1115] border-b border-zinc-800 flex items-end h-10 shadow-md ring-1 ring-white/5" style={{ width: Math.max(viewWidth + 200, 1000) }}>
                    {/* Sticky Left Corner */}
                    <div className="sticky left-0 w-[200px] h-full bg-[#0b1115] z-50 border-r border-zinc-800 shrink-0"></div>

                    {/* Time Labels */}
                    <div className="relative flex-1 h-full bg-[#0b1115]">
                        {Array.from({ length: (endHour - startHour) + 1 }).map((_, i) => {
                            const hourRaw = startHour + i;
                            // Modulo 24 for label display 8, 9... 23, 0, 1...
                            const hourMod = hourRaw % 24;
                            const isPM = hourMod >= 12;
                            const displayHour = hourMod > 12 ? hourMod - 12 : (hourMod === 0 ? 12 : hourMod);
                            const label = `${displayHour} ${isPM ? 'PM' : 'AM'}`;
                            const offset = i * 60 * pixelsPerMinute;

                            return (
                                <div
                                    key={hourRaw}
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
                <div className="relative flex flex-col group/grid" style={{ width: Math.max(viewWidth + 200, 1000) }}>

                    {/* 1. Global Background Grid Lines */}
                    <div className="absolute inset-0 z-0 pointer-events-none">
                        <div className="pl-[200px] h-full relative">
                            {/* Hour Lines */}
                            {Array.from({ length: (endHour - startHour) + 1 }).map((_, i) => (
                                <div
                                    key={`grid-${i}`}
                                    className="absolute top-0 bottom-0 border-r border-zinc-800/40"
                                    style={{ left: i * 60 * pixelsPerMinute }}
                                />
                            ))}
                            {/* 15-min Lines */}
                            {Array.from({ length: (totalMinutes / 15) }).map((_, i) => (
                                <div
                                    key={`subgrid-${i}`}
                                    className="absolute top-0 bottom-0 border-r border-zinc-800/10"
                                    style={{ left: i * 15 * pixelsPerMinute }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* 2. Live "Now" Line */}
                    {isTodayView && nowOffset >= 0 && nowOffset <= totalMinutes && (
                        <div
                            className="absolute top-0 bottom-0 border-l-[2px] border-red-500/80 z-30 pointer-events-none"
                            style={{ left: 200 + (nowOffset * pixelsPerMinute) }}
                        >
                            <div className="bg-red-500 text-black text-[9px] font-bold px-1 rounded absolute -top-1 -left-4">Now</div>
                        </div>
                    )}

                    {/* 3. Stacked Rows */}
                    <div className="relative z-10 flex flex-col">
                        {sortedExperienceIds.map(expId => {
                            const exp = expMap[expId];
                            const events = grouped[expId] || [];

                            // Sort events by time
                            events.sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

                            if (events.length === 0) return null; // Hide empty groups? Or show empty row? Let's hide for "Stacked" feel.

                            return (
                                <div key={expId} className="flex flex-col">
                                    {/* Group Header Row */}
                                    <div className="sticky left-0 bg-[#0b1115] border-b border-zinc-800 p-2 pl-4 flex items-center justify-between z-20 w-[200px] border-r border-zinc-800/50">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-black text-white tracking-tight">{exp.short_code}</span>
                                            <span className="text-[10px] text-zinc-500 uppercase font-bold">{events.length} Trips</span>
                                        </div>
                                    </div>

                                    {/* Event Rows */}
                                    {events.map((event, idx) => {
                                        // Safe Parsing for Start/End
                                        let startTimeStr = event.start_time;
                                        const startDateStr = event.start_date;
                                        const isAllDay = event.duration_type === 'all_day';

                                        // ALL DAY LOGIC: Force start time if missing
                                        if (isAllDay && !startTimeStr) {
                                            startTimeStr = "00:00:00";
                                        }

                                        if (!startTimeStr || !startDateStr) {
                                            console.log(`[DEBUG] INVALID EVENT (ID: ${event.id}):`, JSON.stringify(event, null, 2));
                                            return (
                                                <div key={event.id} className="flex border-b border-zinc-900 min-h-[50px] bg-red-900/20 items-center px-4">
                                                    <span className="text-red-500 font-mono text-xs">INVALID DATA: ID {event.id} Missing Time</span>
                                                </div>
                                            );
                                        }

                                        const startDateTime = new Date(`${startDateStr}T${startTimeStr}`);
                                        if (isNaN(startDateTime.getTime())) {
                                            return (
                                                <div key={event.id} className="flex border-b border-zinc-900 min-h-[50px] bg-red-900/20 items-center px-4">
                                                    <span className="text-red-500 font-mono text-xs">INVALID TIME FORMAT: {startTimeStr}</span>
                                                </div>
                                            );
                                        }

                                        const startOffset = getMinutesFromStart(startDateTime);

                                        // Duration Logic
                                        let duration = 120; // fallback

                                        if (isAllDay) {
                                            duration = 1440; // 24 Hours
                                        }
                                        // 1. Explicit hours_long from DB (if available)
                                        else if (event.hours_long) {
                                            duration = event.hours_long * 60;
                                        }
                                        // 2. Calculated from End Time
                                        else if ((event as any).end_time) {
                                            const endDateTime = new Date(`${startDateStr}T${(event as any).end_time}`);
                                            if (!isNaN(endDateTime.getTime())) {
                                                duration = differenceInMinutes(endDateTime, startDateTime);
                                            }
                                        }
                                        // 3. Explicit duration_minutes field (if available)
                                        else if ((event as any).duration_minutes) {
                                            duration = Number((event as any).duration_minutes);
                                        }

                                        // Width calculation
                                        const width = Math.max(duration * pixelsPerMinute, 50);

                                        return (
                                            <div key={event.id} className="flex border-b border-zinc-900/50 min-h-[60px] relative items-center group/row hover:bg-white/[0.02] transition-colors">
                                                {/* Sticky Left Label (Time?) - Optional */}
                                                <div className="sticky left-0 w-[200px] h-full border-r border-zinc-800/50 bg-[#0b1115] z-20 shrink-0 flex items-center justify-end pr-4">
                                                    <span className="text-xs font-mono text-zinc-600 group-hover/row:text-zinc-400 transition-colors">
                                                        {format(startDateTime, "h:mm a")}
                                                    </span>
                                                </div>

                                                {/* Timeline Content Area */}
                                                <div className="relative flex-1 h-full"
                                                    onClick={(e) => {
                                                        // Click to Create Logic (Mapped to grid)
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const x = e.clientX - rect.left;
                                                        const minutesClicked = x / pixelsPerMinute;
                                                        const timeClicked = addMinutes(startOfDay(currentDate), startHour * 60 + minutesClicked);
                                                        console.log("Create Schedule at:", format(timeClicked, "HH:mm"));
                                                    }}
                                                >
                                                    {/* Chip Wrapper (Flow Positioned) */}
                                                    <div
                                                        className="h-full relative z-10"
                                                        style={{
                                                            marginLeft: Math.max(0, startOffset * pixelsPerMinute),
                                                            width: width
                                                        }}
                                                    >
                                                        <EventChip
                                                            abbr={exp.short_code || "EXP"}
                                                            time={startDateTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                                            bookedCount={event.booked_count || 0}
                                                            maxCapacity={event.max_capacity}
                                                            bookingRecordsCount={event.booking_records_count || 0}
                                                            resources={[event.vehicle_name, event.driver_name, event.guide_name].filter(Boolean).join(", ")}
                                                            onClick={(e) => {
                                                                e?.stopPropagation();
                                                                if (onEventClick && e) onEventClick(event, e);
                                                            }}
                                                            note={event.private_announcement}
                                                            isSelected={selectedAvailabilityId === event.id}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// -- SUB COMPONENTS --

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
                <span>{selectedLabel}</span>
                <ChevronDown size={16} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full min-w-[140px] bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2 text-sm hover:bg-zinc-800 transition-colors",
                                value === opt.value ? "text-white font-medium bg-zinc-800/50" : "text-zinc-400"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// EventChip Component - Used across all calendar views
function EventChip({
    abbr,
    time,
    bookedCount,
    maxCapacity,
    bookingRecordsCount,
    resources,
    onClick,
    note,
    isSelected
}: {
    abbr: string;
    time: string;
    bookedCount: number;
    maxCapacity: number;
    bookingRecordsCount: number;
    resources?: string;
    onClick?: (e?: React.MouseEvent) => void;
    note?: string;
    isSelected?: boolean;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const openCount = maxCapacity - bookedCount;

    // Uniform text class
    const textClass = `font-bold text-xs leading-tight pointer-events-none ${isSelected ? 'text-black' : 'text-white group-hover/chip:text-[#010e0f]'}`;

    return (
        <div
            className={cn(
                "group/chip mb-1 p-2 rounded-sm shadow-sm cursor-pointer transition-all backdrop-blur-md flex flex-col items-start gap-0.5 min-h-[fit-content] select-none overflow-hidden ring-1 ring-white/10",
                isSelected ? "bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-[1.02] z-10" : "bg-cyan-700/90 hover:bg-cyan-400"
            )}
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
                <div className={cn(textClass, isSelected ? "text-black" : "text-white/90", "truncate w-full")}>
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
