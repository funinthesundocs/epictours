"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { SidePanel } from "@/components/ui/side-panel";
import { supabase } from "@/lib/supabase";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Power,
    Users,
    Clock,
    Truck,
    DollarSign,
    MessageSquare,
    Loader2,
    Save,
    AlertTriangle,
    Check,
    Calendar,
    Filter,
    ChevronRight,
    Trash2,
    Bus,
    X,
    Plus,
    Hash,
    EyeOff,
    CalendarDays,
    FileText,
    MapPin,
    UserCheck
} from "lucide-react";

interface BulkEditSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedIds: Set<string>;
    showDateRangeSelector?: boolean;
}

// Update types matching FareHarbor
type UpdateType =
    | 'online_booking_status'
    | 'max_capacity'
    | 'start_time'
    | 'hours_long'
    | 'transportation_route_id'
    | 'vehicle_id'
    | 'pricing_schedule_id'
    | 'booking_option_schedule_id'
    | 'staff_ids'
    | 'private_announcement'
    | 'delete';

const UPDATE_OPTIONS: { type: UpdateType; label: string; icon: any; description: string }[] = [
    { type: 'online_booking_status', label: 'Online Booking Status', icon: Power, description: 'Enable or disable online bookings' },
    { type: 'max_capacity', label: 'Capacity', icon: Users, description: 'Change maximum capacity' },
    { type: 'start_time', label: 'Start Time', icon: Clock, description: 'Update start time' },
    { type: 'hours_long', label: 'Duration', icon: Clock, description: 'Change duration in hours' },
    { type: 'transportation_route_id', label: 'Route Schedule', icon: Truck, description: 'Assign route schedule' },
    { type: 'vehicle_id', label: 'Vehicle', icon: Bus, description: 'Assign vehicle' },
    { type: 'pricing_schedule_id', label: 'Pricing Schedule', icon: DollarSign, description: 'Change pricing' },
    { type: 'booking_option_schedule_id', label: 'Booking Options', icon: DollarSign, description: 'Change booking options' },
    { type: 'staff_ids', label: 'Assigned Staff', icon: Users, description: 'Add or replace staff' },
    { type: 'private_announcement', label: 'Private Notes', icon: MessageSquare, description: 'Update internal notes' },
    { type: 'delete', label: 'Delete Availabilities', icon: Trash2, description: 'Remove selected slots' },
];

// Filter types for Column 1 (matching FareHarbor)
type FilterType =
    | 'date_range'
    | 'status'
    | 'time_range'
    | 'day_of_week'
    | 'unlisted_status'
    | 'has_bookings'
    | 'ending_between'
    | 'duration'
    | 'public_headline'
    | 'private_headline'
    | 'notes'
    | 'capacity'
    | 'customer_type'
    | 'pickup_route'
    | 'crew';

const FILTER_OPTIONS: { type: FilterType; label: string; icon: any; description: string }[] = [
    { type: 'date_range', label: 'Date Range', icon: Calendar, description: 'Filter by start date range' },
    { type: 'day_of_week', label: 'Day of Week', icon: CalendarDays, description: 'Filter by weekday' },
    { type: 'status', label: 'Online Booking Status', icon: Power, description: 'Filter by open/closed status' },
    { type: 'unlisted_status', label: 'Unlisted Status', icon: EyeOff, description: 'Filter by visibility' },
    { type: 'has_bookings', label: 'Has Bookings', icon: UserCheck, description: 'Filter slots with reservations' },
    { type: 'time_range', label: 'Starting Between', icon: Clock, description: 'Filter by start time' },
    { type: 'ending_between', label: 'Ending Between', icon: Clock, description: 'Filter by end time' },
    { type: 'duration', label: 'Length in Hours', icon: Clock, description: 'Filter by duration' },
    { type: 'public_headline', label: 'Public Headline', icon: FileText, description: 'Search public title' },
    { type: 'private_headline', label: 'Private Headline', icon: FileText, description: 'Search internal title' },
    { type: 'notes', label: 'Notes', icon: MessageSquare, description: 'Search notes field' },
    { type: 'capacity', label: 'Total Capacity', icon: Users, description: 'Filter by max capacity' },
    { type: 'customer_type', label: 'Customer Type', icon: Users, description: 'Filter by customer type' },
    { type: 'pickup_route', label: 'Pickup Route', icon: MapPin, description: 'Filter by route' },
    { type: 'crew', label: 'Crew', icon: Users, description: 'Filter by assigned staff' },
];

