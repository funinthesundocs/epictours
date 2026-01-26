"use client";

import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
    List,
    MousePointer2,
    X,
    CopyCheck
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Availability, AvailabilityListTable } from "./availability-list-table";
import { BulkActionToolbar } from "./bulk-action-toolbar";
import { BulkEditSheet } from "./bulk-edit-sheet";
import { Settings2 } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";

export function AvailabilityCalendar({
    experiences = [],
    onEventClick,
    onEditEvent,
    currentDate,
    onDateChange,
    selectedExperience,
    onExperienceChange
}: {
    experiences: { id: string, name: string, short_code?: string }[],
    onEventClick?: (date: string, experienceId?: string) => void,
    onEditEvent?: (availability: Availability) => void,
    currentDate: Date,
    onDateChange: (date: Date) => void,
    selectedExperience: string,
    onExperienceChange: (expName: string) => void
}) {
    // State lifted to parent
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    // Data State
    const [availabilities, setAvailabilities] = useState<Availability[]>([]);
    const [staffMap, setStaffMap] = useState<Record<string, string>>({});
    const [routeMap, setRouteMap] = useState<Record<string, string>>({});
    const [vehicleMap, setVehicleMap] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    // Pickers State
    const [isExpPickerOpen, setIsExpPickerOpen] = useState(false);
    const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

    // BATCH SELECTION STATE
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [isDirectBulkEditOpen, setIsDirectBulkEditOpen] = useState(false);

    // Confirm Dialog State
    const [pendingAction, setPendingAction] = useState<{ type: 'delete' | 'duplicate'; count: number } | null>(null);

    // Clear selection when mode changes
    useEffect(() => {
        if (!isSelectMode) setSelectedIds(new Set());
    }, [isSelectMode]);

    // Global Mouse Up to stop dragging
    useEffect(() => {
        const handleMouseUp = () => setIsDragging(false);
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    // Selection Handlers
    const toggleSelection = (id: string, forceState?: boolean) => {
        if (!isSelectMode) return;
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (forceState !== undefined) {
                forceState ? next.add(id) : next.delete(id);
            } else {
                next.has(id) ? next.delete(id) : next.add(id);
            }
            return next;
        });
    };

    const handleBatchDeleteClick = () => {
        if (selectedIds.size === 0) return;
        setPendingAction({ type: 'delete', count: selectedIds.size });
    };

    const handleBatchDuplicateClick = () => {
        if (selectedIds.size === 0) return;
        setPendingAction({ type: 'duplicate', count: selectedIds.size });
    };

    const executeBatchAction = async () => {
        if (!pendingAction) return;

        setIsLoading(true);

        if (pendingAction.type === 'delete') {
            const { error } = await supabase
                .from('availabilities' as any)
                .delete()
                .in('id', Array.from(selectedIds));

            if (error) {
                console.error(error);
                alert("Failed to delete items");
            } else {
                toast.success(`Deleted ${selectedIds.size} items`);
                setAvailabilities(prev => prev.filter(a => !selectedIds.has(a.id)));
                setSelectedIds(new Set());
                setIsSelectMode(false);
            }
        } else if (pendingAction.type === 'duplicate') {
            const itemsToClone = availabilities.filter(a => selectedIds.has(a.id));

            // Prepare payloads
            const payloads = itemsToClone.map(item => {
                const { id, created_at, updated_at, route_name, staff_display, vehicle_name, ...rest } = item as any;
                return { ...rest };
            });

            const { error } = await supabase.from('availabilities' as any).insert(payloads);

            if (error) {
                console.error(error);
                alert("Failed to duplicate items");
            } else {
                onDateChange(new Date(currentDate)); // Trigger refresh
                setSelectedIds(new Set());
                setIsSelectMode(false);
            }
        }

        setIsLoading(false);
        setPendingAction(null);
    };

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
            const { data: vehicles } = await supabase.from('vehicles' as any).select('id, name');

            if (staff) setStaffMap(Object.fromEntries((staff as any[]).map(s => [s.id, s.name])));
            if (routes) setRouteMap(Object.fromEntries((routes as any[]).map(r => [r.id, r.name])));
            if (vehicles) setVehicleMap(Object.fromEntries((vehicles as any[]).map(v => [v.id, v.name])));
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
                .select('*, bookings:bookings(pax_count, status)')
                .eq('experience_id', currentExp.id)
                .gte('start_date', format(startOfMonth, 'yyyy-MM-dd'))
                .lte('start_date', format(endOfMonth, 'yyyy-MM-dd'))
                .order('start_date', { ascending: true });

            if (error) {
                console.error("Error fetching availabilities:", error);
            } else if (data) {
                console.log("Raw Availabilities Data:", data); // Debug Log
                const enriched: Availability[] = data.map((item: any) => {
                    // Calculate bookings
                    const validBookings = (item.bookings || []).filter((b: any) => b.status?.toLowerCase() !== 'cancelled');
                    const totalPax = validBookings.reduce((sum: number, b: any) => sum + Number(b.pax_count || 0), 0);
                    const bookingRecords = validBookings.length;

                    if (bookingRecords > 0) {
                        console.log(`Availability ${item.id} has ${bookingRecords} bookings, total pax: ${totalPax}`);
                    }

                    return {
                        ...item,
                        cooked_booked_count: totalPax, // Debug field
                        booked_count: totalPax, // Override strict DB count with real calculation
                        booking_records_count: bookingRecords,
                        staff_display: item.staff_ids?.map((id: string) => staffMap[id]).filter(Boolean).join(", ") || "",
                        route_name: routeMap[item.transportation_route_id] || "",
                        vehicle_name: vehicleMap[item.vehicle_id] || ""
                    };
                });
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
            toast.success("Availability deleted");
            setAvailabilities(prev => prev.filter(item => item.id !== id));
        }
    };



    // --- NAVIGATION LOGIC ---

    const handlePrevMonth = () => {
        onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleYearSelect = (year: number) => {
        onDateChange(new Date(year, currentDate.getMonth(), 1));
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
        <div className="w-full h-[calc(100vh_-_9rem)] font-sans flex flex-col">
            {/* TOP COMPONENT: Control Bar */}
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 pb-6 border-b border-zinc-900 sticky top-0 z-30">

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
                                            onExperienceChange(exp.name);
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

                    <div className="w-px h-8 bg-zinc-900 mx-2"></div>

                    <ToolbarButton
                        icon={MousePointer2}
                        label="Select"
                        active={isSelectMode}
                        onClick={() => setIsSelectMode(!isSelectMode)}
                    />

                    {/* Spacer to push buttons to far right */}
                    <div className="flex-1"></div>

                    {/* Update Button - Opens bulk edit directly */}
                    <ToolbarButton
                        icon={Edit}
                        label="Update"
                        onClick={() => setIsDirectBulkEditOpen(true)}
                        disabled={isSelectMode}
                    />

                    {/* Create Button Removed - Moved to Page Header */}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className={cn(
                "flex-1 min-h-0 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative",
                viewMode === 'list' && "bg-transparent border-0 shadow-none overflow-visible"
            )}>
                {viewMode === 'calendar' ? (
                    <div className="flex flex-col h-full">
                        {/* Bulk Action Toolbar for Calendar View */}
                        {isSelectMode && (
                            <BulkActionToolbar
                                selectedCount={selectedIds.size}
                                selectedIds={selectedIds}
                                onClearSelection={() => setSelectedIds(new Set())}
                                onSuccess={() => onDateChange(new Date(currentDate))}
                                onExitBulkMode={() => {
                                    setIsSelectMode(false);
                                    setSelectedIds(new Set());
                                }}
                                onDuplicate={handleBatchDuplicateClick}
                            />
                        )}
                        <div className="flex-1 min-h-0">
                            <MonthView
                                selectedExperience={selectedExperience}
                                abbr={abbr}
                                currentDate={currentDate}
                                availabilities={availabilities}
                                onEventClick={(date, id) => onEventClick?.(date, id)}
                                onEditEvent={onEditEvent}
                                // Selection Props
                                isSelectMode={isSelectMode}
                                selectedIds={selectedIds}
                                isDragging={isDragging}
                                onToggleSelection={toggleSelection}
                                onSetIsDragging={setIsDragging}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        {/* Bulk Action Toolbar - shown in select mode */}
                        {isSelectMode && (
                            <BulkActionToolbar
                                selectedCount={selectedIds.size}
                                selectedIds={selectedIds}
                                onClearSelection={() => setSelectedIds(new Set())}
                                onSuccess={() => onDateChange(new Date(currentDate))}
                                onExitBulkMode={() => {
                                    setIsSelectMode(false);
                                    setSelectedIds(new Set());
                                }}
                                onDuplicate={handleBatchDuplicateClick}
                            />
                        )}
                        <div className="flex-1 min-h-0">
                            <AvailabilityListTable
                                data={availabilities}
                                onEdit={(id, item) => {
                                    // Pass the full item to the edit handler
                                    if (!isSelectMode) onEditEvent?.(item);
                                }}
                                onDelete={handleDelete}
                                selectedIds={selectedIds}
                                onSelectionChange={setSelectedIds}
                                isBulkMode={isSelectMode}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Direct Bulk Edit Sheet - opened from header Update button */}
            <BulkEditSheet
                isOpen={isDirectBulkEditOpen}
                onClose={() => setIsDirectBulkEditOpen(false)}
                onSuccess={() => onDateChange(new Date(currentDate))}
                selectedIds={new Set()}
                showDateRangeSelector
            />

            <AlertDialog
                isOpen={!!pendingAction}
                onClose={() => setPendingAction(null)}
                onConfirm={executeBatchAction}
                isDestructive={pendingAction?.type === 'delete'}
                title={pendingAction?.type === 'delete' ? "Delete Items?" : "Duplicate Items?"}
                description={
                    pendingAction?.type === 'delete'
                        ? `Are you sure you want to delete ${pendingAction.count} items? This action cannot be undone.`
                        : `Are you sure you want to duplicate ${pendingAction?.count} items?`
                }
                confirmLabel={pendingAction?.type === 'delete' ? "Delete" : "Duplicate"}
            />
        </div>
    );
}


// --- SUB-COMPONENTS ---

function MonthView({
    selectedExperience,
    abbr,
    currentDate,
    availabilities,
    onEventClick,
    onEditEvent,
    // Destructure new props
    isSelectMode,
    selectedIds,
    isDragging,
    onToggleSelection,
    onSetIsDragging
}: {
    selectedExperience: string,
    abbr: string,
    currentDate: Date,
    availabilities: Availability[],
    onEventClick?: (date: string, experienceId?: string) => void,
    onEditEvent?: (availability: Availability) => void,
    // New Props
    isSelectMode?: boolean,
    selectedIds?: Set<string>,
    isDragging?: boolean,
    onToggleSelection?: (id: string, force?: boolean) => void,
    onSetIsDragging?: (v: boolean) => void
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
                                const cellDateString = isValidDay
                                    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
                                    : null;
                                const isToday = isCurrentMonth && dayNumber === today.getDate();
                                const daysEvents = isValidDay && cellDateString
                                    ? availabilities.filter(a => a.start_date === cellDateString)
                                    : [];

                                return (
                                    <td key={colIndex} className={cn(
                                        "relative group transition-colors p-2 min-h-[160px] align-top border-b border-r border-white/5",
                                        (!isValidDay || isToday) ? "bg-white/5" : "hover:bg-white/5"
                                    )} style={{ minHeight: '160px', height: '160px' }}
                                        onClick={() => {
                                            if (isValidDay && cellDateString) {
                                                // Click handling
                                            }
                                        }}
                                    >
                                        {isValidDay && (
                                            <div className="flex flex-col pl-1 pt-1 gap-1">
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
                                                        bookings={`${event.booking_records_count || 0} Bookings`}
                                                        cap={`${(event.max_capacity - (event.booked_count || 0))} / ${event.max_capacity} Capacity`}
                                                        note={event.private_announcement}
                                                        onClick={(e) => {
                                                            e?.stopPropagation();
                                                            if (!isSelectMode) {
                                                                onEditEvent?.(event);
                                                            }
                                                        }}
                                                        selected={selectedIds?.has(event.id)}
                                                        onMouseDown={(e) => {
                                                            if (isSelectMode) {
                                                                e.stopPropagation();
                                                                onSetIsDragging?.(true);
                                                                onToggleSelection?.(event.id);
                                                            }
                                                        }}
                                                        onMouseEnter={() => {
                                                            if (isSelectMode && isDragging) {
                                                                onToggleSelection?.(event.id, true);
                                                            }
                                                        }}
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

// --- SHARED HELPERS ---

function ToolbarButton({
    icon: Icon,
    label,
    active = false,
    danger = false,
    primary = false,
    disabled = false,
    className,
    onClick
}: {
    icon: any,
    label: string,
    active?: boolean,
    danger?: boolean,
    primary?: boolean,
    disabled?: boolean,
    className?: string,
    onClick?: () => void
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border",
                primary
                    ? "bg-cyan-500 text-black border-cyan-400 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    : active
                        ? "bg-zinc-800 text-white border-zinc-700 shadow-lg ring-1 ring-cyan-500/50"
                        : danger
                            ? "bg-black text-zinc-400 border-zinc-900 hover:bg-red-950/20 hover:text-red-500 hover:border-red-900/50"
                            : "bg-black text-zinc-400 border-zinc-900 hover:bg-zinc-900 hover:text-white hover:border-zinc-800",
                disabled && "opacity-50 cursor-not-allowed pointer-events-none grayscale",
                className
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
    selected,
    onMouseDown,
    onMouseEnter,
    onClick
}: {
    color: string,
    abbr: string,
    time: string,
    bookings: string,
    cap: string,
    note?: string,
    selected?: boolean,
    onMouseDown?: (e: React.MouseEvent) => void,
    onMouseEnter?: () => void,
    onClick?: (e?: React.MouseEvent) => void
}) {
    const style = selected
        ? "bg-cyan-500 border-2 border-white/80 shadow-[0_0_15px_rgba(6,182,212,0.6)] saturate-150 scale-[1.02] z-10"
        : "bg-cyan-600/90 hover:bg-cyan-500";

    return (
        <div
            className={cn("mb-1 p-2 rounded-sm shadow-sm cursor-pointer transition-all backdrop-blur-md flex flex-col items-start gap-0.5 min-h-[fit-content] select-none", style)}
            onClick={onClick}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
        >
            <span className="font-bold text-white text-xs leading-tight">{abbr}</span>
            <span className="text-white font-bold text-xs leading-tight">Start: {time}</span>
            <span className="text-white font-bold text-xs leading-tight">{bookings}</span>
            <span className="text-white font-bold text-xs leading-tight">{cap}</span>
            {note && <span className="text-white font-bold italic text-xs leading-tight mt-0.5">{note}</span>}
        </div>
    );
}

// Just a dummy helper to avoid TS errors if referenced elsewhere (unlikely now)
function hourToPx(start: number, end: number) {
    return true;
}

