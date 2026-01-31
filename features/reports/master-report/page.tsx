"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { MasterReportRow } from "./types";
import { ReportTable, ColumnFilters } from "./components/report-table";
import { ReportToolbar } from "./components/report-toolbar";
import { useColumnVisibility } from "./components/column-picker";
import { SortCriteria } from "./components/sort-manager";
import { Loader2, AlertCircle, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_RECORDS = 10000;

export function MasterReportPage() {
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

    const fetchReportData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch all lookup data in parallel
            const [bookingsRes, staffRes, vehiclesRes, routesRes] = await Promise.all([
                supabase
                    .from('bookings' as any)
                    .select(`
                        id, status, pax_count, total_amount, amount_paid, payment_status,
                        voucher_numbers, notes, confirmation_number, created_at,
                        customers(id, name, email, phone, status, total_value, metadata, preferences),
                        availabilities(
                            id, start_date, start_time, max_capacity, experience_id,
                            experiences(id, name, short_code)
                        )
                    `)
                    .limit(MAX_RECORDS)
                    .order('created_at', { ascending: false }),
                supabase.from('staff' as any).select('id, name'),
                supabase.from('vehicles' as any).select('id, name'),
                supabase.from('schedules' as any).select('id, name')
            ]);

            if (bookingsRes.error) throw bookingsRes.error;

            // Build lookup maps
            const staffMap: Record<string, string> = {};
            if (staffRes.data) {
                (staffRes.data as any[]).forEach(s => { staffMap[s.id] = s.name; });
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

                        // Customer fields
                        customer_id: customer.id || "",
                        customer_name: customer.name || "Unknown",
                        customer_email: customer.email,
                        customer_phone: customer.phone,
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
    }, []);

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
                        <div className="w-10 h-10 rounded-lg bg-cyan-400/10 flex items-center justify-center text-cyan-400 shrink-0">
                            <FileSpreadsheet size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Master Report</h1>
                            <p className="text-zinc-400 text-sm">Complete booking, customer, and operations data</p>
                        </div>
                    </div>
                </div>

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
                />
            </div>

            {/* Content */}
            {isLoading && data.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-zinc-500 gap-2">
                    <Loader2 size={24} className="animate-spin" />
                    Loading report data...
                </div>
            ) : error ? (
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                    <AlertCircle size={20} />
                    {error}
                </div>
            ) : sortedData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                    {searchQuery ? "No matching records found" : "No booking data available"}
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-white/5 bg-[#010e0f]">
                    <div className={cn("h-full", isLoading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity")}>
                        <ReportTable
                            data={fullyFilteredData}
                            unfilteredData={sortedData}
                            visibleColumns={visibleColumns}
                            searchQuery={searchQuery}
                            columnFilters={columnFilters}
                            onColumnFilterChange={handleColumnFilterChange}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
