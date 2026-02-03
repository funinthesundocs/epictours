"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { MasterReportRow } from "./types";
import { ReportTable, ColumnFilters } from "./components/report-table";
import { ReportToolbar } from "./components/report-toolbar";
import { useColumnVisibility, REPORT_COLUMNS } from "./components/column-picker";
import { SortCriteria } from "./components/sort-manager";
import { PresetSettings } from "./components/preset-manager";
import { Loader2, AlertCircle, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/features/auth/auth-context";
import { BookingDesk } from "@/features/bookings/components/booking-desk";
import { AddCustomerSheet } from "@/features/crm/customers/components/add-customer-sheet";
import { EditAvailabilitySheet } from "@/features/availability/components/edit-availability-sheet";
import { Availability } from "@/features/availability/components/availability-list-table";
import { Customer } from "@/features/crm/customers/types";

const MAX_RECORDS = 10000;

export function MasterReportPage() {
    const { effectiveOrganizationId } = useAuth();
    const [data, setData] = useState<MasterReportRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter State
    const [searchQuery, setSearchQuery] = useState("");

    // Date Range State - default to last 30 days to 30 days forward
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d;
    });

    // Date filter type state
    const [dateFilterType, setDateFilterType] = useState<"activity" | "booking">("activity");

    // Sort State - array for multi-level sorting
    const [sortCriteria, setSortCriteria] = useState<SortCriteria[]>([
        { key: "start_date", direction: "desc" }
    ]);

    // Column Filters State
    const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});

    // Column Visibility
    const { visibleColumns, toggleColumn, resetToDefault, reorderColumns } = useColumnVisibility();

    // Side Panel State
    const [bookingPanelOpen, setBookingPanelOpen] = useState(false);
    const [bookingPanelData, setBookingPanelData] = useState<{ availability: Availability | null; bookingId: string | null }>({ availability: null, bookingId: null });
    const [customerPanelOpen, setCustomerPanelOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
    const [availabilityPanelOpen, setAvailabilityPanelOpen] = useState(false);
    const [editingAvailability, setEditingAvailability] = useState<any>(undefined);

    // Handle cell click - route to appropriate side panel based on column category
    const handleCellClick = useCallback(async (row: MasterReportRow, columnKey: string) => {
        // Row click passes "booking" directly - otherwise check column category
        const column = REPORT_COLUMNS.find(c => c.key === columnKey);
        const category = columnKey === "booking" ? "booking" : column?.category;

        if (!category) return;

        switch (category) {
            case "booking":
            case "experience":
            case "pickup":
                // Open BookingDesk - need to fetch availability data with experience info
                const { data: availData } = await supabase
                    .from("availabilities" as any)
                    .select("*, experience:experiences(id, name, short_code)")
                    .eq("id", row.availability_id)
                    .single();

                // Flatten experience data for BookingDesk
                const enrichedAvail = availData ? {
                    ...availData,
                    experience_name: availData.experience?.name || 'Unknown Experience',
                    experience_short_code: availData.experience?.short_code || 'EXP'
                } : null;
                delete (enrichedAvail as any)?.experience;

                setBookingPanelData({ availability: enrichedAvail as Availability, bookingId: row.booking_id });
                setBookingPanelOpen(true);
                break;

            case "customer":
                // Open AddCustomerSheet - fetch customer data with user identity
                const { data: custData } = await supabase
                    .from("customers" as any)
                    .select("*, user:users(id, name, email, phone_number, avatar_url)")
                    .eq("id", row.customer_id)
                    .single();

                // Flatten user data to match Customer type
                if (custData) {
                    const flattenedCustomer = {
                        ...custData,
                        name: custData.user?.name || 'Unknown',
                        email: custData.user?.email || '',
                        phone: custData.user?.phone_number || '',
                        avatar_url: custData.user?.avatar_url || null,
                        user_id: custData.user?.id || null
                    };
                    delete (flattenedCustomer as any).user;
                    setEditingCustomer(flattenedCustomer as Customer);
                }
                setCustomerPanelOpen(true);
                break;

            case "staff":
                // Open EditAvailabilitySheet - fetch availability data
                const { data: staffAvailData } = await supabase
                    .from("availabilities" as any)
                    .select("*")
                    .eq("id", row.availability_id)
                    .single();
                setEditingAvailability(staffAvailData);
                setAvailabilityPanelOpen(true);
                break;
        }
    }, []);

    // Handle column filter change
    const handleColumnFilterChange = (key: string, values: Set<string>) => {
        setColumnFilters(prev => {
            const next = { ...prev };
            if (values.size === 0) {
                delete next[key];
            } else {
                next[key] = values;
            }
            return next;
        });
    };

    // Build current preset settings for saving
    const currentPresetSettings: PresetSettings = useMemo(() => ({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dateFilterType,
        searchQuery,
        visibleColumns,
        sortCriteria,
        columnFilters: Object.fromEntries(
            Object.entries(columnFilters).map(([k, v]) => [k, Array.from(v)])
        )
    }), [startDate, endDate, dateFilterType, searchQuery, visibleColumns, sortCriteria, columnFilters]);

    // Handle loading a preset
    const handleLoadPreset = (settings: PresetSettings) => {
        setStartDate(new Date(settings.startDate));
        setEndDate(new Date(settings.endDate));
        setDateFilterType(settings.dateFilterType);
        setSearchQuery(settings.searchQuery);
        reorderColumns(settings.visibleColumns);
        setSortCriteria(settings.sortCriteria);
        // Convert arrays back to Sets
        const restoredFilters: ColumnFilters = {};
        for (const [key, values] of Object.entries(settings.columnFilters)) {
            restoredFilters[key] = new Set(values);
        }
        setColumnFilters(restoredFilters);
    };

    const fetchReportData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch all lookup data in parallel
            // Build queries with organization filter
            let bookingsQuery = supabase
                .from('bookings' as any)
                .select(`
                    id, status, pax_count, total_amount, amount_paid, payment_status,
                    voucher_numbers, notes, organization_id, confirmation_number, created_at,
                    customers(id, status, total_value, metadata, preferences, user:users(name, email, phone_number)),
                    availabilities(
                        id, start_date, start_time, max_capacity, experience_id,
                        experiences(id, name, short_code)
                    )
                `)
                .limit(MAX_RECORDS)
                .order('created_at', { ascending: false });

            let staffQuery = supabase.from('staff' as any).select('id, user:users(name)');
            let vehiclesQuery = supabase.from('vehicles' as any).select('id, name');
            let schedulesQuery = supabase.from('schedules' as any).select('id, name');

            // Apply organization filter if we have one
            if (effectiveOrganizationId) {
                bookingsQuery = bookingsQuery.eq('organization_id', effectiveOrganizationId);
                staffQuery = staffQuery.eq('organization_id', effectiveOrganizationId);
                vehiclesQuery = vehiclesQuery.eq('organization_id', effectiveOrganizationId);
                schedulesQuery = schedulesQuery.eq('organization_id', effectiveOrganizationId);
            }

            const [bookingsRes, staffRes, vehiclesRes, routesRes] = await Promise.all([
                bookingsQuery,
                staffQuery,
                vehiclesQuery,
                schedulesQuery
            ]);

            if (bookingsRes.error) throw bookingsRes.error;

            // Build lookup maps
            const staffMap: Record<string, string> = {};
            if (staffRes.data) {
                (staffRes.data as any[]).forEach(s => { staffMap[s.id] = s.user?.name || 'Unknown'; });
            }

            const vehicleMap: Record<string, string> = {};
            if (vehiclesRes.data) {
                (vehiclesRes.data as any[]).forEach(v => { vehicleMap[v.id] = v.name; });
            }

            const routeMap: Record<string, string> = {};
            if (routesRes.data) {
                (routesRes.data as any[]).forEach(r => { routeMap[r.id] = r.name; });
            }

            if (bookingsRes.data) {
                const rows: MasterReportRow[] = bookingsRes.data.map((b: any) => {
                    const customer = b.customers || {};
                    const customerUser = customer.user || {};
                    const availability = b.availabilities || {};
                    const experience = availability.experiences || {};
                    const metadata = customer.metadata || {};
                    const preferences = customer.preferences || {};
                    const emergencyContact = preferences.emergency_contact || {};

                    return {
                        // Booking fields
                        booking_id: b.id,
                        confirmation_number: b.confirmation_number,
                        booking_status: b.status,
                        pax_count: b.pax_count || 0,
                        total_amount: b.total_amount || 0,
                        amount_paid: b.amount_paid || 0,
                        balance_due: (b.total_amount || 0) - (b.amount_paid || 0),
                        payment_status: b.payment_status || "unpaid",
                        voucher_numbers: b.voucher_numbers,
                        notes: b.notes,
                        booking_created_at: b.created_at,

                        // Customer fields - now from user relation
                        customer_id: customer.id || "",
                        customer_name: customerUser.name || "Unknown",
                        customer_email: customerUser.email || "",
                        customer_phone: customerUser.phone_number || "",
                        customer_hotel: metadata.hotel || null,
                        customer_source: metadata.source || null,
                        customer_status: customer.status || null,
                        customer_total_value: customer.total_value || 0,
                        preferred_messaging_app: preferences.preferred_messaging_app || null,
                        dietary_restrictions: Array.isArray(preferences.dietary) ? preferences.dietary.join(", ") : null,
                        accessibility_needs: preferences.accessibility || null,
                        emergency_contact_name: emergencyContact.name || null,
                        emergency_contact_phone: emergencyContact.phone || null,

                        // Experience fields
                        experience_id: experience.id || "",
                        experience_code: experience.short_code || "",
                        experience_name: experience.name || "",

                        // Availability fields
                        availability_id: availability.id || "",
                        start_date: availability.start_date || "",
                        start_time: availability.start_time || "",
                        max_capacity: availability.max_capacity || 0,

                        // Staff & Resources (not directly on availabilities - would need assignments lookup)
                        driver_id: null,
                        driver_name: null,
                        guide_id: null,
                        guide_name: null,
                        vehicle_id: null,
                        vehicle_name: null,
                        route_id: null,
                        route_name: null,

                        // Pickup info
                        pickup_location: metadata.hotel || null,
                        pickup_time: null
                    };
                });

                setData(rows);
            }
        } catch (err: any) {
            console.error("Error fetching report data:", err);
            setError(err.message || "Failed to load report data.");
        } finally {
            setIsLoading(false);
        }
    }, [effectiveOrganizationId]);

    // Initial fetch
    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    // Handle sorting
    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === "asc" ? "desc" : "asc"
        }));
    };

    // Handle reset
    const handleReset = () => {
        setSearchQuery("");
        // Reset date range to default
        const start = new Date();
        start.setDate(start.getDate() - 30);
        setStartDate(start);
        const end = new Date();
        end.setDate(end.getDate() + 30);
        setEndDate(end);
        setDateFilterType("activity");
    };

    // Filter data based on date range first, then search query
    const filteredData = data.filter(row => {
        // Date filter - use either start_date or booking_created_at based on filter type
        const dateToCheck = dateFilterType === "activity" ? row.start_date : row.booking_created_at;

        if (dateToCheck) {
            // Parse the date string properly - for date-only strings like "2026-01-24",
            // we need to parse as local date, not UTC
            let rowDate: Date;
            if (dateToCheck.length === 10 && dateToCheck.includes('-')) {
                // Date-only string like "2026-01-24" - parse as local date
                const [year, month, day] = dateToCheck.split('-').map(Number);
                rowDate = new Date(year, month - 1, day);
            } else {
                // Full datetime string - use normal parsing
                rowDate = new Date(dateToCheck);
            }

            const filterStart = new Date(startDate);
            filterStart.setHours(0, 0, 0, 0);
            const filterEnd = new Date(endDate);
            filterEnd.setHours(23, 59, 59, 999);

            if (rowDate < filterStart || rowDate > filterEnd) return false;
        }

        // Search filter
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            row.confirmation_number?.toLowerCase().includes(q) ||
            row.customer_name.toLowerCase().includes(q) ||
            row.customer_email?.toLowerCase().includes(q) ||
            row.customer_phone?.toLowerCase().includes(q) ||
            row.customer_hotel?.toLowerCase().includes(q) ||
            row.experience_code.toLowerCase().includes(q) ||
            row.experience_name.toLowerCase().includes(q) ||
            row.voucher_numbers?.toLowerCase().includes(q) ||
            row.notes?.toLowerCase().includes(q) ||
            row.driver_name?.toLowerCase().includes(q) ||
            row.guide_name?.toLowerCase().includes(q) ||
            row.vehicle_name?.toLowerCase().includes(q) ||
            row.route_name?.toLowerCase().includes(q) ||
            row.start_date.includes(q)
        );
    });

    // Multi-level sort filtered data
    const sortedData = [...filteredData].sort((a, b) => {
        if (sortCriteria.length === 0) return 0;

        for (const { key, direction } of sortCriteria) {
            let aVal: any = (a as any)[key];
            let bVal: any = (b as any)[key];

            // Handle nulls - push to end
            if (aVal == null && bVal == null) continue;
            if (aVal == null) return 1;
            if (bVal == null) return -1;

            let cmp = 0;
            if (typeof aVal === "string") {
                cmp = aVal.localeCompare(bVal);
            } else {
                cmp = aVal - bVal;
            }

            if (cmp !== 0) {
                return direction === "asc" ? cmp : -cmp;
            }
        }
        return 0;
    });

    // Apply column filters AFTER sorting
    const fullyFilteredData = sortedData.filter(row => {
        for (const [key, allowedValues] of Object.entries(columnFilters)) {
            if (allowedValues.size === 0) continue;
            const cellValue = String((row as any)[key] ?? "-");
            if (!allowedValues.has(cellValue)) return false;
        }
        return true;
    });

    return (
        <div className="h-[calc(100dvh-2rem)] lg:h-[calc(100dvh-4rem)] flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col space-y-4 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <FileSpreadsheet size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Master Report</h1>
                            <p className="text-muted-foreground text-sm">Complete booking, customer, and operations data</p>
                        </div>
                    </div>
                </div>

                {/* Spacer */}
                <div style={{ height: "16px" }} />

                {/* Toolbar */}
                <ReportToolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onReset={handleReset}
                    visibleColumns={visibleColumns}
                    onToggleColumn={toggleColumn}
                    onResetColumns={resetToDefault}
                    onReorderColumns={reorderColumns}
                    sortCriteria={sortCriteria}
                    onSortChange={setSortCriteria}
                    totalRecords={data.length}
                    filteredRecords={fullyFilteredData.length}
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    dateFilterType={dateFilterType}
                    onDateFilterTypeChange={setDateFilterType}
                    currentPresetSettings={currentPresetSettings}
                    onLoadPreset={handleLoadPreset}
                    exportData={fullyFilteredData}
                />
            </div>

            {error ? (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20">
                    <AlertCircle size={20} />
                    {error}
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                    {isLoading && data.length === 0 ? (
                        <LoadingState message="Loading report data..." className="h-full" />
                    ) : sortedData.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center h-full text-muted-foreground">
                            {searchQuery ? "No matching records found" : "No booking data available"}
                        </div>
                    ) : (
                        <div className={cn("h-full", isLoading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity")}>
                            <ReportTable
                                data={fullyFilteredData}
                                unfilteredData={sortedData}
                                visibleColumns={visibleColumns}
                                searchQuery={searchQuery}
                                columnFilters={columnFilters}
                                onColumnFilterChange={handleColumnFilterChange}
                                onCellClick={handleCellClick}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Booking Desk Side Panel */}
            <BookingDesk
                isOpen={bookingPanelOpen}
                onClose={() => {
                    setBookingPanelOpen(false);
                    setBookingPanelData({ availability: null, bookingId: null });
                }}
                onSuccess={() => {
                    setBookingPanelOpen(false);
                    setBookingPanelData({ availability: null, bookingId: null });
                    fetchData();
                }}
                availability={bookingPanelData.availability}
                editingBookingId={bookingPanelData.bookingId}
            />

            {/* Customer Edit Side Panel */}
            <AddCustomerSheet
                isOpen={customerPanelOpen}
                onClose={() => {
                    setCustomerPanelOpen(false);
                    setEditingCustomer(undefined);
                }}
                onCustomerAdded={() => {
                    setCustomerPanelOpen(false);
                    setEditingCustomer(undefined);
                    fetchData();
                }}
                editingCustomer={editingCustomer}
            />

            {/* Availability Edit Side Panel */}
            <EditAvailabilitySheet
                isOpen={availabilityPanelOpen}
                onClose={() => {
                    setAvailabilityPanelOpen(false);
                    setEditingAvailability(undefined);
                }}
                onSuccess={() => {
                    setAvailabilityPanelOpen(false);
                    setEditingAvailability(undefined);
                    fetchData();
                }}
                initialData={editingAvailability}
            />
        </div>
    );
}
