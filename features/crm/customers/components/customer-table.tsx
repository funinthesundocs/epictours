"use client";

import { useRef } from "react";
import { Customer } from "../types";
import { ArrowUp, ArrowDown, ChevronsUpDown, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { CUSTOMER_COLUMNS } from "./column-picker";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format } from "date-fns";

interface CustomerTableProps {
    data: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (id: string) => void;
    sortConfig?: { key: string; direction: "asc" | "desc" } | null;
    onSort?: (key: string) => void;
    visibleColumns: string[];
}

const ROW_HEIGHT = 48;

export function CustomerTable({ data, onEdit, onDelete, sortConfig, onSort, visibleColumns }: CustomerTableProps) {
    const [deletingItem, setDeletingItem] = useState<Customer | null>(null);
    const parentRef = useRef<HTMLDivElement>(null);

    const visibleColumnConfigs = CUSTOMER_COLUMNS.filter(col => visibleColumns.includes(col.key));

    const virtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 10,
    });

    const getCellValue = (customer: Customer, columnKey: string) => {
        switch (columnKey) {
            case "name":
                return <span className="font-medium text-white group-hover:text-cyan-400 transition-colors truncate">{customer.name}</span>;
            case "email":
                return <span className="text-zinc-400 truncate">{customer.email}</span>;
            case "phone":
                return <span className="text-zinc-400 truncate">{customer.phone || "-"}</span>;
            case "hotel":
                return <span className="text-zinc-400 truncate">{customer.metadata?.hotel || "-"}</span>;
            case "app":
                return <span className="text-zinc-400 truncate">{customer.preferences?.preferred_messaging_app || "-"}</span>;
            case "source":
                return <span className="text-zinc-400 truncate">{customer.metadata?.source || "-"}</span>;
            case "status":
                return <span className="text-zinc-400 truncate">{customer.status}</span>;
            case "total_value":
                return <span className="text-white font-mono">{customer.total_value}</span>;
            case "created_at":
                return <span className="text-zinc-400 text-sm whitespace-nowrap">{customer.created_at ? format(new Date(customer.created_at), "MMM dd, yyyy") : "-"}</span>;
            default:
                return "-";
        }
    };

    if (data.length === 0) {
        return (
            <div className="text-center py-20 text-zinc-500">
                No customers found matching your criteria.
            </div>
        );
    }

    const getColumnWidth = (key: string) => {
        switch (key) {
            case "name": return "minmax(120px, 1fr)";
            case "email": return "minmax(180px, 2fr)";
            case "phone": return "minmax(100px, 1fr)";
            case "hotel": return "minmax(100px, 1fr)";
            case "app": return "minmax(80px, 1fr)";
            case "source": return "minmax(80px, 1fr)";
            case "status": return "minmax(80px, 1fr)";
            case "total_value": return "50px";
            case "created_at": return "110px";
            default: return "1fr";
        }
    };
    const gridTemplateColumns = visibleColumnConfigs.map(col => getColumnWidth(col.key)).join(" ") + " 80px";

    return (
        <>
            {/* Desktop Grid Table - Single scroll container with sticky header */}
            <div
                ref={parentRef}
                className="h-full hidden md:block overflow-auto"
            >
                {/* Sticky Header Row with Glassy Background */}
                <div
                    className="grid bg-white/5 backdrop-blur-sm text-zinc-400 text-xs uppercase tracking-wider font-semibold border-b border-white/5 sticky top-0 z-20"
                    style={{ gridTemplateColumns }}
                >
                    {visibleColumnConfigs.map((col) => {
                        const isActive = sortConfig?.key === (col.sortKey || col.key);
                        const DirectionIcon = isActive
                            ? (sortConfig?.direction === "asc" ? ArrowUp : ArrowDown)
                            : ChevronsUpDown;

                        return (
                            <div
                                key={col.key}
                                className={cn(
                                    "px-4 py-3 cursor-pointer hover:bg-[#0b1115] transition-colors group select-none flex items-center gap-2",
                                    isActive ? "text-cyan-400" : "text-zinc-400"
                                )}
                                onClick={() => onSort && onSort(col.sortKey || col.key)}
                            >
                                {col.label}
                                <DirectionIcon size={14} className={cn("shrink-0 transition-opacity", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50")} />
                            </div>
                        );
                    })}
                    <div className="px-4 py-3"></div>
                </div>

                {/* Virtual Scrolling Body */}
                <div
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                        const customer = data[virtualRow.index];
                        return (
                            <div
                                key={customer.id}
                                className="grid hover:bg-white/5 transition-colors group cursor-pointer border-b border-white/5"
                                style={{
                                    gridTemplateColumns,
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${ROW_HEIGHT}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            >
                                {visibleColumnConfigs.map((col) => (
                                    <div key={col.key} className="px-4 py-3 flex items-center overflow-hidden">
                                        {getCellValue(customer, col.key)}
                                    </div>
                                ))}
                                <div className="px-4 py-3 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(customer);
                                        }}
                                        className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingItem(customer);
                                        }}
                                        className="p-1.5 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden h-full overflow-auto space-y-4 p-4">
                {data.slice(0, 100).map((customer) => (
                    <div key={customer.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                        <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                            <h3 className="text-lg font-bold text-white leading-tight">
                                {customer.name}
                            </h3>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => onEdit(customer)}
                                    className="p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => setDeletingItem(customer)}
                                    className="p-2 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-base">
                            {visibleColumns.includes("email") && (
                                <>
                                    <div className="text-zinc-500">Email</div>
                                    <div className="text-zinc-300 break-all">{customer.email}</div>
                                </>
                            )}
                            {visibleColumns.includes("phone") && (
                                <>
                                    <div className="text-zinc-500">Cell</div>
                                    <div className="text-zinc-300">{customer.phone || "-"}</div>
                                </>
                            )}
                            {visibleColumns.includes("hotel") && (
                                <>
                                    <div className="text-zinc-500">Hotel</div>
                                    <div className="text-zinc-300">{customer.metadata?.hotel || "-"}</div>
                                </>
                            )}
                            {visibleColumns.includes("status") && (
                                <>
                                    <div className="text-zinc-500">Status</div>
                                    <div className="text-zinc-300">{customer.status}</div>
                                </>
                            )}
                            {visibleColumns.includes("total_value") && (
                                <>
                                    <div className="text-zinc-500">AP</div>
                                    <div className="text-white font-mono">{customer.total_value}</div>
                                </>
                            )}
                            {visibleColumns.includes("created_at") && (
                                <>
                                    <div className="text-zinc-500">Created</div>
                                    <div className="text-zinc-300">{customer.created_at ? format(new Date(customer.created_at), "MMM dd, yyyy") : "-"}</div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
                {data.length > 100 && (
                    <div className="text-center text-zinc-500 py-4">
                        Showing 100 of {data.length} customers. Use search to filter.
                    </div>
                )}
            </div>

            <AlertDialog
                isOpen={!!deletingItem}
                onClose={() => setDeletingItem(null)}
                onConfirm={() => {
                    if (deletingItem && deletingItem.id) {
                        onDelete(deletingItem.id);
                        setDeletingItem(null);
                    }
                }}
                title="Delete Customer?"
                description={`Are you sure you want to remove "${deletingItem?.name}"?`}
                confirmLabel="Delete Customer"
                isDestructive={true}
            />
        </>
    );
}
