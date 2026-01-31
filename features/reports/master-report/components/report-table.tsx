"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { MasterReportRow } from "../types";
import { REPORT_COLUMNS } from "./column-picker";
import { ChevronDown, Check, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format, parseISO } from "date-fns";

export type ColumnFilters = {
    [columnKey: string]: Set<string>;
};

interface ReportTableProps {
    data: MasterReportRow[];
    unfilteredData: MasterReportRow[];  // Data before column filters, for dropdown options
    visibleColumns: string[];
    searchQuery?: string;
    columnFilters: ColumnFilters;
    onColumnFilterChange: (key: string, values: Set<string>) => void;
    onCellClick?: (row: MasterReportRow, columnKey: string) => void;
}

const ROW_HEIGHT = 44;

// Columns that can be summed for totals row
const SUMMABLE_COLUMNS = new Set([
    "pax_count",
    "total_amount",
    "amount_paid",
    "balance_due",
    "customer_total_value",
    "max_capacity"
]);

// Format phone number as (XXX)XXX-XXXX
function formatPhoneNumber(phone: string | null): string {
    if (!phone) return "-";
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
        const last10 = digits.slice(-10);
        return `(${last10.slice(0, 3)})${last10.slice(3, 6)}-${last10.slice(6)}`;
    }
    return phone;
}

// Format currency
function formatCurrency(amount: number | string | null): string {
    if (amount == null) return "-";
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return "-";
    return `$${num.toFixed(2)}`;
}

// Format date
function formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    try {
        return format(parseISO(dateStr), "MM-dd-yyyy");
    } catch {
        return dateStr;
    }
}

// Get raw cell value as string for filtering
function getRawCellValue(row: MasterReportRow, columnKey: string): string {
    const value = (row as any)[columnKey];
    if (value == null) return "-";
    if (typeof value === "number") return value.toString();
    return String(value);
}

