"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { useAuth } from "@/features/auth/auth-context";
import { Availability } from "@/features/availability/components/availability-list-table";
import { BookingsListTable } from "./bookings-list-table";
import { ManifestView } from "./views/manifest-view";
import { BookingColumnPicker, useBookingColumnVisibility } from "./bookings-column-picker";
import {
    addDays, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isToday, differenceInMinutes,
    addMinutes,
    subDays,
    startOfDay
} from "date-fns";

export function BookingsCalendar({
    onEventClick,
    selectedAvailabilityId,
    onBookingEdit,
    currentDate = new Date(),
    onDateChange = () => { },
    initialView = 'month'
}: {
    onEventClick?: (availability: Availability, event: React.MouseEvent) => void;
    selectedAvailabilityId?: string | null;
    onBookingEdit?: (bookingId: string) => void;
    currentDate?: Date;
    onDateChange?: (date: Date) => void;
    initialView?: 'month' | 'week' | 'day' | 'list' | 'manifest';
}) {
    const { effectiveOrganizationId } = useAuth();
    const router = useRouter();
    const params = useParams();
    const orgSlug = params.orgSlug as string;
    // Adapter for controlled state that supports functional updates
    const setCurrentDate = (action: Date | ((prev: Date) => Date)) => {
        if (typeof action === 'function') {
            onDateChange(action(currentDate));
        } else {
            onDateChange(action);
        }
    };

    // Map 'calendar' alias to 'month' for backwards compatibility
    const mappedInitialView = initialView === 'calendar' ? 'month' : initialView;
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list' | 'manifest'>(mappedInitialView || 'month');

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

    // Column Visibility State (for List View)
    const { visibleColumns, toggleColumn, resetToDefault, reorderColumns } = useBookingColumnVisibility();

    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    // 1. Fetch Reference Data - filtered by org
    useEffect(() => {
        if (!effectiveOrganizationId) return;

        const fetchRefs = async () => {
            const { data: staff } = await supabase.from('staff' as any).select('id, user:users(name)').eq('organization_id', effectiveOrganizationId);
            const { data: routes } = await supabase.from('schedules' as any).select('id, name').eq('organization_id', effectiveOrganizationId);
            const { data: vehicles } = await supabase.from('vehicles' as any).select('id, name').eq('organization_id', effectiveOrganizationId);
            const { data: exps } = await supabase.from('experiences' as any).select('id, name, short_code').eq('organization_id', effectiveOrganizationId);

            if (staff) setStaffMap(Object.fromEntries((staff as any[]).map(s => [s.id, s.user?.name || 'Unknown'])));
            if (routes) setRouteMap(Object.fromEntries((routes as any[]).map(r => [r.id, r.name])));
            if (vehicles) setVehicleMap(Object.fromEntries((vehicles as any[]).map(v => [v.id, v.name])));
            if (exps) setExpMap(Object.fromEntries((exps as any[]).map(e => [e.id, { name: e.name, short_code: e.short_code }])));
        };
        fetchRefs();
    }, [effectiveOrganizationId]);

    // 2. Fetch Availabilities - filtered by org
    useEffect(() => {
        if (!effectiveOrganizationId) {
            setAvailabilities([]);
            return;
        }

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
                // ROBUST FIX: Fetch +/- 7 days to account for Timezone overlaps and "end of month" issues
                startRange = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                startRange.setDate(startRange.getDate() - 7);

                endRange = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                endRange.setDate(endRange.getDate() + 7);
            }

            const { data, error } = await supabase
                .from('availabilities' as any)
                .select('*, bookings:bookings(pax_count, status), bookings_count:bookings(count), assignments:availability_assignments(*)')
                .eq('organization_id', effectiveOrganizationId)
                .gte('start_date', startRange.toISOString().split('T')[0])
                .lte('start_date', endRange.toISOString().split('T')[0])
                .order('start_date', { ascending: true });

            if (error) {
                console.error("Error fetching availabilities:", error);
            } else if (data) {
                console.log("DEBUG: Calendar Fetch Raw Count:", data.length);
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
                        assignments: assignments,
                        // Fix for Smart Pickup: Polyfill route_id from assignment
                        transportation_route_id: primaryAssignment?.transportation_route_id || item.transportation_route_id
                    };
                });
                setAvailabilities(enriched);
            }
            setIsLoading(false);
        }

        fetchAvail();
    }, [currentDate, viewMode, effectiveOrganizationId]);

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
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 pb-6 sticky top-0 z-40">

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
                                    className="w-[90px] text-primary"
                                />
                            </div>

                            <div className="flex gap-1">
                                <button onClick={handlePrev} className="w-8 h-8 rounded-full border border-border bg-muted text-muted-foreground hover:text-foreground hover:border-sidebar-accent flex items-center justify-center transition-all active:scale-95">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button onClick={handleNext} className="w-8 h-8 rounded-full border border-border bg-muted text-muted-foreground hover:text-foreground hover:border-sidebar-accent flex items-center justify-center transition-all active:scale-95">
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
                                    "w-full bg-muted/50 border border-border rounded-lg px-4 py-2.5 text-foreground cursor-pointer flex items-center justify-between transition-all hover:bg-muted hover:border-sidebar-accent",
                                    isExpPickerOpen && "border-primary/50 bg-muted ring-1 ring-primary/20"
                                )}
                                onClick={() => setIsExpPickerOpen(!isExpPickerOpen)}
                            >
                                <span className="font-semibold text-sm truncate">{selectedExpName}</span>
                                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0 ml-2", isExpPickerOpen && "rotate-180")} />
                            </div>

                            {/* Dropdown Menu */}
                            {isExpPickerOpen && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-popover border border-border rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    {experienceOptions.map((exp) => (
                                        <div
                                            key={exp.id}
                                            className={cn(
                                                "px-4 py-3 text-sm cursor-pointer flex items-center justify-between transition-colors border-b border-border last:border-0",
                                                selectedExperienceId === exp.id
                                                    ? "bg-primary/20 text-primary"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

                        <div className="flex items-center bg-muted p-1 rounded-lg border border-border mr-2">
                            <button
                                onClick={() => setViewMode('month')}
                                className={cn("p-1.5 rounded-md transition-all", viewMode === 'month' ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                title="Month View"
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('week')}
                                className={cn("p-1.5 rounded-md transition-all", viewMode === 'week' ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                title="Week View"
                            >
                                <Columns size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('day')}
                                className={cn("p-1.5 rounded-md transition-all", viewMode === 'day' ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                title="Day View"
                            >
                                <Clock size={16} />
                            </button>
                            <button
                                onClick={() => router.push(`/org/${orgSlug}/finance/reports?preset=today`)}
                                className={cn("p-1.5 rounded-md transition-all", viewMode === 'manifest' ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                title="Manifest View"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn("p-1.5 rounded-md transition-all", "text-muted-foreground hover:text-foreground")}
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
                "flex-1 min-h-0 bg-background border border-border rounded-2xl overflow-hidden relative",
                (viewMode === 'list' || viewMode === 'manifest') && "bg-transparent border-0 overflow-visible"
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
                {viewMode === 'manifest' && (
                    <ManifestView
                        currentDate={currentDate}
                        onDateChange={setCurrentDate}
                        onBookingEdit={onBookingEdit || (() => { })}
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
                                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider w-10">From</span>
                                        <CustomSelect value={listStartDate.getMonth()} options={monthNames.map((m, i) => ({ label: m, value: i }))} onChange={(val) => { const d = new Date(listStartDate); d.setMonth(val); setListStartDate(d); }} className="w-[80px] text-xs" />
                                        <CustomSelect value={listStartDate.getDate()} options={Array.from({ length: new Date(listStartDate.getFullYear(), listStartDate.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map((d) => ({ label: d.toString(), value: d }))} onChange={(val) => { const d = new Date(listStartDate); d.setDate(val); setListStartDate(d); }} className="w-[60px] text-xs" />
                                        <CustomSelect value={listStartDate.getFullYear()} options={years.map((y) => ({ label: y.toString(), value: y }))} onChange={(val) => { const d = new Date(listStartDate); d.setFullYear(val); setListStartDate(d); }} className="w-[80px] text-xs text-primary" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider w-10">To</span>
                                        <CustomSelect value={listEndDate.getMonth()} options={monthNames.map((m, i) => ({ label: m, value: i }))} onChange={(val) => { const d = new Date(listEndDate); d.setMonth(val); setListEndDate(d); }} className="w-[80px] text-xs" />
                                        <CustomSelect value={listEndDate.getDate()} options={Array.from({ length: new Date(listEndDate.getFullYear(), listEndDate.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map((d) => ({ label: d.toString(), value: d }))} onChange={(val) => { const d = new Date(listEndDate); d.setDate(val); setListEndDate(d); }} className="w-[60px] text-xs" />
                                        <CustomSelect value={listEndDate.getFullYear()} options={years.map((y) => ({ label: y.toString(), value: y }))} onChange={(val) => { const d = new Date(listEndDate); d.setFullYear(val); setListEndDate(d); }} className="w-[80px] text-xs text-primary" />
                                    </div>
                                </div>
                                {/* Search Bar - 25% larger */}
                                <div className="flex items-center gap-2 w-[350px]">
                                    <div className="relative flex-1">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={listSearchQuery}
                                            onChange={(e) => setListSearchQuery(e.target.value)}
                                            placeholder="Search customer, experience, status..."
                                            className="w-full h-8 bg-muted border border-border rounded-lg pl-8 pr-3 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground"
                                        />
                                    </div>
                                    {listSearchQuery && (
                                        <button
                                            onClick={() => setListSearchQuery("")}
                                            className="h-8 px-2 flex items-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors text-xs"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* RIGHT: Columns + Filter + View Buttons */}
                            <div className="flex items-center gap-2">
                                {/* Column Manager */}
                                <BookingColumnPicker
                                    visibleColumns={visibleColumns}
                                    onToggle={toggleColumn}
                                    onReset={resetToDefault}
                                    onReorder={reorderColumns}
                                />
                                <div className="relative w-[180px]" ref={expPickerRef}>
                                    <div className={cn("w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground cursor-pointer flex items-center justify-between transition-all hover:bg-muted hover:border-sidebar-accent", isExpPickerOpen && "border-primary/50 bg-muted ring-1 ring-primary/20")} onClick={() => setIsExpPickerOpen(!isExpPickerOpen)}>
                                        <span className="font-semibold text-xs truncate">{selectedExpName}</span>
                                        <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform shrink-0 ml-1", isExpPickerOpen && "rotate-180")} />
                                    </div>
                                    {isExpPickerOpen && (
                                        <div className="absolute top-full left-0 w-full mt-2 bg-popover border border-border rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            {experienceOptions.map((exp) => (
                                                <div key={exp.id} className={cn("px-3 py-2 text-xs cursor-pointer flex items-center justify-between transition-colors border-b border-border last:border-0", selectedExperienceId === exp.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")} onClick={() => { setSelectedExperienceId(exp.id); setIsExpPickerOpen(false); }}>
                                                    {exp.name}
                                                    {selectedExperienceId === exp.id && <span className="text-primary">✓</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center bg-muted p-1 rounded-lg border border-border">
                                    <button onClick={() => setViewMode('month')} className={cn("p-1.5 rounded-md transition-all", viewMode === 'month' ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")} title="Month View"><Grid size={14} /></button>
                                    <button onClick={() => setViewMode('week')} className={cn("p-1.5 rounded-md transition-all", viewMode === 'week' ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")} title="Week View"><Columns size={14} /></button>
                                    <button onClick={() => setViewMode('day')} className={cn("p-1.5 rounded-md transition-all", viewMode === 'day' ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")} title="Day View"><Clock size={14} /></button>
                                    <button onClick={() => setViewMode('list')} className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")} title="List View"><List size={14} /></button>

                                    {/* Manifest Button */}
                                    <div className="w-px h-4 bg-border mx-1"></div>
                                    <button
                                        onClick={() => router.push(`/org/${orgSlug}/finance/reports?preset=today`)}
                                        className={cn("p-1.5 rounded-md transition-all", viewMode === 'manifest' ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                        title="Manifest View"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Table */}
                        <BookingsListTable startDate={listStartDate} endDate={listEndDate} searchQuery={listSearchQuery} onBookingClick={onBookingEdit} visibleColumns={visibleColumns} />
                    </div>
                )}
            </div>
        </div >
    );
}


function BookingEventRow({
    event,
    isSelected,
    onClick
}: {
    event: Availability;
    isSelected?: boolean;
    onClick: (e: React.MouseEvent) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const timeText = event.duration_type === 'all_day'
        ? 'All Day'
        : new Date(`1970-01-01T${event.start_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    const openCount = event.max_capacity - (event.booked_count || 0);
    const resources = [event.vehicle_name, event.driver_name, event.guide_name].filter(Boolean).join(", ");
    const bookingRecordsCount = event.booking_records_count || 0;

    return (
        <div
            className={cn(
                "group/item px-2 py-1.5 border-b border-white/70 dark:border-black/20 last:border-0 cursor-pointer transition-colors hover:bg-white/30 dark:hover:bg-black/20",
                isSelected && "bg-black/40 text-primary-foreground hover:bg-black/40"
            )}
            onClick={(e) => {
                e.stopPropagation();
                onClick(e);
            }}
        >
            {/* Line 1: Start Time + Toggle */}
            <div className="flex justify-between items-start w-full gap-2 relative">
                <div className={cn("text-xs font-medium leading-tight text-primary-foreground")}>
                    Start: {timeText}
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="text-primary-foreground/80 hover:text-primary-foreground p-0.5 rounded hover:bg-primary/50 dark:hover:bg-primary/90 transition-colors shrink-0 -mt-1 -mr-1"
                >
                    <ChevronDown size={14} className={cn("transition-transform duration-200 stroke-[3]", isExpanded && "rotate-180")} />
                </button>
            </div>

            {/* Line 2: Capacity Stats */}
            <div className={cn("text-xs font-medium leading-tight text-primary-foreground mt-0.5 flex justify-between items-center")}>
                <span>{event.booked_count || 0}/{event.max_capacity} Capacity</span>
                <span>{openCount} Open</span>
            </div>

            {/* Line 3: Note (if exists) */}
            {event.private_announcement && (
                <div className={cn("text-xs font-medium italic mt-0.5 truncate opacity-90 text-primary-foreground/90")}>
                    {event.private_announcement}
                </div>
            )}

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-1 pt-1 w-full space-y-1 animate-in slide-in-from-top-1 fade-in duration-200">
                    {/* Line 4: Booking Records */}
                    <div className="text-xs font-medium text-primary-foreground/90">
                        {bookingRecordsCount} Booking{bookingRecordsCount !== 1 && 's'}
                    </div>
                    {/* Line 5: Resources (Driver & Guide Only) */}
                    {(event.driver_name || event.guide_name) && (
                        <div className="text-xs font-medium text-primary-foreground/90 truncate">
                            {[
                                event.driver_name ? `Driver: ${event.driver_name}` : null,
                                event.guide_name ? `Guide: ${event.guide_name}` : null
                            ].filter(Boolean).join(" • ")}
                        </div>
                    )}
                </div>
            )}
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
        <div ref={scrollContainerRef} className="h-full overflow-auto rounded-xl relative bg-background">
            <table className="w-full table-fixed border-separate border-spacing-0">
                <thead className="bg-muted/50 backdrop-blur-sm text-muted-foreground text-sm uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-border">
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
                                const daysEvents = isValidDay && cellDateString
                                    ? availabilities
                                        .filter(a => a.start_date === cellDateString)
                                        .sort((a, b) => {
                                            // Primary Sort: Experience Short Code
                                            const expA = a.experience_short_code || "EXP";
                                            const expB = b.experience_short_code || "EXP";
                                            if (expA < expB) return -1;
                                            if (expA > expB) return 1;

                                            // Secondary Sort: Start Time
                                            const timeA = a.start_time || "";
                                            const timeB = b.start_time || "";
                                            return timeA.localeCompare(timeB);
                                        })
                                    : [];

                                return (
                                    <td key={colIndex} className={cn(
                                        "relative group transition-colors p-2 min-h-[160px] align-top border-b border-r border-border",
                                        (!isValidDay || isToday) ? "bg-muted/30" : "hover:bg-muted/30"
                                    )} style={{ minHeight: '160px', height: '160px' }}>
                                        {isValidDay && (
                                            <div className="flex flex-col pl-1 pt-1 gap-1">
                                                <span className={cn("text-base font-medium block mb-2 w-8 h-8 flex items-center justify-center rounded-full", isToday ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground")}>{dayNumber}</span>
                                                {Object.entries(daysEvents.reduce((acc, event) => {
                                                    const key = event.experience_short_code || "EXP";
                                                    if (!acc[key]) acc[key] = [];
                                                    acc[key].push(event);
                                                    return acc;
                                                }, {} as Record<string, typeof daysEvents>)).map(([shortCode, events]) => (
                                                    <div key={shortCode} className="mb-2 bg-primary/50 dark:bg-primary/90 rounded-md overflow-hidden shadow-sm backdrop-blur-sm text-primary-foreground">
                                                        {/* Group Header */}
                                                        <div className="bg-primary dark:bg-black/20 px-2 py-1 text-[10px] font-bold text-primary-foreground/90 tracking-wider uppercase">
                                                            {shortCode}
                                                        </div>
                                                        {/* Events List */}
                                                        <div className="flex flex-col">
                                                            {events.map((event) => (
                                                                <BookingEventRow
                                                                    key={event.id}
                                                                    event={event}
                                                                    isSelected={selectedAvailabilityId === event.id}
                                                                    onClick={(e) => {
                                                                        if (onEventClick) onEventClick(event, e);
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
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
        return availabilities
            .filter(a => a.start_date === dateStr)
            .sort((a, b) => {
                // Primary Sort: Experience Short Code
                const expA = a.experience_short_code || "EXP";
                const expB = b.experience_short_code || "EXP";
                if (expA < expB) return -1;
                if (expA > expB) return 1;

                // Secondary Sort: Start Time
                const timeA = a.start_time || "";
                const timeB = b.start_time || "";
                return timeA.localeCompare(timeB);
            });
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header Row (Sticky) */}
            <div className="flex divide-x divide-border border-b border-border overflow-hidden pr-[var(--scrollbar-width)]">
                {days.map((day) => {
                    const events = getEventsForDay(day);
                    const isDayToday = isToday(day);

                    return (
                        <div key={day.toString()} className={cn(
                            "flex-1 min-w-[220px] p-2 text-center transition-colors border-b border-border",
                            isDayToday ? "bg-primary/20 border-t-2 border-primary" : "bg-card backdrop-blur-sm"
                        )}>
                            <div className="text-muted-foreground text-sm font-medium uppercase tracking-wider">{format(day, 'EEE')}</div>
                            <div className={cn("text-3xl font-black mt-0 tracking-tight", isDayToday ? "text-primary" : "text-foreground")}>
                                {format(day, 'd')}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground font-medium uppercase">
                                {events.length} Event{events.length !== 1 && 's'}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Scrollable Columns */}
            <div className="flex-1 overflow-auto">
                <div className="flex h-full min-h-0 divide-x divide-border">
                    {days.map((day) => {
                        const events = getEventsForDay(day);
                        const isDayToday = isToday(day);
                        const formattedDate = format(day, "yyyy-MM-dd");

                        return (
                            <div key={day.toString()} className={cn(
                                "flex-1 min-w-[220px] flex flex-col transition-colors",
                                isDayToday && "bg-primary/5"
                            )}>
                                {/* Click-to-Create Area (Fill space) */}
                                <div
                                    className="flex-1 p-2 space-y-2 cursor-pointer hover:bg-muted/10"
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
                                                if (onEventClick) onEventClick(event, e);
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
        <div className="flex flex-col h-full bg-background relative group/view">
            {/* Zoom Control */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-popover/90 backdrop-blur border border-border p-1 rounded-lg shadow-xl">
                <button
                    onClick={() => setPixelsPerMinute(Math.max(0.5, pixelsPerMinute - 0.25))}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded"
                >
                    <ZoomOut size={14} />
                </button>
                <span className="text-[10px] font-mono text-muted-foreground min-w-[30px] text-center">{pixelsPerMinute}x</span>
                <button
                    onClick={() => setPixelsPerMinute(Math.min(5, pixelsPerMinute + 0.25))}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded"
                >
                    <ZoomIn size={14} />
                </button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-auto relative custom-scrollbar">

                {/* Header: Time Scale */}
                {/* Header: Time Scale */}
                <div className="sticky top-0 z-40 bg-background border-b border-border flex items-end h-10 shadow-md ring-1 ring-border/5" style={{ width: Math.max(viewWidth + 200, 1000) }}>
                    {/* Sticky Left Corner */}
                    <div className="sticky left-0 w-[200px] h-full bg-background z-50 border-r border-border shrink-0"></div>

                    {/* Time Labels */}
                    <div className="relative flex-1 h-full bg-background">
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
                                    className="absolute bottom-1 text-xs font-medium text-muted-foreground pl-1 border-l-2 border-border h-4"
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
                                    className="absolute top-0 bottom-0 border-r border-border/40"
                                    style={{ left: i * 60 * pixelsPerMinute }}
                                />
                            ))}
                            {/* 15-min Lines */}
                            {Array.from({ length: (totalMinutes / 15) }).map((_, i) => (
                                <div
                                    key={`subgrid-${i}`}
                                    className="absolute top-0 bottom-0 border-r border-border/10"
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
                            <div className="bg-red-500 text-black text-[9px] font-medium px-1 rounded absolute -top-1 -left-4">Now</div>
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
                                    <div className="sticky left-0 bg-background border-b border-border p-2 pl-4 flex items-center justify-between z-20 w-[200px] border-r border-border/50">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-black text-foreground tracking-tight">{exp.short_code}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-medium">{events.length} Trips</span>
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
                                                <div key={event.id} className="flex border-b border-destructive/20 min-h-[50px] bg-destructive/10 items-center px-4">
                                                    <span className="text-destructive font-mono text-xs">INVALID DATA: ID {event.id} Missing Time</span>
                                                </div>
                                            );
                                        }

                                        const startDateTime = new Date(`${startDateStr}T${startTimeStr}`);
                                        if (isNaN(startDateTime.getTime())) {
                                            return (
                                                <div key={event.id} className="flex border-b border-destructive/20 min-h-[50px] bg-destructive/10 items-center px-4">
                                                    <span className="text-destructive font-mono text-xs">INVALID TIME FORMAT: {startTimeStr}</span>
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
                                            <div key={event.id} className="flex border-b border-border/50 min-h-[60px] relative items-center group/row hover:bg-muted/10 transition-colors">
                                                {/* Sticky Left Label (Time?) - Optional */}
                                                <div className="sticky left-0 w-[200px] h-full border-r border-border/50 bg-background z-20 shrink-0 flex items-center justify-end pr-4">
                                                    <span className="text-xs font-mono text-muted-foreground group-hover/row:text-foreground transition-colors">
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
                                                                if (onEventClick) onEventClick(event, e);
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
                    "flex items-center justify-between gap-2 bg-muted/50 border border-border text-foreground text-lg font-medium py-1.5 px-3 rounded-lg hover:border-sidebar-accent transition-all min-w-[fit-content]",
                    className
                )}
            >
                <span>{selectedLabel}</span>
                <ChevronDown size={16} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full min-w-[140px] bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                    {options.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => {
                                onChange(opt.value);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors",
                                value === opt.value ? "text-primary font-medium bg-primary/10" : "text-muted-foreground"
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
    onClick?: (e: React.MouseEvent) => void;
    note?: string;
    isSelected?: boolean;
}) {
    const chipRef = React.useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const openCount = maxCapacity - bookedCount;

    // Uniform text class
    const textClass = `font-medium text-xs leading-tight pointer-events-none ${isSelected ? 'text-primary-foreground' : 'text-primary-foreground group-hover/chip:text-primary-foreground'}`;

    return (
        <div
            className={cn(
                "group/chip mb-1 p-2 rounded-sm shadow-sm cursor-pointer transition-all backdrop-blur-md flex flex-col items-start gap-0.5 min-h-[fit-content] select-none overflow-hidden ring-1 ring-white/10",
                isSelected ? "bg-primary shadow-glow scale-[1.02] z-10" : "bg-primary/90 hover:bg-primary"
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
                    className="text-primary-foreground/80 hover:text-primary-foreground p-0.5 rounded hover:bg-primary-foreground/10 transition-colors shrink-0 -mt-0.5"
                >
                    <ChevronDown size={14} className={cn("transition-transform duration-200 stroke-[3]", isExpanded && "rotate-180")} />
                </button>
            </div>

            {/* Line 2: Capacity Stats */}
            <div className={cn(textClass, "truncate w-full")}>
                {bookedCount}/{maxCapacity} Capacity | {openCount} Open
            </div>

            {/* Line 3: Private Note (Always visible if present) */}
            {note && (
                <div className={cn(textClass, isSelected ? "text-primary-foreground" : "text-primary-foreground/90", "truncate w-full")}>
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
