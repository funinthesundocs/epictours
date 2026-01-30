"use client";

import { useRef } from "react";
import { MasterReportRow } from "../types";
import { REPORT_COLUMNS } from "./column-picker";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format, parseISO } from "date-fns";

interface ReportTableProps {
    data: MasterReportRow[];
    sortConfig?: { key: string; direction: "asc" | "desc" } | null;
    onSort?: (key: string) => void;
    visibleColumns: string[];
    searchQuery?: string;
}

const ROW_HEIGHT = 44;

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

export function ReportTable({ data, sortConfig, onSort, visibleColumns, searchQuery = "" }: ReportTableProps) {
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
            case "payment_status":
                return <span className="text-sm text-white">{row.payment_status || "-"}</span>;
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
                return <span className="font-mono">{formatCurrency(row.customer_total_value)}</span>;
            case "customer_id":
                return <span className="font-mono text-sm text-white">{row.customer_id}</span>;

            // Experience/Availability fields
            case "experience_code":
                return <span className="text-sm text-white">{row.experience_code}</span>;
            case "experience_name":
                return <span className="text-sm text-white">{row.experience_name}</span>;
            case "start_date":
                return formatDate(row.start_date);
            case "start_time":
                return row.start_time?.slice(0, 5) || "-";
            case "max_capacity":
                return row.max_capacity;

            // Staff & Resources
            case "driver_name":
                return row.driver_name || "-";
            case "guide_name":
                return row.guide_name || "-";
            case "vehicle_name":
                return row.vehicle_name || "-";
            case "route_name":
                return row.route_name || "-";

            // Pickup info
            case "pickup_location":
                return row.pickup_location || "-";
            case "pickup_time":
                return row.pickup_time || "-";

            default:
                return "-";
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

    // Sort indicator
    const SortIndicator = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) {
            return <ChevronsUpDown size={14} className="text-zinc-600" />;
        }
        return sortConfig.direction === "asc"
            ? <ArrowUp size={14} className="text-cyan-400" />
            : <ArrowDown size={14} className="text-cyan-400" />;
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

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Horizontal scroll container */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div style={{ minWidth: `${totalWidth}px` }}>
                    {/* Header */}
                    <div className="shrink-0 bg-white/5 border-b border-white/10 sticky top-0 z-10">
                        <div className="flex">
                            {visibleColumnConfigs.map((column) => (
                                <div
                                    key={column.key}
                                    onClick={() => onSort?.(column.key)}
                                    className={cn(
                                        "flex items-center gap-1 px-4 py-3 text-sm font-bold uppercase tracking-wider text-white cursor-pointer hover:text-white transition-colors select-none shrink-0",
                                        getColumnAlign(column.key) === "right" && "justify-end",
                                        getColumnAlign(column.key) === "center" && "justify-center"
                                    )}
                                    style={{ width: getColumnWidth(column.key) }}
                                >
                                    {column.label}
                                    <SortIndicator columnKey={column.key} />
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
                                return (
                                    <div
                                        key={row.booking_id}
                                        className="absolute top-0 left-0 w-full flex items-center border-b border-white/5 hover:bg-cyan-400/5 transition-colors"
                                        style={{
                                            height: `${ROW_HEIGHT}px`,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        {visibleColumnConfigs.map((column) => (
                                            <div
                                                key={column.key}
                                                className={cn(
                                                    "px-4 text-sm text-white truncate shrink-0",
                                                    getColumnAlign(column.key) === "right" && "text-right",
                                                    getColumnAlign(column.key) === "center" && "text-center"
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
                </div>
            </div>
        </div>
    );
}