export function BulkEditSheet({
    isOpen,
    onClose,
    onSuccess,
    selectedIds,
    showDateRangeSelector = false
}: BulkEditSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Date range state for when showDateRangeSelector is true
    const [dateRangeStart, setDateRangeStart] = useState("");
    const [dateRangeEnd, setDateRangeEnd] = useState("");
    const [filteredIds, setFilteredIds] = useState<Set<string>>(new Set());
    const [isFetchingByDate, setIsFetchingByDate] = useState(false);

    // Multi-field selection state
    const [selectedUpdateTypes, setSelectedUpdateTypes] = useState<UpdateType[]>([]);
    const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);

    // Filter selection state for Column 1
    const [selectedFilters, setSelectedFilters] = useState<FilterType[]>([]);
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const filterScrollRef = useRef<HTMLDivElement>(null);
    const [filterValues, setFilterValues] = useState({
        status: "" as "" | "open" | "closed",
        time_start: "",
        time_end: "",
        day_of_week: [] as number[], // 0=Sun, 1=Mon, etc.
        unlisted_status: "" as "" | "listed" | "unlisted",
        has_bookings: "" as "" | "yes" | "no",
        ending_time_start: "",
        ending_time_end: "",
        duration_min: "",
        duration_max: "",
        public_headline: "",
        private_headline: "",
        notes: "",
        capacity_min: "",
        capacity_max: "",
        customer_type_id: "",
        pickup_route_id: "",
        crew_ids: [] as string[],
    });

    // Field values
    const [values, setValues] = useState({
        online_booking_status: "open" as "open" | "closed",
        max_capacity: 0,
        start_time: "",
        hours_long: 0,
        transportation_route_id: "",
        vehicle_id: "",
        pricing_schedule_id: "",
        booking_option_schedule_id: "",
        staff_ids: [] as string[],
        staff_mode: "replace" as "replace" | "add" | "remove",
        private_announcement: ""
    });

    // Reference data
    const [bookingSchedules, setBookingSchedules] = useState<{ id: string, name: string }[]>([]);
    const [pricingSchedules, setPricingSchedules] = useState<{ id: string, name: string }[]>([]);
    const [transportationSchedules, setTransportationSchedules] = useState<{ id: string, name: string }[]>([]);
    const [vehicles, setVehicles] = useState<{ id: string, name: string }[]>([]);
    const [staff, setStaff] = useState<{ id: string, name: string, role: { name: string } | null }[]>([]);
    const [customerTypes, setCustomerTypes] = useState<{ id: string, name: string }[]>([]);
    const [pickupRoutes, setPickupRoutes] = useState<{ id: string, name: string }[]>([]);

    // Fetch reference data
    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const { data: bookings } = await supabase
                    .from("booking_option_schedules" as any)
                    .select("id, name")
                    .order("name");
                setBookingSchedules((bookings as any) || []);

                const { data: pricing } = await supabase
                    .from("pricing_schedules" as any)
                    .select("id, name")
                    .order("name");
                setPricingSchedules((pricing as any) || []);

                const { data: transSchedules } = await supabase
                    .from("schedules" as any)
                    .select("id, name")
                    .order("name");
                setTransportationSchedules((transSchedules as any) || []);

                const { data: vehs } = await supabase
                    .from("vehicles" as any)
                    .select("id, name")
                    .eq("status", "active")
                    .order("name");
                setVehicles((vehs as any) || []);

                const { data: staffData } = await supabase
                    .from("staff" as any)
                    .select("*, role:roles(name)")
                    .order("name");
                const filteredStaff = (staffData || []).filter((s: any) =>
                    s.role?.name && ['Driver', 'Guide'].includes(s.role.name)
                );
                setStaff(filteredStaff as any);

                // Fetch customer types for filter
                const { data: custTypes } = await supabase
                    .from("customer_types" as any)
                    .select("id, name")
                    .order("name");
                setCustomerTypes((custTypes as any) || []);

                // Fetch pickup routes (schedules) for filter
                const { data: routes } = await supabase
                    .from("schedules" as any)
                    .select("id, name")
                    .order("name");
                setPickupRoutes((routes as any) || []);
            } catch (err) {
                console.error("Error loading reference data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [isOpen]);

    // Reset when closed
    useEffect(() => {
        if (!isOpen) {
            setSelectedUpdateTypes([]);
            setIsFieldDropdownOpen(false);
            setSelectedFilters([]);
            setIsFilterDropdownOpen(false);
            setFilterValues({
                status: "",
                time_start: "",
                time_end: "",
                day_of_week: [],
                unlisted_status: "",
                has_bookings: "",
                ending_time_start: "",
                ending_time_end: "",
                duration_min: "",
                duration_max: "",
                public_headline: "",
                private_headline: "",
                notes: "",
                capacity_min: "",
                capacity_max: "",
                customer_type_id: "",
                pickup_route_id: "",
                crew_ids: [],
            });
            setDateRangeStart("");
            setDateRangeEnd("");
            setFilteredIds(new Set());
            setValues({
                online_booking_status: "open",
                max_capacity: 0,
                start_time: "",
                hours_long: 0,
                transportation_route_id: "",
                vehicle_id: "",
                pricing_schedule_id: "",
                booking_option_schedule_id: "",
                staff_ids: [],
                staff_mode: "replace",
                private_announcement: ""
            });
        }
    }, [isOpen]);

    // Filter helpers
    const addFilter = (type: FilterType) => {
        if (!selectedFilters.includes(type)) {
            setSelectedFilters([...selectedFilters, type]);
            // Scroll to bottom after adding filter so Add Filter button stays visible
            setTimeout(() => {
                filterScrollRef.current?.scrollTo({
                    top: filterScrollRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
        setIsFilterDropdownOpen(false);
    };

    const removeFilter = (type: FilterType) => {
        setSelectedFilters(selectedFilters.filter(f => f !== type));
    };

    const availableFilters = FILTER_OPTIONS.filter(o => !selectedFilters.includes(o.type));

    // Fetch availabilities by date range
    const fetchByDateRange = async () => {
        if (!dateRangeStart || !dateRangeEnd) return;

        setIsFetchingByDate(true);
        try {
            const { data, error } = await supabase
                .from('availabilities' as any)
                .select('id')
                .gte('start_date', dateRangeStart)
                .lte('start_date', dateRangeEnd);

            if (error) throw error;
            setFilteredIds(new Set((data || []).map((d: any) => d.id)));
        } catch (err: any) {
            console.error("Error fetching by date range:", err);
            toast.error("Failed to fetch availabilities");
        } finally {
            setIsFetchingByDate(false);
        }
    };

    // Effective IDs: use filteredIds if showDateRangeSelector, otherwise use selectedIds
    const effectiveIds = showDateRangeSelector ? filteredIds : selectedIds;

    const toggleStaff = (id: string) => {
        const current = values.staff_ids;
        if (current.includes(id)) {
            setValues(prev => ({ ...prev, staff_ids: current.filter(s => s !== id) }));
        } else {
            setValues(prev => ({ ...prev, staff_ids: [...current, id] }));
        }
    };

    const getPreviewText = () => {
        if (selectedUpdateTypes.length === 0) return "Select fields to update";

        const count = effectiveIds.size;
        const fieldNames = selectedUpdateTypes.map(type => {
            const option = UPDATE_OPTIONS.find(o => o.type === type);
            return option?.label || type;
        });

        if (selectedUpdateTypes.includes('delete')) {
            return `Delete ${count} availability slot(s)`;
        }

        return `Update ${fieldNames.join(', ')} for ${count} slot(s)`;
    };

    // Helper to add a field to selection
    const addUpdateType = (type: UpdateType) => {
        if (!selectedUpdateTypes.includes(type)) {
            setSelectedUpdateTypes([...selectedUpdateTypes, type]);
        }
        setIsFieldDropdownOpen(false);
    };

    // Helper to remove a field from selection
    const removeUpdateType = (type: UpdateType) => {
        setSelectedUpdateTypes(selectedUpdateTypes.filter(t => t !== type));
    };

    // Get available options (not already selected)
    const availableOptions = UPDATE_OPTIONS.filter(o => !selectedUpdateTypes.includes(o.type));

    const canApply = useMemo(() => {
        if (selectedUpdateTypes.length === 0 || effectiveIds.size === 0) return false;
        if (selectedUpdateTypes.includes('delete')) return true;
        if (selectedUpdateTypes.includes('staff_ids') && values.staff_ids.length === 0) return false;
        return true;
    }, [selectedUpdateTypes, effectiveIds, values]);

    const onSubmit = async () => {
        if (selectedUpdateTypes.length === 0 || effectiveIds.size === 0) return;

        setIsSubmitting(true);
        try {
            const ids = Array.from(effectiveIds);

            // Handle delete separately
            if (selectedUpdateTypes.includes('delete')) {
                const { error } = await supabase
                    .from('availabilities' as any)
                    .delete()
                    .in('id', ids);
                if (error) throw error;
                toast.success(`Deleted ${ids.length} availabilities`);
            } else {
                // Build combined update payload for all selected fields
                let updatePayload: Record<string, any> = {};

                for (const updateType of selectedUpdateTypes) {
                    switch (updateType) {
                        case 'online_booking_status':
                            updatePayload.online_booking_status = values.online_booking_status;
                            break;
                        case 'max_capacity':
                            updatePayload.max_capacity = values.max_capacity;
                            break;
                        case 'start_time':
                            updatePayload.start_time = values.start_time || null;
                            break;
                        case 'hours_long':
                            updatePayload.hours_long = values.hours_long || null;
                            break;
                        case 'transportation_route_id':
                            updatePayload.transportation_route_id = values.transportation_route_id || null;
                            break;
                        case 'vehicle_id':
                            updatePayload.vehicle_id = values.vehicle_id || null;
                            break;
                        case 'pricing_schedule_id':
                            updatePayload.pricing_schedule_id = values.pricing_schedule_id || null;
                            break;
                        case 'booking_option_schedule_id':
                            updatePayload.booking_option_schedule_id = values.booking_option_schedule_id || null;
                            break;
                        case 'staff_ids':
                            updatePayload.staff_ids = values.staff_ids;
                            break;
                        case 'private_announcement':
                            updatePayload.private_announcement = values.private_announcement || null;
                            break;
                    }
                }

                const { error } = await supabase
                    .from('availabilities' as any)
                    .update(updatePayload)
                    .in('id', ids);

                if (error) throw error;
                toast.success(`Updated ${ids.length} availabilities (${selectedUpdateTypes.length} field(s))`);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Bulk update error:", err);
            toast.error(err.message || "Failed to update");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title="Update Availabilities"
            description="Changes will apply to all availabilities in the selected date range and filter set."
            width="w-[90vw] max-w-[1200px]"
            contentClassName="p-0"
        >
            <div className="h-full flex flex-col">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="animate-spin text-cyan-400" size={32} />
                    </div>
                ) : (
                    <>
                        {/* Three Column Layout */}
                        <div className="flex-1 overflow-hidden grid grid-cols-3 divide-x divide-white/10">

                            {/* Column 2: Change (What to update) */}
                            <div className="flex flex-col bg-zinc-900/50 order-2 min-h-0">
                                <div className="px-4 py-3 border-b border-white/10 bg-zinc-900">
                                    <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                                        <span className="w-6 h-6 rounded-full bg-cyan-500 text-black flex items-center justify-center text-xs font-black">2</span>
                                        Change
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        {selectedUpdateTypes.length === 0 ? "Select fields to update" : `${selectedUpdateTypes.length} field(s) selected`}
                                    </p>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4">
                                    {/* Selected Fields - Anchored */}
                                    {selectedUpdateTypes.map(type => {
                                        const option = UPDATE_OPTIONS.find(o => o.type === type);
                                        if (!option) return null;
                                        return (
                                            <div
                                                key={type}
                                                className="w-full text-left px-3 py-3 rounded-lg mb-1 bg-cyan-500/20 border border-cyan-500/50 flex items-center gap-3"
                                            >
                                                <option.icon size={18} className="text-cyan-400" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-cyan-400">{option.label}</div>
                                                    <div className="text-xs text-zinc-500 truncate">{option.description}</div>
                                                </div>
                                                <button
                                                    onClick={() => removeUpdateType(type)}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                                >
                                                    <X size={14} className="text-zinc-400 hover:text-white" />
                                                </button>
                                            </div>
                                        );
                                    })}

                                    {/* Add Field Button / Dropdown */}
                                    {availableOptions.length > 0 && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsFieldDropdownOpen(!isFieldDropdownOpen)}
                                                className="w-full text-left px-3 py-3 rounded-lg border border-dashed border-zinc-700 hover:border-cyan-500/50 hover:bg-white/5 transition-all flex items-center gap-3 text-zinc-400 hover:text-cyan-400"
                                            >
                                                <Plus size={18} />
                                                <span className="text-sm">Add field to update</span>
                                            </button>

                                            {/* Dropdown */}
                                            {isFieldDropdownOpen && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1f24] border border-white/10 rounded-lg shadow-xl z-30 max-h-[300px] overflow-y-auto">
                                                    {availableOptions.map(option => (
                                                        <button
                                                            key={option.type}
                                                            onClick={() => addUpdateType(option.type)}
                                                            className="w-full text-left px-4 py-2.5 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-3 text-zinc-300 group"
                                                        >
                                                            <option.icon size={18} className="text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium">{option.label}</div>
                                                                <div className="text-xs text-zinc-500 truncate">{option.description}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Empty state */}
                                    {selectedUpdateTypes.length === 0 && (
                                        <div className="text-center py-8 text-zinc-500">
                                            <Filter size={32} className="mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">Click "Add field" to select what to update</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Column 1: For these availabilities (Selection Info) */}
                            <div className="flex flex-col bg-zinc-900/30 order-1 min-h-0">
                                <div className="px-4 py-3 border-b border-white/10 bg-zinc-900">
                                    <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                                        <span className="w-6 h-6 rounded-full bg-cyan-500 text-black flex items-center justify-center text-xs font-black">1</span>
                                        For These <span className="text-cyan-400">{showDateRangeSelector ? filteredIds.size : effectiveIds.size}</span> Availabilities
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        {showDateRangeSelector
                                            ? (dateRangeStart && dateRangeEnd ? `${filteredIds.size} availability slot(s) found` : "Select date range and filters")
                                            : (selectedFilters.length > 0 ? `${effectiveIds.size} availability slot(s) found` : "Currently selected items")
                                        }
                                    </p>
                                </div>
                                <div ref={filterScrollRef} className="flex-1 overflow-y-auto p-4">
                                    {showDateRangeSelector ? (
                                        // Date Range Selector
                                        <div className="space-y-4">

                                            {/* Date Range Picker */}
                                            <div className="bg-white/5 rounded-lg p-4">
                                                <div className="text-sm font-medium text-white mb-3">Date Range</div>
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-xs text-zinc-400 mb-1">Start Date</label>
                                                            <input
                                                                type="date"
                                                                value={dateRangeStart}
                                                                onChange={(e) => setDateRangeStart(e.target.value)}
                                                                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                                style={{ colorScheme: 'dark' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-zinc-400 mb-1">End Date</label>
                                                            <input
                                                                type="date"
                                                                value={dateRangeEnd}
                                                                onChange={(e) => setDateRangeEnd(e.target.value)}
                                                                className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                                style={{ colorScheme: 'dark' }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={fetchByDateRange}
                                                        disabled={!dateRangeStart || !dateRangeEnd || isFetchingByDate}
                                                        className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                                    >
                                                        {isFetchingByDate ? <Loader2 className="animate-spin" size={16} /> : <Filter size={16} />}
                                                        Find Availabilities
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Filter Selector Section */}
                                            <div className="border-t border-white/10 pt-4">
                                                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Additional Filters</div>

                                                {/* Selected Filters - Anchored with inputs inside */}
                                                {selectedFilters.includes('status') && (
                                                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <Power size={16} className="text-cyan-400" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-cyan-400">Booking Status</div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFilter('status')}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-zinc-400 hover:text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 pb-3">
                                                            <Combobox
                                                                value={filterValues.status}
                                                                onChange={(val) => setFilterValues(prev => ({ ...prev, status: val as any }))}
                                                                options={[
                                                                    { value: '', label: 'Any' },
                                                                    { value: 'open', label: 'Open' },
                                                                    { value: 'closed', label: 'Closed' }
                                                                ]}
                                                                placeholder="Select status..."
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedFilters.includes('time_range') && (
                                                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <Clock size={16} className="text-cyan-400" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-cyan-400">Starting Between</div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFilter('time_range')}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-zinc-400 hover:text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-xs text-zinc-400 mb-1">From</label>
                                                                <input
                                                                    type="time"
                                                                    value={filterValues.time_start}
                                                                    onChange={(e) => setFilterValues(prev => ({ ...prev, time_start: e.target.value }))}
                                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                                                                    style={{ colorScheme: 'dark' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-zinc-400 mb-1">To</label>
                                                                <input
                                                                    type="time"
                                                                    value={filterValues.time_end}
                                                                    onChange={(e) => setFilterValues(prev => ({ ...prev, time_end: e.target.value }))}
                                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                                                                    style={{ colorScheme: 'dark' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Day of Week Filter */}
                                                {selectedFilters.includes('day_of_week') && (
                                                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <CalendarDays size={16} className="text-cyan-400" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-cyan-400">Day of Week</div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFilter('day_of_week')}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-zinc-400 hover:text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 pb-3 flex flex-wrap gap-1">
                                                            {['Su', 'M', 'T', 'W', 'Th', 'F', 'S'].map((day, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => {
                                                                        const current = filterValues.day_of_week;
                                                                        if (current.includes(idx)) {
                                                                            setFilterValues(prev => ({ ...prev, day_of_week: current.filter(d => d !== idx) }));
                                                                        } else {
                                                                            setFilterValues(prev => ({ ...prev, day_of_week: [...current, idx] }));
                                                                        }
                                                                    }}
                                                                    className={cn(
                                                                        "px-2.5 py-1 rounded text-xs font-medium transition-colors",
                                                                        filterValues.day_of_week.includes(idx)
                                                                            ? "bg-cyan-500 text-black"
                                                                            : "bg-black/50 text-zinc-400 hover:bg-white/10"
                                                                    )}
                                                                >
                                                                    {day}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Unlisted Status Filter */}
                                                {selectedFilters.includes('unlisted_status') && (
                                                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <EyeOff size={16} className="text-cyan-400" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-cyan-400">Unlisted Status</div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFilter('unlisted_status')}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-zinc-400 hover:text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 pb-3">
                                                            <Combobox
                                                                value={filterValues.unlisted_status}
                                                                onChange={(val) => setFilterValues(prev => ({ ...prev, unlisted_status: val as any }))}
                                                                options={[
                                                                    { value: '', label: 'Any' },
                                                                    { value: 'listed', label: 'Listed (Public)' },
                                                                    { value: 'unlisted', label: 'Unlisted (Hidden)' }
                                                                ]}
                                                                placeholder="Select visibility..."
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Has Bookings Filter */}
                                                {selectedFilters.includes('has_bookings') && (
                                                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <UserCheck size={16} className="text-cyan-400" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-cyan-400">Has Bookings</div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFilter('has_bookings')}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-zinc-400 hover:text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 pb-3">
                                                            <Combobox
                                                                value={filterValues.has_bookings}
                                                                onChange={(val) => setFilterValues(prev => ({ ...prev, has_bookings: val as any }))}
                                                                options={[
                                                                    { value: '', label: 'Any' },
                                                                    { value: 'yes', label: 'Has Bookings' },
                                                                    { value: 'no', label: 'No Bookings' }
                                                                ]}
                                                                placeholder="Select booking status..."
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Ending Between Filter */}
                                                {selectedFilters.includes('ending_between') && (
                                                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <Clock size={16} className="text-cyan-400" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-cyan-400">Ending Between</div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFilter('ending_between')}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-zinc-400 hover:text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-xs text-zinc-400 mb-1">From</label>
                                                                <input
                                                                    type="time"
                                                                    value={filterValues.ending_time_start}
                                                                    onChange={(e) => setFilterValues(prev => ({ ...prev, ending_time_start: e.target.value }))}
                                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                                                                    style={{ colorScheme: 'dark' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-zinc-400 mb-1">To</label>
                                                                <input
                                                                    type="time"
                                                                    value={filterValues.ending_time_end}
                                                                    onChange={(e) => setFilterValues(prev => ({ ...prev, ending_time_end: e.target.value }))}
                                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                                                                    style={{ colorScheme: 'dark' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Duration Filter */}
                                                {selectedFilters.includes('duration') && (
                                                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <Clock size={16} className="text-cyan-400" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-cyan-400">Length in Hours</div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFilter('duration')}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-zinc-400 hover:text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-xs text-zinc-400 mb-1">Min</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.5"
                                                                    min="0"
                                                                    value={filterValues.duration_min}
                                                                    onChange={(e) => setFilterValues(prev => ({ ...prev, duration_min: e.target.value }))}
                                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-zinc-400 mb-1">Max</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.5"
                                                                    min="0"
                                                                    value={filterValues.duration_max}
                                                                    onChange={(e) => setFilterValues(prev => ({ ...prev, duration_max: e.target.value }))}
                                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                                                                    placeholder="24"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Public Headline Filter */}
                                                {selectedFilters.includes('public_headline') && (
                                                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <FileText size={16} className="text-cyan-400" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-cyan-400">Public Headline</div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFilter('public_headline')}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-zinc-400 hover:text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 pb-3">
                                                            <input
                                                                type="text"
                                                                value={filterValues.public_headline}
                                                                onChange={(e) => setFilterValues(prev => ({ ...prev, public_headline: e.target.value }))}
                                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                                                                placeholder="Search public title..."
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Private Headline Filter */}
                                                {selectedFilters.includes('private_headline') && (
                                                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <FileText size={16} className="text-cyan-400" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-cyan-400">Private Headline</div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFilter('private_headline')}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-zinc-400 hover:text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 pb-3">
                                                            <input
                                                                type="text"
                                                                value={filterValues.private_headline}
                                                                onChange={(e) => setFilterValues(prev => ({ ...prev, private_headline: e.target.value }))}
                                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                                                                placeholder="Search internal title..."
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Notes Filter */}
                                                {selectedFilters.includes('notes') && (
                                                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <MessageSquare size={16} className="text-cyan-400" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-cyan-400">Notes</div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFilter('notes')}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-zinc-400 hover:text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 pb-3">
                                                            <input
                                                                type="text"
                                                                value={filterValues.notes}
                                                                onChange={(e) => setFilterValues(prev => ({ ...prev, notes: e.target.value }))}
                                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                                                                placeholder="Search notes..."
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Capacity Filter */}
                                                {selectedFilters.includes('capacity') && (
                                                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <Users size={16} className="text-cyan-400" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-cyan-400">Total Capacity</div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFilter('capacity')}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-zinc-400 hover:text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-xs text-zinc-400 mb-1">Min</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={filterValues.capacity_min}
                                                                    onChange={(e) => setFilterValues(prev => ({ ...prev, capacity_min: e.target.value }))}
                                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-zinc-400 mb-1">Max</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    value={filterValues.capacity_max}
                                                                    onChange={(e) => setFilterValues(prev => ({ ...prev, capacity_max: e.target.value }))}
                                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                                                                    placeholder="100"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Customer Type Filter */}
                                                {selectedFilters.includes('customer_type') && (
                                                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <Users size={16} className="text-cyan-400" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-cyan-400">Customer Type</div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFilter('customer_type')}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-zinc-400 hover:text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 pb-3">
                                                            <Combobox
                                                                value={filterValues.customer_type_id}
                                                                onChange={(val) => setFilterValues(prev => ({ ...prev, customer_type_id: val }))}
                                                                options={[
                                                                    { value: '', label: 'Any' },
                                                                    ...customerTypes.map(ct => ({ value: ct.id, label: ct.name }))
                                                                ]}
                                                                placeholder="Select customer type..."
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Pickup Route Filter */}
                                                {selectedFilters.includes('pickup_route') && (
                                                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <MapPin size={16} className="text-cyan-400" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-cyan-400">Pickup Route</div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFilter('pickup_route')}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-zinc-400 hover:text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 pb-3">
                                                            <Combobox
                                                                value={filterValues.pickup_route_id}
                                                                onChange={(val) => setFilterValues(prev => ({ ...prev, pickup_route_id: val }))}
                                                                options={[
                                                                    { value: '', label: 'Any' },
                                                                    ...pickupRoutes.map(r => ({ value: r.id, label: r.name }))
                                                                ]}
                                                                placeholder="Select pickup route..."
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Crew Filter */}
                                                {selectedFilters.includes('crew') && (
                                                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <Users size={16} className="text-cyan-400" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-cyan-400">Crew</div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFilter('crew')}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-zinc-400 hover:text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 pb-3 max-h-[150px] overflow-y-auto">
                                                            {staff.map(s => (
                                                                <label key={s.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-white/5 px-1 rounded">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={filterValues.crew_ids.includes(s.id)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) {
                                                                                setFilterValues(prev => ({ ...prev, crew_ids: [...prev.crew_ids, s.id] }));
                                                                            } else {
                                                                                setFilterValues(prev => ({ ...prev, crew_ids: prev.crew_ids.filter(id => id !== s.id) }));
                                                                            }
                                                                        }}
                                                                        className="rounded border-white/20 bg-black text-cyan-500 focus:ring-cyan-500"
                                                                    />
                                                                    <span className="text-xs text-zinc-300">{s.name}</span>
                                                                    {s.role?.name && (
                                                                        <span className="text-xs text-zinc-500">({s.role.name})</span>
                                                                    )}
                                                                </label>
                                                            ))}
                                                            {staff.length === 0 && (
                                                                <div className="text-xs text-zinc-500 py-2">No staff found</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Add Filter Button / Dropdown - only show status and time_range since date_range is already shown */}
                                                {availableFilters.filter(f => f.type !== 'date_range').length > 0 && (
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                                                            className="w-full text-left px-3 py-2 rounded-lg border border-dashed border-zinc-700 hover:border-cyan-500/50 hover:bg-white/5 transition-all flex items-center gap-3 text-zinc-400 hover:text-cyan-400"
                                                        >
                                                            <Plus size={16} />
                                                            <span className="text-sm">Add filter</span>
                                                        </button>

                                                        {isFilterDropdownOpen && (
                                                            <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1a1f24] border border-white/10 rounded-lg shadow-xl z-30 max-h-[300px] overflow-y-auto">
                                                                {availableFilters.filter(f => f.type !== 'date_range').map(option => (
                                                                    <button
                                                                        key={option.type}
                                                                        onClick={() => addFilter(option.type)}
                                                                        className="w-full text-left px-4 py-2.5 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-3 text-zinc-300 group"
                                                                    >
                                                                        <option.icon size={16} className="text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="text-sm font-medium">{option.label}</div>
                                                                            <div className="text-xs text-zinc-500 truncate">{option.description}</div>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        // Normal Selection Summary + Filter Selector
                                        <div className="space-y-4">
                                            {/* Filter Selector Section */}
                                            <div>
                                                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Additional Filters</div>

                                                {/* Selected Filters - Anchored with inputs inside */}
                                                {selectedFilters.includes('date_range') && (
                                                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <Calendar size={16} className="text-cyan-400" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-cyan-400">Date Range</div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFilter('date_range')}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-zinc-400 hover:text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-xs text-zinc-400 mb-1">From</label>
                                                                <input
                                                                    type="date"
                                                                    value={dateRangeStart}
                                                                    onChange={(e) => setDateRangeStart(e.target.value)}
                                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                                                                    style={{ colorScheme: 'dark' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-zinc-400 mb-1">To</label>
                                                                <input
                                                                    type="date"
                                                                    value={dateRangeEnd}
                                                                    onChange={(e) => setDateRangeEnd(e.target.value)}
                                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                                                                    style={{ colorScheme: 'dark' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedFilters.includes('status') && (
                                                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <Power size={16} className="text-cyan-400" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-cyan-400">Booking Status</div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFilter('status')}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-zinc-400 hover:text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 pb-3">
                                                            <Combobox
                                                                value={filterValues.status}
                                                                onChange={(val) => setFilterValues(prev => ({ ...prev, status: val as any }))}
                                                                options={[
                                                                    { value: '', label: 'Any' },
                                                                    { value: 'open', label: 'Open' },
                                                                    { value: 'closed', label: 'Closed' }
                                                                ]}
                                                                placeholder="Select status..."
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedFilters.includes('time_range') && (
                                                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                                                        <div className="px-3 py-2 flex items-center gap-3">
                                                            <Clock size={16} className="text-cyan-400" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-cyan-400">Time Range</div>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFilter('time_range')}
                                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                            >
                                                                <X size={14} className="text-zinc-400 hover:text-white" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-xs text-zinc-400 mb-1">From</label>
                                                                <input
                                                                    type="time"
                                                                    value={filterValues.time_start}
                                                                    onChange={(e) => setFilterValues(prev => ({ ...prev, time_start: e.target.value }))}
                                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                                                                    style={{ colorScheme: 'dark' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-zinc-400 mb-1">To</label>
                                                                <input
                                                                    type="time"
                                                                    value={filterValues.time_end}
                                                                    onChange={(e) => setFilterValues(prev => ({ ...prev, time_end: e.target.value }))}
                                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                                                                    style={{ colorScheme: 'dark' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Add Filter Button / Dropdown */}
                                                {availableFilters.length > 0 && (
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                                                            className="w-full text-left px-3 py-2 rounded-lg border border-dashed border-zinc-700 hover:border-cyan-500/50 hover:bg-white/5 transition-all flex items-center gap-3 text-zinc-400 hover:text-cyan-400"
                                                        >
                                                            <Plus size={16} />
                                                            <span className="text-sm">Add filter</span>
                                                        </button>

                                                        {isFilterDropdownOpen && (
                                                            <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1a1f24] border border-white/10 rounded-lg shadow-xl z-30 max-h-[300px] overflow-y-auto">
                                                                {availableFilters.map(option => (
                                                                    <button
                                                                        key={option.type}
                                                                        onClick={() => addFilter(option.type)}
                                                                        className="w-full text-left px-4 py-2.5 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-3 text-zinc-300 group"
                                                                    >
                                                                        <option.icon size={16} className="text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="text-sm font-medium">{option.label}</div>
                                                                            <div className="text-xs text-zinc-500 truncate">{option.description}</div>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Column 3: To (New Value) */}
                            <div className="flex flex-col bg-zinc-900/20 order-3 min-h-0">
                                <div className="px-4 py-3 border-b border-white/10 bg-zinc-900">
                                    <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                                        <span className="w-6 h-6 rounded-full bg-cyan-500 text-black flex items-center justify-center text-xs font-black">3</span>
                                        To
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1">Set new value</p>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4">
                                    {selectedUpdateTypes.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                                            <div className="text-center">
                                                <Filter size={32} className="mx-auto mb-2 opacity-50" />
                                                <p>Select an update type first</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Render inputs in order of selection */}
                                            {selectedUpdateTypes.map(type => {
                                                const option = UPDATE_OPTIONS.find(o => o.type === type);
                                                if (!option) return null;

                                                return (
                                                    <div key={type} className="bg-white/5 rounded-lg p-4">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <option.icon size={16} className="text-cyan-400" />
                                                            <span className="text-sm font-medium text-white">{option.label}</span>
                                                        </div>

                                                        {/* Status */}
                                                        {type === 'online_booking_status' && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setValues(prev => ({ ...prev, online_booking_status: 'open' }))}
                                                                    className={cn(
                                                                        "flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all",
                                                                        values.online_booking_status === 'open'
                                                                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                                                            : "bg-black/30 border-white/10 text-zinc-400"
                                                                    )}
                                                                >
                                                                    Open
                                                                </button>
                                                                <button
                                                                    onClick={() => setValues(prev => ({ ...prev, online_booking_status: 'closed' }))}
                                                                    className={cn(
                                                                        "flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all",
                                                                        values.online_booking_status === 'closed'
                                                                            ? "bg-red-500/20 border-red-500 text-red-400"
                                                                            : "bg-black/30 border-white/10 text-zinc-400"
                                                                    )}
                                                                >
                                                                    Closed
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* Capacity */}
                                                        {type === 'max_capacity' && (
                                                            <input
                                                                type="number"
                                                                value={values.max_capacity}
                                                                onChange={(e) => setValues(prev => ({ ...prev, max_capacity: Number(e.target.value) }))}
                                                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white"
                                                                placeholder="Enter capacity"
                                                            />
                                                        )}

                                                        {/* Start Time */}
                                                        {type === 'start_time' && (
                                                            <input
                                                                type="time"
                                                                value={values.start_time}
                                                                onChange={(e) => setValues(prev => ({ ...prev, start_time: e.target.value }))}
                                                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white"
                                                                style={{ colorScheme: 'dark' }}
                                                            />
                                                        )}

                                                        {/* Duration */}
                                                        {type === 'hours_long' && (
                                                            <input
                                                                type="number"
                                                                value={values.hours_long}
                                                                onChange={(e) => setValues(prev => ({ ...prev, hours_long: Number(e.target.value) }))}
                                                                step="0.5"
                                                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white"
                                                                placeholder="Enter hours"
                                                            />
                                                        )}

                                                        {/* Route */}
                                                        {type === 'transportation_route_id' && (
                                                            <Combobox
                                                                value={values.transportation_route_id}
                                                                onChange={(val) => setValues(prev => ({ ...prev, transportation_route_id: val }))}
                                                                options={[
                                                                    { value: '', label: 'None' },
                                                                    ...transportationSchedules.map(s => ({ value: s.id, label: s.name }))
                                                                ]}
                                                                placeholder="Select route..."
                                                            />
                                                        )}

                                                        {/* Vehicle */}
                                                        {type === 'vehicle_id' && (
                                                            <Combobox
                                                                value={values.vehicle_id}
                                                                onChange={(val) => setValues(prev => ({ ...prev, vehicle_id: val }))}
                                                                options={[
                                                                    { value: '', label: 'None' },
                                                                    ...vehicles.map(v => ({ value: v.id, label: v.name }))
                                                                ]}
                                                                placeholder="Select vehicle..."
                                                            />
                                                        )}

                                                        {/* Pricing */}
                                                        {type === 'pricing_schedule_id' && (
                                                            <Combobox
                                                                value={values.pricing_schedule_id}
                                                                onChange={(val) => setValues(prev => ({ ...prev, pricing_schedule_id: val }))}
                                                                options={[
                                                                    { value: '', label: 'None' },
                                                                    ...pricingSchedules.map(s => ({ value: s.id, label: s.name }))
                                                                ]}
                                                                placeholder="Select pricing..."
                                                            />
                                                        )}

                                                        {/* Booking Options */}
                                                        {type === 'booking_option_schedule_id' && (
                                                            <Combobox
                                                                value={values.booking_option_schedule_id}
                                                                onChange={(val) => setValues(prev => ({ ...prev, booking_option_schedule_id: val }))}
                                                                options={[
                                                                    { value: '', label: 'None' },
                                                                    ...bookingSchedules.map(s => ({ value: s.id, label: s.name }))
                                                                ]}
                                                                placeholder="Select booking options..."
                                                            />
                                                        )}

                                                        {/* Staff */}
                                                        {type === 'staff_ids' && (
                                                            <div className="space-y-3">
                                                                <div className="flex gap-2">
                                                                    {(['replace', 'add', 'remove'] as const).map(mode => (
                                                                        <button
                                                                            key={mode}
                                                                            onClick={() => setValues(prev => ({ ...prev, staff_mode: mode }))}
                                                                            className={cn(
                                                                                "flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all capitalize",
                                                                                values.staff_mode === mode
                                                                                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                                                                                    : "bg-black/30 border-white/10 text-zinc-400"
                                                                            )}
                                                                        >
                                                                            {mode}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {staff.map(member => (
                                                                        <button
                                                                            key={member.id}
                                                                            onClick={() => toggleStaff(member.id)}
                                                                            className={cn(
                                                                                "px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                                                                                values.staff_ids.includes(member.id)
                                                                                    ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                                                                                    : "bg-black/30 border-white/10 text-zinc-400"
                                                                            )}
                                                                        >
                                                                            {member.name}
                                                                        </button>
                                                                    ))}
                                                                    {staff.length === 0 && (
                                                                        <span className="text-zinc-500 text-sm">No staff configured</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Notes */}
                                                        {type === 'private_announcement' && (
                                                            <textarea
                                                                value={values.private_announcement}
                                                                onChange={(e) => setValues(prev => ({ ...prev, private_announcement: e.target.value }))}
                                                                rows={4}
                                                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white resize-none"
                                                                placeholder="Internal notes..."
                                                            />
                                                        )}

                                                        {/* Delete */}
                                                        {type === 'delete' && (
                                                            <div className="flex items-start gap-3 bg-red-950/30 border border-red-500/30 rounded-lg p-3">
                                                                <Trash2 className="text-red-400 shrink-0 mt-0.5" size={18} />
                                                                <div>
                                                                    <div className="text-red-400 font-bold text-sm">Delete {showDateRangeSelector ? filteredIds.size : effectiveIds.size} slot(s)</div>
                                                                    <p className="text-xs text-red-300/70">This cannot be undone.</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-between items-center gap-4 px-6 py-4 border-t border-white/10 bg-[#0b1115]">
                            <div className="text-sm text-zinc-400">
                                {getPreviewText()}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onSubmit}
                                    disabled={isSubmitting || !canApply}
                                    className={cn(
                                        "px-6 py-2 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                        selectedUpdateTypes.includes('delete')
                                            ? "bg-red-500 hover:bg-red-400 text-white"
                                            : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                                    )}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    {selectedUpdateTypes.includes('delete') ? `Delete ${effectiveIds.size} Slots` : `Apply to ${effectiveIds.size} Slots`}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </SidePanel >
    );
}