// Column Filter Dropdown Component
// Uses EXCLUDED values approach: empty excludedValues = show all, non-empty = hide those values
function ColumnFilterDropdown({
    columnKey,
    columnLabel,
    data,
    selectedValues,  // This is actually "included" values - if empty, show all
    onFilterChange,
    align
}: {
    columnKey: string;
    columnLabel: string;
    data: MasterReportRow[];
    selectedValues: Set<string>;  // Values to INCLUDE (empty = include all)
    onFilterChange: (values: Set<string>) => void;
    align: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get unique values from the data with counts
    const valueCounts = new Map<string, number>();
    data.forEach(row => {
        const val = getRawCellValue(row, columnKey);
        valueCounts.set(val, (valueCounts.get(val) || 0) + 1);
    });

    // Sort by value
    const uniqueValues = Array.from(valueCounts.keys()).sort((a, b) => {
        if (a === "-") return 1;
        if (b === "-") return -1;
        return a.localeCompare(b);
    });

    // hasFilter = there is an active filter
    const hasFilter = selectedValues.size > 0;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Determine if a value is currently "checked" (will be shown)
    const isValueChecked = (value: string): boolean => {
        if (!hasFilter) return true; // No filter = all checked
        return selectedValues.has(value);
    };

    const handleToggleValue = (value: string) => {
        const newSet = new Set(selectedValues);

        if (!hasFilter) {
            // No filter yet - user is unchecking, so include all EXCEPT this one
            uniqueValues.forEach(v => {
                if (v !== value) newSet.add(v);
            });
        } else {
            // Filter exists
            if (newSet.has(value)) {
                // Currently checked - uncheck it
                newSet.delete(value);
            } else {
                // Currently unchecked - check it
                newSet.add(value);
            }
        }

        // If all values are selected, clear the filter
        if (newSet.size === uniqueValues.length || newSet.size === 0) {
            onFilterChange(new Set());
        } else {
            onFilterChange(newSet);
        }
    };

    const handleSelectAll = () => {
        onFilterChange(new Set()); // Empty = no filter = all visible
    };

    const handleClearAll = () => {
        // Clear ALL checks - this means nothing is selected, so nothing shows
        // We'll use a special state: set with all values removed = empty set
        // But empty set means "show all", so we need at least one to exclude
        // Actually: set selectedValues to an empty set to "clear" and let user re-select
        // For UX, clearing should visually uncheck all but not filter yet
        // Let's make clear = uncheck all = show nothing (filter to empty result)
        onFilterChange(new Set(["__CLEAR_ALL__"])); // Special marker for "nothing selected"
    };

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-1 px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors select-none shrink-0 w-full whitespace-nowrap",
                    hasFilter ? "text-cyan-400" : "text-white hover:text-zinc-300",
                    align === "right" && "justify-end",
                    align === "center" && "justify-center"
                )}
            >
                {columnLabel}
                {hasFilter ? (
                    <Filter size={14} className="text-cyan-400" />
                ) : (
                    <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
                )}
            </button>

            {isOpen && (
                <div
                    className="absolute top-full left-0 mt-1 w-64 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden flex flex-col"
                    style={{ minWidth: "200px" }}
                >
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                        <span className="text-xs text-zinc-400 uppercase tracking-wider">Filter by {columnLabel}</span>
                        <span className="text-xs text-zinc-500">{uniqueValues.length} values</span>
                    </div>

                    {/* Select All / Clear */}
                    <div className="px-2 py-2 border-b border-white/10 flex gap-2">
                        <button
                            onClick={handleSelectAll}
                            className="flex-1 text-xs px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                        >
                            Select All
                        </button>
                        <button
                            onClick={handleClearAll}
                            className="flex-1 text-xs px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                        >
                            Clear
                        </button>
                    </div>

                    {/* Value List */}
                    <div className="flex-1 overflow-y-auto max-h-52 py-1">
                        {uniqueValues.map((value) => {
                            const count = valueCounts.get(value) || 0;
                            const isChecked = isValueChecked(value);
                            return (
                                <button
                                    key={value}
                                    onClick={() => handleToggleValue(value)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition-colors text-left"
                                >
                                    <div className={cn(
                                        "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
                                        isChecked
                                            ? "bg-cyan-400 border-cyan-400"
                                            : "border-white/20"
                                    )}>
                                        {isChecked && <Check size={12} className="text-black" strokeWidth={3} />}
                                    </div>
                                    <span className="flex-1 text-sm text-white truncate">{value}</span>
                                    <span className="text-xs text-zinc-500">({count})</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export function ReportTable({ data, unfilteredData, visibleColumns, searchQuery = "", columnFilters, onColumnFilterChange, onCellClick }: ReportTableProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 10,
    });

    // Get cell value with formatting
    const getCellValue = (row: MasterReportRow, columnKey: string): React.ReactNode => {
        switch (columnKey) {
            // Booking fields
            case "confirmation_number":
                return <span className="font-mono text-white">{row.confirmation_number || "-"}</span>;
            case "booking_status":
                return <span className="text-sm text-white">{row.booking_status || "-"}</span>;
            case "pax_count":
                return <span className="text-white">{row.pax_count}</span>;
            case "total_amount":
                return <span className="font-mono text-white">{formatCurrency(row.total_amount)}</span>;
            case "amount_paid":
                return <span className="font-mono text-white">{formatCurrency(row.amount_paid)}</span>;
            case "balance_due":
                return <span className="font-mono text-white">{formatCurrency(row.balance_due)}</span>;
            case "payment_status": {
                // Humanize snake_case to Title Case (e.g., "no_payment" → "No Payment")
                const humanize = (str: string) => str
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                return <span className="text-sm text-white">{row.payment_status ? humanize(row.payment_status) : "-"}</span>;
            }
            case "voucher_numbers":
                return row.voucher_numbers || "-";
            case "notes":
                return (
                    <span className="max-w-[200px] truncate block" title={row.notes || ""}>
                        {row.notes || "-"}
                    </span>
                );
            case "booking_created_at":
                return formatDate(row.booking_created_at);
            case "booking_id":
                return <span className="font-mono text-sm text-white">{row.booking_id}</span>;

            // Customer fields
            case "customer_name":
                return <span className="text-sm text-white">{row.customer_name}</span>;
            case "customer_email":
                return row.customer_email || "-";
            case "customer_phone":
                return formatPhoneNumber(row.customer_phone);
            case "customer_hotel":
                return row.customer_hotel || "-";
            case "customer_source":
                return row.customer_source || "-";
            case "customer_status":
                return row.customer_status || "-";
            case "preferred_messaging_app":
                return row.preferred_messaging_app || "-";
            case "dietary_restrictions":
                return row.dietary_restrictions || "-";
            case "accessibility_needs":
                return row.accessibility_needs || "-";
            case "emergency_contact_name":
                return row.emergency_contact_name || "-";
            case "emergency_contact_phone":
                return formatPhoneNumber(row.emergency_contact_phone);
            case "customer_total_value":
                return <span className="font-mono text-white">{formatCurrency(row.customer_total_value)}</span>;
            case "customer_id":
                return <span className="font-mono text-sm text-white">{row.customer_id}</span>;

            // Experience fields
            case "experience_code":
                return <span className="font-mono text-white">{row.experience_code || "-"}</span>;
            case "experience_name":
                return row.experience_name || "-";
            case "start_date":
                return formatDate(row.start_date);
            case "start_time":
                return row.start_time || "-";
            case "max_capacity":
                return row.max_capacity ?? "-";

            // Staff fields
            case "driver_name":
                return row.driver_name || "-";
            case "guide_name":
                return row.guide_name || "-";
            case "vehicle_name":
                return row.vehicle_name || "-";
            case "route_name":
                return row.route_name || "-";

            // Pickup fields
            case "pickup_location":
                return row.pickup_location || "-";
            case "pickup_time":
                return row.pickup_time || "-";

            default:
                return (row as any)[columnKey] ?? "-";
        }
    };

    // Get column width
    const getColumnWidth = (key: string): string => {
        const column = REPORT_COLUMNS.find(c => c.key === key);
        return column?.width || "120px";
    };

    // Get column alignment
    const getColumnAlign = (key: string): string => {
        const column = REPORT_COLUMNS.find(c => c.key === key);
        return column?.align || "left";
    };

    // Preserve user's column order by mapping from visibleColumns
    const visibleColumnConfigs = visibleColumns
        .map(key => REPORT_COLUMNS.find(col => col.key === key))
        .filter((col): col is NonNullable<typeof col> => col != null);

    // Calculate total width for horizontal scroll
    const totalWidth = visibleColumnConfigs.reduce((acc, col) => {
        const width = parseInt(col.width || "120", 10);
        return acc + width;
    }, 0);

    // Calculate totals for summable columns
    const columnTotals = useMemo(() => {
        const totals: { [key: string]: string | number } = {};

        visibleColumnConfigs.forEach(col => {
            if (SUMMABLE_COLUMNS.has(col.key)) {
                const sum = data.reduce((acc, row) => {
                    const value = row[col.key as keyof MasterReportRow];
                    const num = typeof value === 'number' ? value : parseFloat(String(value) || '0');
                    return acc + (isNaN(num) ? 0 : num);
                }, 0);
                totals[col.key] = sum;
            } else {
                totals[col.key] = "Total";
            }
        });

        return totals;
    }, [data, visibleColumnConfigs]);

    // Format total value for display
    const formatTotalValue = (key: string, value: string | number): string => {
        if (typeof value === 'string') return value;

        // Currency columns
        if (['total_amount', 'amount_paid', 'balance_due', 'customer_total_value'].includes(key)) {
            return `$${value.toFixed(2)}`;
        }

        // Integer columns
        return value.toString();
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Horizontal scroll container */}
            <div
                className="flex-1 overflow-x-auto overflow-y-hidden report-scrollbar"
                style={{
                    scrollbarWidth: 'auto',
                    scrollbarColor: '#0e7490 transparent'
                }}
            >
                <div style={{ minWidth: `${totalWidth}px` }}>
                    {/* Header with Filter Dropdowns */}
                    <div className="shrink-0 bg-white/5 border-b-2 border-white/20 sticky top-0 z-10">
                        <div className="flex">
                            {visibleColumnConfigs.map((column) => (
                                <div
                                    key={column.key}
                                    style={{ width: getColumnWidth(column.key) }}
                                    className="shrink-0"
                                >
                                    <ColumnFilterDropdown
                                        columnKey={column.key}
                                        columnLabel={column.label}
                                        data={unfilteredData}
                                        selectedValues={columnFilters[column.key] || new Set()}
                                        onFilterChange={(values) => onColumnFilterChange(column.key, values)}
                                        align={getColumnAlign(column.key)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Body with Virtual Scrolling */}
                    <div
                        ref={parentRef}
                        className="overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-800 scrollbar-track-transparent"
                        style={{ height: "calc(100% - 44px)" }}
                    >
                        <div
                            style={{
                                height: `${virtualizer.getTotalSize()}px`,
                                width: "100%",
                                position: "relative",
                            }}
                        >
                            {virtualizer.getVirtualItems().map((virtualRow) => {
                                const row = data[virtualRow.index];
                                const isOddRow = virtualRow.index % 2 === 1;
                                return (
                                    <div
                                        key={row.booking_id}
                                        className={cn(
                                            "absolute top-0 left-0 w-full flex items-center border-b border-white/10 hover:bg-cyan-400/10 transition-colors",
                                            isOddRow && "bg-white/[0.02]"
                                        )}
                                        style={{
                                            height: `${ROW_HEIGHT}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        {visibleColumnConfigs.map((column) => (
                                            <div
                                                key={column.key}
                                                onClick={() => onCellClick?.(row, column.key)}
                                                className={cn(
                                                    "px-4 text-sm text-white truncate shrink-0",
                                                    getColumnAlign(column.key) === "right" && "text-right",
                                                    getColumnAlign(column.key) === "center" && "text-center",
                                                    onCellClick && "cursor-pointer hover:bg-cyan-400/10 transition-colors"
                                                )}
                                                style={{ width: getColumnWidth(column.key) }}
                                            >
                                                {getCellValue(row, column.key)}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Totals Row */}
                    {data.length > 0 && (
                        <div className="shrink-0 bg-white/10 border-t-2 border-white/20 sticky bottom-0 z-10">
                            <div
                                className="flex items-center"
                                style={{ height: `${ROW_HEIGHT}px` }}
                            >
                                {visibleColumnConfigs.map((column) => (
                                    <div
                                        key={column.key}
                                        className={cn(
                                            "px-4 text-sm font-bold text-white truncate shrink-0",
                                            getColumnAlign(column.key) === "right" && "text-right",
                                            getColumnAlign(column.key) === "center" && "text-center"
                                        )}
                                        style={{ width: getColumnWidth(column.key) }}
                                    >
                                        {formatTotalValue(column.key, columnTotals[column.key])}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
