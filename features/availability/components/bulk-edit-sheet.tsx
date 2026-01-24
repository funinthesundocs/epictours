"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { SidePanel } from "@/components/ui/side-panel";
import { supabase } from "@/lib/supabase";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
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

    | 'has_bookings'
    | 'ending_between'
    | 'duration'

    | 'notes'
    | 'capacity'
    | 'customer_type'
    | 'pickup_route'
    | 'crew'
    | 'vehicle_id'
    | 'pricing_schedule_id'
    | 'booking_option_schedule_id';

const FILTER_OPTIONS: { type: FilterType; label: string; icon: any; description: string }[] = [
    { type: 'date_range', label: 'Date Range', icon: Calendar, description: 'Filter by start date range' },
    { type: 'day_of_week', label: 'Day of Week', icon: CalendarDays, description: 'Filter by weekday' },
    { type: 'status', label: 'Online Booking Status', icon: Power, description: 'Filter by open/closed status' },

    { type: 'has_bookings', label: 'Has Bookings', icon: UserCheck, description: 'Filter slots with reservations' },
    { type: 'time_range', label: 'Starting Between', icon: Clock, description: 'Filter by start time' },
    { type: 'ending_between', label: 'Ending Between', icon: Clock, description: 'Filter by end time' },
    { type: 'duration', label: 'Length in Hours', icon: Clock, description: 'Filter by duration' },

    { type: 'notes', label: 'Internal Notes', icon: MessageSquare, description: 'Search internal notes' },
    { type: 'capacity', label: 'Total Capacity', icon: Users, description: 'Filter by max capacity' },
    { type: 'customer_type', label: 'Customer Type', icon: Users, description: 'Filter by customer type' },
    { type: 'pickup_route', label: 'Route Schedule', icon: MapPin, description: 'Filter by route' },
    { type: 'crew', label: 'Assigned Staff', icon: Users, description: 'Filter by assigned staff' },
    { type: 'vehicle_id', label: 'Vehicle', icon: Bus, description: 'Filter by vehicle' },
    { type: 'pricing_schedule_id', label: 'Pricing Schedule', icon: DollarSign, description: 'Filter by pricing' },
    { type: 'booking_option_schedule_id', label: 'Booking Options', icon: DollarSign, description: 'Filter by booking options' },
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
    const [selectedData, setSelectedData] = useState<any[]>([]);
    const [isFetchingByDate, setIsFetchingByDate] = useState(false);
    const [isFetchingByIds, setIsFetchingByIds] = useState(false);

    // Multi-field selection state
    const [selectedUpdateTypes, setSelectedUpdateTypes] = useState<UpdateType[]>([]);
    const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);

    // Filter selection state for Column 1
    const [selectedFilters, setSelectedFilters] = useState<FilterType[]>([]);
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [filterDropdownPosition, setFilterDropdownPosition] = useState<'above' | 'below'>('below');
    const filterScrollRef = useRef<HTMLDivElement>(null);
    const filterButtonRef = useRef<HTMLButtonElement>(null);

    // Field dropdown position state
    const [fieldDropdownPosition, setFieldDropdownPosition] = useState<'above' | 'below'>('below');
    const fieldButtonRef = useRef<HTMLButtonElement>(null);
    const changeScrollRef = useRef<HTMLDivElement>(null);
    const toScrollRef = useRef<HTMLDivElement>(null);
    const [filterValues, setFilterValues] = useState({
        status: "" as "" | "open" | "closed",
        time_start: "",
        time_end: "",
        day_of_week: [] as number[], // 0=Sun, 1=Mon, etc.

        has_bookings: "" as "" | "yes" | "no",
        ending_time_start: "",
        ending_time_end: "",
        duration_min: "",
        duration_max: "",

        notes: "",
        capacity_min: "",
        capacity_max: "",
        customer_type_id: "",
        pickup_route_id: "",
        crew_ids: [] as string[],
        vehicle_id: "",
        pricing_schedule_id: "",
        booking_option_schedule_id: "",
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

                // Fetch Roles explicitly to avoid Join issues
                const { data: rolesData } = await supabase
                    .from("roles" as any)
                    .select("id, name");
                const roleMap = new Map((rolesData as any[] || []).map(r => [r.id, r.name]));

                // Fetch Staff (without inner join reliance)
                const { data: staffData, error: staffError } = await supabase
                    .from("staff" as any)
                    .select("*")
                    .order("name");

                if (staffError) {
                    console.error("Bulk Edit Staff Fetch Error:", staffError);
                }

                // Manually map and filter
                const filteredStaff = (staffData || []).map((s: any) => {
                    const rName = s.role_id ? roleMap.get(s.role_id) : null;
                    return { ...s, role: { name: rName } };
                }).filter((s: any) => {
                    const rName = s.role?.name;
                    return rName && ['driver', 'guide'].includes(rName.toLowerCase());
                });

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

                has_bookings: "",
                ending_time_start: "",
                ending_time_end: "",
                duration_min: "",
                duration_max: "",

                notes: "",
                capacity_min: "",
                capacity_max: "",
                customer_type_id: "",
                pickup_route_id: "",
                crew_ids: [],
                vehicle_id: "",
                pricing_schedule_id: "",
                booking_option_schedule_id: "",
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

    // Auto-fetch when date range or filter values change
    useEffect(() => {
        if (showDateRangeSelector && dateRangeStart && dateRangeEnd) {
            fetchByDateRange();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRangeStart, dateRangeEnd, selectedFilters, filterValues]);

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

    const availableFilters = FILTER_OPTIONS.filter(o => {
        if (selectedFilters.includes(o.type)) return false;
        // In Multi-Select Mode (Calendar Selection), Date Range and Day of Week filters don't apply
        if (!showDateRangeSelector && (o.type === 'date_range' || o.type === 'day_of_week')) return false;
        return true;
    });

    // Fetch availabilities by date range with all server-side filters
    const fetchByDateRange = async () => {
        if (!dateRangeStart || !dateRangeEnd) return;

        setIsFetchingByDate(true);
        try {
            // Start building query (WITHOUT inner join which fails)
            const selectFields = 'id, start_date, end_date, start_time, hours_long, online_booking_status, max_capacity, transportation_route_id, vehicle_id, pricing_schedule_id, booking_option_schedule_id, private_announcement';
            let query = supabase
                .from('availabilities' as any)
                .select(selectFields)
                .gte('start_date', dateRangeStart)
                .lte('start_date', dateRangeEnd);

            // ... (Server-side filters remain same) ...
            if (selectedFilters.includes('status') && filterValues.status) {
                query = query.eq('online_booking_status', filterValues.status);
            }
            if (selectedFilters.includes('duration')) {
                if (filterValues.duration_min) query = query.gte('hours_long', parseFloat(filterValues.duration_min));
                if (filterValues.duration_max) query = query.lte('hours_long', parseFloat(filterValues.duration_max));
            }
            if (selectedFilters.includes('capacity')) {
                if (filterValues.capacity_min) query = query.gte('max_capacity', parseInt(filterValues.capacity_min, 10));
                if (filterValues.capacity_max) query = query.lte('max_capacity', parseInt(filterValues.capacity_max, 10));
            }
            if (selectedFilters.includes('notes') && filterValues.notes) query = query.ilike('private_announcement', `%${filterValues.notes}%`);
            if (selectedFilters.includes('pickup_route') && filterValues.pickup_route_id) query = query.eq('transportation_route_id', filterValues.pickup_route_id);
            if (selectedFilters.includes('vehicle_id') && filterValues.vehicle_id) query = query.eq('vehicle_id', filterValues.vehicle_id);
            if (selectedFilters.includes('pricing_schedule_id') && filterValues.pricing_schedule_id) query = query.eq('pricing_schedule_id', filterValues.pricing_schedule_id);
            if (selectedFilters.includes('booking_option_schedule_id') && filterValues.booking_option_schedule_id) query = query.eq('booking_option_schedule_id', filterValues.booking_option_schedule_id);

            const { data, error } = await query;
            if (error) throw error;

            let fetchedData = data || [];

            // Manual Fetch of Crew Assignments
            if (fetchedData.length > 0) {
                const ids = fetchedData.map((d: any) => d.id);
                const { data: crewData } = await supabase
                    .from('crew_assignments' as any)
                    .select('availability_id, staff_id')
                    .in('availability_id', ids);

                // Merge crew data
                const crewMap = new Map(); // availability_id -> [ { staff_id } ]
                (crewData || []).forEach((c: any) => {
                    if (!crewMap.has(c.availability_id)) crewMap.set(c.availability_id, []);
                    crewMap.get(c.availability_id).push({ staff_id: c.staff_id });
                });

                fetchedData = fetchedData.map((d: any) => ({
                    ...d,
                    crew_assignments: crewMap.get(d.id) || []
                }));
            }

            // Now apply client-side filters
            let filteredData = fetchedData;

            // ... (Client-side filters: day_of_week, ending_between, crew) ...
            if (selectedFilters.includes('day_of_week') && filterValues.day_of_week.length > 0) {
                filteredData = filteredData.filter((item: any) => {
                    const startDate = new Date(item.start_date + 'T00:00:00');
                    const dayIndex = startDate.getDay();
                    return filterValues.day_of_week.includes(dayIndex);
                });
            }
            if (selectedFilters.includes('ending_between')) {
                if (filterValues.ending_time_start) filteredData = filteredData.filter((item: any) => item.end_time && item.end_time >= filterValues.ending_time_start);
                if (filterValues.ending_time_end) filteredData = filteredData.filter((item: any) => item.end_time && item.end_time <= filterValues.ending_time_end);
            }
            if (selectedFilters.includes('crew') && filterValues.crew_ids.length > 0) {
                filteredData = filteredData.filter((item: any) => {
                    const assignedStaffIds = (item.crew_assignments || []).map((ca: any) => ca.staff_id);
                    return filterValues.crew_ids.some((id: string) => assignedStaffIds.includes(id));
                });
            }

            setFilteredIds(new Set(filteredData.map((d: any) => d.id)));
            setSelectedData(filteredData);

        } catch (err: any) {
            console.error("Error calling fetchByDateRange:", err);
            toast.error(`Failed to fetch availabilities: ${err.message || 'Unknown error'}`);
        } finally {
            setIsFetchingByDate(false);
        }
    };

    // Fetch data for directly selected IDs (when not using date range selector)
    useEffect(() => {
        if (!showDateRangeSelector && isOpen && selectedIds.size > 0) {
            const ids = Array.from(selectedIds);
            fetchByIds(ids);
        } else if (!showDateRangeSelector) {
            setSelectedData([]);
        }
    }, [showDateRangeSelector, isOpen, selectedIds]);

    const fetchByIds = async (ids: string[]) => {
        setIsFetchingByIds(true);
        try {
            const { data, error } = await supabase
                .from('availabilities' as any)
                .select('id, start_date, end_date, start_time, hours_long, online_booking_status, max_capacity, transportation_route_id, vehicle_id, pricing_schedule_id, booking_option_schedule_id, private_announcement')
                .in('id', ids);

            if (error) throw error;

            let fetchedData = data || [];

            // Manual Fetch of Crew Assignments
            if (fetchedData.length > 0) {
                const { data: crewData } = await supabase
                    .from('crew_assignments' as any)
                    .select('availability_id, staff_id')
                    .in('availability_id', ids);

                // Merge crew data
                const crewMap = new Map(); // availability_id -> [ { staff_id } ]
                (crewData || []).forEach((c: any) => {
                    if (!crewMap.has(c.availability_id)) crewMap.set(c.availability_id, []);
                    crewMap.get(c.availability_id).push({ staff_id: c.staff_id });
                });

                fetchedData = fetchedData.map((d: any) => ({
                    ...d,
                    crew_assignments: crewMap.get(d.id) || []
                }));
            }

            setSelectedData(fetchedData);
        } catch (err: any) {
            console.error("Error fetching selected IDs:", err);
            toast.error(`Failed to fetch selected availabilities: ${err.message || 'Unknown error'}`);
        } finally {
            setIsFetchingByIds(false);
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

            // Scroll to bottom after adding field so Add Button and new input stay visible
            setTimeout(() => {
                changeScrollRef.current?.scrollTo({
                    top: changeScrollRef.current.scrollHeight,
                    behavior: 'smooth'
                });
                toScrollRef.current?.scrollTo({
                    top: toScrollRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
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

    const getCurrentValueDisplay = (type: UpdateType) => {
        if (!selectedData || selectedData.length === 0) return <span className="text-zinc-500 italic">Empty</span>;

        const values = new Set();
        selectedData.forEach(d => {
            let val = d[type];
            // Handle staff_ids logic (crew_assignments)
            if (type === 'staff_ids') {
                if (d.crew_assignments && Array.isArray(d.crew_assignments)) {
                    const ids = d.crew_assignments.map((ca: any) => ca.staff_id).sort().join(',');
                    val = ids;
                } else {
                    val = '';
                }
            }
            if (val === null || val === undefined || val === '') val = '__EMPTY__';
            values.add(val);
        });

        // Helper to resolve display label for a value
        const resolveValueLabel = (val: any) => {
            if (val === '__EMPTY__') return 'Empty';

            if (type === 'online_booking_status') return val === 'open' ? 'Open' : 'Closed';

            if (type === 'transportation_route_id') {
                const found = transportationSchedules.find(s => s.id === val);
                return found ? found.name : String(val);
            }
            if (type === 'vehicle_id') {
                const found = vehicles.find(v => v.id === val);
                return found ? found.name : String(val);
            }
            if (type === 'pricing_schedule_id') {
                const found = pricingSchedules.find(s => s.id === val);
                return found ? found.name : String(val);
            }
            if (type === 'booking_option_schedule_id') {
                const found = bookingSchedules.find(s => s.id === val);
                return found ? found.name : String(val);
            }
            if (type === 'staff_ids') {
                if (!val) return 'Empty';
                const ids = (val as string).split(',');
                return ids.map(id => staff.find(s => s.id === id)?.name || 'Unknown').join(', ');
            }
            if (type === 'private_announcement') {
                let text = String(val);
                if (text.length > 22) text = text.substring(0, 22) + '...';
                return text;
            }
            if (type === 'start_time') {
                if (!val) return 'Empty';
                // Format HH:mm:ss to h:mm A
                const parts = String(val).split(':');
                if (parts.length < 2) return String(val);

                const hour = parseInt(parts[0], 10);
                const minute = parts[1];
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                return `${hour12}:${minute} ${ampm}`;
            }

            return String(val);
        };

        if (values.size > 1) {
            const uniqueVals = Array.from(values).filter(v => v !== '__EMPTY__');
            if (uniqueVals.length === 0) return <span className="text-zinc-500 italic">Empty</span>; // Should be handled by size check effectively, but safe fallback

            // Map each value to its label
            const displayNames = uniqueVals.map(v => resolveValueLabel(v));
            return <span className="text-zinc-400 italic">Mixed ({displayNames.join(', ')})</span>;
        }

        let single = Array.from(values)[0];
        if (single === '__EMPTY__') return <span className="text-zinc-500 italic">Empty</span>;

        // Formatting for single value
        if (type === 'online_booking_status') {
            return <span className={single === 'open' ? "text-emerald-400" : "text-red-400"}>{resolveValueLabel(single)}</span>;
        }

        return <span className="text-zinc-300">{resolveValueLabel(single)}</span>;
    };

    const renderFilterBlock = (type: FilterType) => {
        switch (type) {
            case 'date_range':
                return (
                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                        <div className="px-3 py-2 flex items-center gap-3">
                            <Calendar size={16} className="text-cyan-400" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-cyan-400">Date Range</div>
                            </div>
                            <button onClick={() => removeFilter('date_range')} className="p-1 hover:bg-white/10 rounded transition-colors">
                                <X size={14} className="text-zinc-400 hover:text-white" />
                            </button>
                        </div>
                        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">From</label>
                                <DatePicker
                                    value={dateRangeStart ? new Date(dateRangeStart + 'T00:00:00') : undefined}
                                    onChange={(date) => setDateRangeStart(date ? date.toISOString().split('T')[0] : '')}
                                    placeholder="Select start date"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">To</label>
                                <DatePicker
                                    value={dateRangeEnd ? new Date(dateRangeEnd + 'T00:00:00') : undefined}
                                    onChange={(date) => setDateRangeEnd(date ? date.toISOString().split('T')[0] : '')}
                                    placeholder="Select end date"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'status':
                return (
                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                        <div className="px-3 py-2 flex items-center gap-3">
                            <Power size={16} className="text-cyan-400" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-cyan-400">Booking Status</div>
                            </div>
                            <button onClick={() => removeFilter('status')} className="p-1 hover:bg-white/10 rounded transition-colors">
                                <X size={14} className="text-zinc-400 hover:text-white" />
                            </button>
                        </div>
                        <div className="px-3 pb-3">
                            <Combobox
                                value={filterValues.status}
                                onChange={(val) => setFilterValues(prev => ({ ...prev, status: val as any }))}
                                options={[{ value: '', label: 'Any' }, { value: 'open', label: 'Open' }, { value: 'closed', label: 'Closed' }]}
                                placeholder="Select status..."
                            />
                        </div>
                    </div>
                );
            case 'time_range':
                return (
                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                        <div className="px-3 py-2 flex items-center gap-3">
                            <Clock size={16} className="text-cyan-400" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-cyan-400">Starting Between</div>
                            </div>
                            <button onClick={() => removeFilter('time_range')} className="p-1 hover:bg-white/10 rounded transition-colors">
                                <X size={14} className="text-zinc-400 hover:text-white" />
                            </button>
                        </div>
                        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">From</label>
                                <TimePicker
                                    value={filterValues.time_start}
                                    onChange={(time) => setFilterValues(prev => ({ ...prev, time_start: time }))}
                                    placeholder="Start time"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">To</label>
                                <TimePicker
                                    value={filterValues.time_end}
                                    onChange={(time) => setFilterValues(prev => ({ ...prev, time_end: time }))}
                                    placeholder="End time"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'day_of_week':
                return (
                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                        <div className="px-3 py-2 flex items-center gap-3">
                            <CalendarDays size={16} className="text-cyan-400" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-cyan-400">Day of Week</div>
                            </div>
                            <button onClick={() => removeFilter('day_of_week')} className="p-1 hover:bg-white/10 rounded transition-colors">
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
                                    className={cn("px-2.5 py-1 rounded text-xs font-medium transition-colors", filterValues.day_of_week.includes(idx) ? "bg-cyan-500 text-black" : "bg-black/50 text-zinc-400 hover:bg-white/10")}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'has_bookings':
                return (
                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                        <div className="px-3 py-2 flex items-center gap-3">
                            <UserCheck size={16} className="text-cyan-400" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-cyan-400">Has Bookings</div>
                            </div>
                            <button onClick={() => removeFilter('has_bookings')} className="p-1 hover:bg-white/10 rounded transition-colors">
                                <X size={14} className="text-zinc-400 hover:text-white" />
                            </button>
                        </div>
                        <div className="px-3 pb-3">
                            <Combobox
                                value={filterValues.has_bookings}
                                onChange={(val) => setFilterValues(prev => ({ ...prev, has_bookings: val as any }))}
                                options={[{ value: '', label: 'Any' }, { value: 'yes', label: 'Has Bookings' }, { value: 'no', label: 'No Bookings' }]}
                                placeholder="Select booking status..."
                            />
                        </div>
                    </div>
                );
            case 'ending_between':
                return (
                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                        <div className="px-3 py-2 flex items-center gap-3">
                            <Clock size={16} className="text-cyan-400" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-cyan-400">Ending Between</div>
                            </div>
                            <button onClick={() => removeFilter('ending_between')} className="p-1 hover:bg-white/10 rounded transition-colors">
                                <X size={14} className="text-zinc-400 hover:text-white" />
                            </button>
                        </div>
                        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">From</label>
                                <TimePicker
                                    value={filterValues.ending_time_start}
                                    onChange={(time) => setFilterValues(prev => ({ ...prev, ending_time_start: time }))}
                                    placeholder="Start time"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">To</label>
                                <TimePicker
                                    value={filterValues.ending_time_end}
                                    onChange={(time) => setFilterValues(prev => ({ ...prev, ending_time_end: time }))}
                                    placeholder="End time"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'duration':
                return (
                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                        <div className="px-3 py-2 flex items-center gap-3">
                            <Clock size={16} className="text-cyan-400" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-cyan-400">Length in Hours</div>
                            </div>
                            <button onClick={() => removeFilter('duration')} className="p-1 hover:bg-white/10 rounded transition-colors">
                                <X size={14} className="text-zinc-400 hover:text-white" />
                            </button>
                        </div>
                        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Min</label>
                                <input type="number" step="0.5" min="0" value={filterValues.duration_min} onChange={(e) => setFilterValues(prev => ({ ...prev, duration_min: e.target.value }))} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer" placeholder="0" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Max</label>
                                <input type="number" step="0.5" min="0" value={filterValues.duration_max} onChange={(e) => setFilterValues(prev => ({ ...prev, duration_max: e.target.value }))} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer" placeholder="24" />
                            </div>
                        </div>
                    </div>
                );
            case 'notes':
                return (
                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                        <div className="px-3 py-2 flex items-center gap-3">
                            <MessageSquare size={16} className="text-cyan-400" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-cyan-400">Internal Notes</div>
                            </div>
                            <button onClick={() => removeFilter('notes')} className="p-1 hover:bg-white/10 rounded transition-colors">
                                <X size={14} className="text-zinc-400 hover:text-white" />
                            </button>
                        </div>
                        <div className="px-3 pb-3">
                            <input type="text" value={filterValues.notes} onChange={(e) => setFilterValues(prev => ({ ...prev, notes: e.target.value }))} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer" placeholder="Search notes..." />
                        </div>
                    </div>
                );
            case 'capacity':
                return (
                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                        <div className="px-3 py-2 flex items-center gap-3">
                            <Users size={16} className="text-cyan-400" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-cyan-400">Total Capacity</div>
                            </div>
                            <button onClick={() => removeFilter('capacity')} className="p-1 hover:bg-white/10 rounded transition-colors">
                                <X size={14} className="text-zinc-400 hover:text-white" />
                            </button>
                        </div>
                        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Min</label>
                                <input type="number" min="0" value={filterValues.capacity_min} onChange={(e) => setFilterValues(prev => ({ ...prev, capacity_min: e.target.value }))} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer" placeholder="0" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Max</label>
                                <input type="number" min="0" value={filterValues.capacity_max} onChange={(e) => setFilterValues(prev => ({ ...prev, capacity_max: e.target.value }))} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer" placeholder="100" />
                            </div>
                        </div>
                    </div>
                );
            case 'customer_type':
                return (
                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                        <div className="px-3 py-2 flex items-center gap-3">
                            <Users size={16} className="text-cyan-400" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-cyan-400">Customer Type</div>
                            </div>
                            <button onClick={() => removeFilter('customer_type')} className="p-1 hover:bg-white/10 rounded transition-colors">
                                <X size={14} className="text-zinc-400 hover:text-white" />
                            </button>
                        </div>
                        <div className="px-3 pb-3">
                            <Combobox
                                value={filterValues.customer_type_id}
                                onChange={(val) => setFilterValues(prev => ({ ...prev, customer_type_id: val }))}
                                options={[{ value: '', label: 'Any' }, ...customerTypes.map(ct => ({ value: ct.id, label: ct.name }))]}
                                placeholder="Select customer type..."
                            />
                        </div>
                    </div>
                );
            case 'pickup_route':
                return (
                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                        <div className="px-3 py-2 flex items-center gap-3">
                            <MapPin size={16} className="text-cyan-400" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-cyan-400">Route Schedule</div>
                            </div>
                            <button onClick={() => removeFilter('pickup_route')} className="p-1 hover:bg-white/10 rounded transition-colors">
                                <X size={14} className="text-zinc-400 hover:text-white" />
                            </button>
                        </div>
                        <div className="px-3 pb-3">
                            <Combobox
                                value={filterValues.pickup_route_id}
                                onChange={(val) => setFilterValues(prev => ({ ...prev, pickup_route_id: val }))}
                                options={[{ value: '', label: 'Any' }, ...transportationSchedules.map(s => ({ value: s.id, label: s.name }))]}
                                placeholder="Select route..."
                            />
                        </div>
                    </div>
                );
            case 'crew':
                return (
                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                        <div className="px-3 py-2 flex items-center gap-3">
                            <Users size={16} className="text-cyan-400" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-cyan-400">Assigned Staff</div>
                            </div>
                            <button onClick={() => removeFilter('crew')} className="p-1 hover:bg-white/10 rounded transition-colors">
                                <X size={14} className="text-zinc-400 hover:text-white" />
                            </button>
                        </div>
                        <div className="px-3 pb-3 max-h-[150px] overflow-y-auto">
                            {staff.map(s => (
                                <label key={s.id} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-white/5 px-1 rounded">
                                    <input type="checkbox" checked={filterValues.crew_ids.includes(s.id)} onChange={(e) => { if (e.target.checked) { setFilterValues(prev => ({ ...prev, crew_ids: [...prev.crew_ids, s.id] })); } else { setFilterValues(prev => ({ ...prev, crew_ids: prev.crew_ids.filter(id => id !== s.id) })); } }} className="rounded border-white/20 bg-black text-cyan-500 focus:ring-cyan-500" />
                                    <span className="text-xs text-zinc-300">{s.name}</span>
                                    {s.role?.name && <span className="text-xs text-zinc-500">({s.role.name})</span>}
                                </label>
                            ))}
                            {staff.length === 0 && <div className="text-xs text-zinc-500 py-2">No staff found</div>}
                        </div>
                    </div>
                );
            case 'vehicle_id':
                return (
                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                        <div className="px-3 py-2 flex items-center gap-3">
                            <Bus size={16} className="text-cyan-400" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-cyan-400">Vehicle</div>
                            </div>
                            <button onClick={() => removeFilter('vehicle_id')} className="p-1 hover:bg-white/10 rounded transition-colors">
                                <X size={14} className="text-zinc-400 hover:text-white" />
                            </button>
                        </div>
                        <div className="px-3 pb-3">
                            <Combobox
                                value={filterValues.vehicle_id}
                                onChange={(val) => setFilterValues(prev => ({ ...prev, vehicle_id: val }))}
                                options={[{ value: '', label: 'Any' }, ...vehicles.map(v => ({ value: v.id, label: v.name }))]}
                                placeholder="Select vehicle..."
                            />
                        </div>
                    </div>
                );
            case 'pricing_schedule_id':
                return (
                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                        <div className="px-3 py-2 flex items-center gap-3">
                            <DollarSign size={16} className="text-cyan-400" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-cyan-400">Pricing Schedule</div>
                            </div>
                            <button onClick={() => removeFilter('pricing_schedule_id')} className="p-1 hover:bg-white/10 rounded transition-colors">
                                <X size={14} className="text-zinc-400 hover:text-white" />
                            </button>
                        </div>
                        <div className="px-3 pb-3">
                            <Combobox
                                value={filterValues.pricing_schedule_id}
                                onChange={(val) => setFilterValues(prev => ({ ...prev, pricing_schedule_id: val }))}
                                options={[{ value: '', label: 'Any' }, ...pricingSchedules.map(ps => ({ value: ps.id, label: ps.name }))]}
                                placeholder="Select pricing..."
                            />
                        </div>
                    </div>
                );
            case 'booking_option_schedule_id':
                return (
                    <div className="w-full rounded-lg mb-2 bg-cyan-500/20 border border-cyan-500/50">
                        <div className="px-3 py-2 flex items-center gap-3">
                            <DollarSign size={16} className="text-cyan-400" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-cyan-400">Booking Options</div>
                            </div>
                            <button onClick={() => removeFilter('booking_option_schedule_id')} className="p-1 hover:bg-white/10 rounded transition-colors">
                                <X size={14} className="text-zinc-400 hover:text-white" />
                            </button>
                        </div>
                        <div className="px-3 pb-3">
                            <Combobox
                                value={filterValues.booking_option_schedule_id}
                                onChange={(val) => setFilterValues(prev => ({ ...prev, booking_option_schedule_id: val }))}
                                options={[{ value: '', label: 'Any' }, ...bookingSchedules.map(bs => ({ value: bs.id, label: bs.name }))]}
                                placeholder="Select booking options..."
                            />
                        </div>
                    </div>
                );
            default:
                return null;
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
                                <div ref={changeScrollRef} className="flex-1 overflow-y-auto p-4">
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
                                                ref={fieldButtonRef}
                                                onClick={() => {
                                                    if (!isFieldDropdownOpen && fieldButtonRef.current) {
                                                        const rect = fieldButtonRef.current.getBoundingClientRect();
                                                        const spaceBelow = window.innerHeight - rect.bottom;
                                                        setFieldDropdownPosition(spaceBelow < 320 ? 'above' : 'below');
                                                    }
                                                    setIsFieldDropdownOpen(!isFieldDropdownOpen);
                                                }}
                                                className="w-full text-left px-3 py-3 rounded-lg border border-dashed border-zinc-700 hover:border-cyan-500/50 hover:bg-white/5 transition-all flex items-center gap-3 text-zinc-400 hover:text-cyan-400"
                                            >
                                                <Plus size={18} />
                                                <span className="text-sm">Add field to update</span>
                                            </button>

                                            {/* Dropdown */}
                                            {isFieldDropdownOpen && (
                                                <div className={cn(
                                                    "absolute left-0 right-0 bg-[#1a1f24] border border-white/10 rounded-lg shadow-xl z-30 max-h-[300px] overflow-y-auto",
                                                    fieldDropdownPosition === 'above' ? 'bottom-full mb-1' : 'top-full mt-1'
                                                )}>
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
                                        Selected filters are cumulative
                                    </p>
                                </div>
                                <div ref={filterScrollRef} className="flex-1 overflow-y-auto p-4">

                                    {showDateRangeSelector ? (
                                        // Date Range Selector
                                        <div className="space-y-4">

                                            {/* Date Range Picker */}
                                            <div className="bg-white/5 rounded-lg p-4">
                                                <div className="text-sm font-medium text-white mb-1">Date Range</div>
                                                <p className="text-xs text-zinc-500 italic mb-3">Selecting a date range is required</p>
                                                <div className="space-y-3">
                                                    {/* Preset Buttons */}
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <button
                                                            onClick={() => {
                                                                const today = new Date();
                                                                const dayOfWeek = today.getDay();
                                                                const startOfWeek = new Date(today);
                                                                startOfWeek.setDate(today.getDate() - dayOfWeek);
                                                                const endOfWeek = new Date(startOfWeek);
                                                                endOfWeek.setDate(startOfWeek.getDate() + 6);
                                                                setDateRangeStart(startOfWeek.toISOString().split('T')[0]);
                                                                setDateRangeEnd(endOfWeek.toISOString().split('T')[0]);
                                                            }}
                                                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                                                        >
                                                            This Week
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const today = new Date();
                                                                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                                                                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                                                                setDateRangeStart(startOfMonth.toISOString().split('T')[0]);
                                                                setDateRangeEnd(endOfMonth.toISOString().split('T')[0]);
                                                            }}
                                                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                                                        >
                                                            This Month
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const today = new Date();
                                                                const endDate = new Date(today);
                                                                endDate.setDate(today.getDate() + 30);
                                                                setDateRangeStart(today.toISOString().split('T')[0]);
                                                                setDateRangeEnd(endDate.toISOString().split('T')[0]);
                                                            }}
                                                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                                                        >
                                                            Next 30 Days
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const today = new Date();
                                                                const startOfYear = new Date(today.getFullYear(), 0, 1);
                                                                const endOfYear = new Date(today.getFullYear(), 11, 31);
                                                                setDateRangeStart(startOfYear.toISOString().split('T')[0]);
                                                                setDateRangeEnd(endOfYear.toISOString().split('T')[0]);
                                                            }}
                                                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                                                        >
                                                            This Year
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block text-xs text-zinc-400 mb-1">Start Date</label>
                                                            <DatePicker
                                                                value={dateRangeStart ? new Date(dateRangeStart + 'T00:00:00') : undefined}
                                                                onChange={(date) => setDateRangeStart(date ? date.toISOString().split('T')[0] : '')}
                                                                placeholder="Select start date"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs text-zinc-400 mb-1">End Date</label>
                                                            <DatePicker
                                                                value={dateRangeEnd ? new Date(dateRangeEnd + 'T00:00:00') : undefined}
                                                                onChange={(date) => setDateRangeEnd(date ? date.toISOString().split('T')[0] : '')}
                                                                placeholder="Select end date"
                                                            />
                                                        </div>
                                                    </div>
                                                    {/* Loading indicator when fetching */}
                                                    {isFetchingByDate ? (
                                                        <div className="flex items-center justify-center gap-2 text-cyan-400 text-xs">
                                                            <Loader2 className="animate-spin" size={14} />
                                                            <span>Finding availabilities...</span>
                                                        </div>
                                                    ) : (dateRangeStart && dateRangeEnd) ? (
                                                        <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs">
                                                            <span>{selectedData.length} availabilities found</span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {/* Filter Selector Section */}
                                            <div className="border-t border-white/10 pt-4">
                                                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Additional Filters</div>

                                                {/* Selected Filters - Anchored with inputs inside */}
                                                {/* Dynamic Filters */}
                                                {selectedFilters.map(type => (
                                                    <div key={type} className="contents">
                                                        {renderFilterBlock(type)}
                                                    </div>
                                                ))}



                                                {/* Add Filter Button / Dropdown - only show status and time_range since date_range is already shown */}
                                                {availableFilters.filter(f => f.type !== 'date_range').length > 0 && (
                                                    <div className="relative">
                                                        <button
                                                            ref={filterButtonRef}
                                                            onClick={() => {
                                                                if (!isFilterDropdownOpen && filterButtonRef.current) {
                                                                    const rect = filterButtonRef.current.getBoundingClientRect();
                                                                    const spaceBelow = window.innerHeight - rect.bottom;
                                                                    setFilterDropdownPosition(spaceBelow < 320 ? 'above' : 'below');
                                                                }
                                                                setIsFilterDropdownOpen(!isFilterDropdownOpen);
                                                            }}
                                                            className="w-full text-left px-3 py-2 rounded-lg border border-dashed border-zinc-700 hover:border-cyan-500/50 hover:bg-white/5 transition-all flex items-center gap-3 text-zinc-400 hover:text-cyan-400"
                                                        >
                                                            <Plus size={16} />
                                                            <span className="text-sm">Add filter</span>
                                                        </button>

                                                        {isFilterDropdownOpen && (
                                                            <div className={cn(
                                                                "absolute left-0 right-0 bg-[#1a1f24] border border-white/10 rounded-lg shadow-xl z-30 max-h-[300px] overflow-y-auto",
                                                                filterDropdownPosition === 'above' ? 'bottom-full mb-1' : 'top-full mt-1'
                                                            )}>
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
                                            {/* Selected Days Box */}
                                            {selectedData && selectedData.length > 0 && (
                                                <div className="bg-white/5 rounded-lg p-3">
                                                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-bold">Selected Days</div>
                                                    <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                                                        {Array.from(new Set(selectedData.map((d: any) => d.start_date || '').filter(Boolean)))
                                                            .sort()
                                                            .map((date: any) => (
                                                                <div key={date} className="px-2 py-1 bg-black/30 rounded text-xs text-zinc-300 border border-white/5 whitespace-nowrap">
                                                                    {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                </div>
                                            )}

                                            {/* Filter Selector Section */}
                                            <div>
                                                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Additional Filters</div>

                                                {/* Selected Filters - Anchored with inputs inside */}
                                                {/* Dynamic Filters */}
                                                {selectedFilters.map(type => (
                                                    <div key={type} className="contents">
                                                        {renderFilterBlock(type)}
                                                    </div>
                                                ))}



                                                {/* Add Filter Button / Dropdown */}
                                                {availableFilters.length > 0 && (
                                                    <div className="relative">
                                                        <button
                                                            ref={filterButtonRef}
                                                            onClick={() => {
                                                                if (!isFilterDropdownOpen && filterButtonRef.current) {
                                                                    const rect = filterButtonRef.current.getBoundingClientRect();
                                                                    const spaceBelow = window.innerHeight - rect.bottom;
                                                                    setFilterDropdownPosition(spaceBelow < 320 ? 'above' : 'below');
                                                                }
                                                                setIsFilterDropdownOpen(!isFilterDropdownOpen);
                                                            }}
                                                            className="w-full text-left px-3 py-2 rounded-lg border border-dashed border-zinc-700 hover:border-cyan-500/50 hover:bg-white/5 transition-all flex items-center gap-3 text-zinc-400 hover:text-cyan-400"
                                                        >
                                                            <Plus size={16} />
                                                            <span className="text-sm">Add filter</span>
                                                        </button>

                                                        {isFilterDropdownOpen && (
                                                            <div className={cn(
                                                                "absolute left-0 right-0 bg-[#1a1f24] border border-white/10 rounded-lg shadow-xl z-30 max-h-[300px] overflow-y-auto",
                                                                filterDropdownPosition === 'above' ? 'bottom-full mb-1' : 'top-full mt-1'
                                                            )}>
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
                                <div ref={toScrollRef} className="flex-1 overflow-y-auto p-4">
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
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-white">{option.label}</span>
                                                                <span className="text-xs text-zinc-500">Currently: {getCurrentValueDisplay(type)}</span>
                                                            </div>
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
                                                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
                                                                placeholder="Enter capacity"
                                                            />
                                                        )}

                                                        {/* Start Time */}
                                                        {type === 'start_time' && (
                                                            <TimePicker
                                                                value={values.start_time}
                                                                onChange={(time) => setValues(prev => ({ ...prev, start_time: time }))}
                                                                placeholder="Select start time"
                                                            />
                                                        )}

                                                        {/* Duration */}
                                                        {type === 'hours_long' && (
                                                            <input
                                                                type="number"
                                                                value={values.hours_long}
                                                                onChange={(e) => setValues(prev => ({ ...prev, hours_long: Number(e.target.value) }))}
                                                                step="0.5"
                                                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
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
                                                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white resize-none focus:border-cyan-500/50 focus:outline-none"
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
