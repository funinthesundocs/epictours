"use client";

import { useRef } from "react";
import { Customer } from "../types";
import { ArrowUp, ArrowDown, ChevronsUpDown, Edit2, Trash2, Mail, Phone, Building2, Activity, DollarSign, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CUSTOMER_COLUMNS } from "./column-picker";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format } from "date-fns";

// Messaging app icons
import { FaWhatsapp, FaFacebookMessenger, FaTelegram, FaViber, FaWeixin, FaLine } from "react-icons/fa";
import { SiSignal } from "react-icons/si";

// Helper to get messaging app icon (monochrome for list view)
const getMessagingIcon = (app: string | null | undefined) => {
    if (!app) return null;
    const iconClass = "text-zinc-400";
    switch (app) {
        case "WhatsApp": return <FaWhatsapp size={16} className={iconClass} />;
        case "FB Messenger": return <FaFacebookMessenger size={16} className={iconClass} />;
        case "Signal": return <SiSignal size={16} className={iconClass} />;
        case "Telegram": return <FaTelegram size={16} className={iconClass} />;
        case "Viber": return <FaViber size={16} className={iconClass} />;
        case "Line": return <FaLine size={16} className={iconClass} />;
        case "WeChat": return <FaWeixin size={16} className={iconClass} />;
        default: return null;
    }
};

interface CustomerTableProps {
    data: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (id: string) => void;
    sortConfig?: { key: string; direction: "asc" | "desc" } | null;
    onSort?: (key: string) => void;
    visibleColumns: string[];
}

const ROW_HEIGHT = 48;

// Helper to format phone number as (XXX)XXX-XXXX
function formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits[0] === '1') {
        return `(${digits.slice(1, 4)})${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return phone;
}

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
                return (
                    <span className="flex items-center gap-2 text-zinc-400 truncate">
                        <Mail size={14} className="shrink-0 text-zinc-500" />
                        <span className="truncate">{customer.email}</span>
                    </span>
                );
            case "phone":
                return (
                    <span className="flex items-center gap-2 text-zinc-400 truncate">
                        <Phone size={14} className="shrink-0 text-zinc-500" />
                        <span className="truncate">{customer.phone ? formatPhoneNumber(customer.phone) : "-"}</span>
                    </span>
                );
            case "hotel":
                return (
                    <span className="flex items-center gap-2 text-zinc-400 truncate">
                        <Building2 size={14} className="shrink-0 text-zinc-500" />
                        <span className="truncate">{customer.metadata?.hotel || "-"}</span>
                    </span>
                );
            case "app":
                const app = customer.preferences?.preferred_messaging_app;
                const handle = customer.preferences?.messaging_handle;
                const icon = getMessagingIcon(app);
                if (!app) return <span className="text-zinc-500">-</span>;

                // Format handle as phone number if it looks like one
                const formattedHandle = handle ? (
                    /^\d{10,}$/.test(handle.replace(/\D/g, ''))
                        ? formatPhoneNumber(handle)
                        : handle
                ) : "";

                return (
                    <TooltipProvider delayDuration={200}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="flex items-center gap-2 text-zinc-400 truncate cursor-help">
                                    <span className="flex-shrink-0">{icon}</span>
                                    <span className="truncate">{formattedHandle}</span>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <span>{app}</span>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
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
            case "created_at": return "150px";
            default: return "1fr";
        }
    };
    const gridTemplateColumns = visibleColumnConfigs.map(col => getColumnWidth(col.key)).join(" ") + " 100px";

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
                    <div className="px-4 py-3 border-l border-white/10"></div>
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
                                <div className="px-4 py-3 pl-6 flex items-center justify-end gap-2 border-l border-white/10" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(customer);
                                        }}
                                        className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingItem(customer);
                                        }}
                                        className="p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
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
                                    className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => setDeletingItem(customer)}
                                    className="p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {visibleColumns.includes("email") && customer.email && (
                                <div className="flex items-center gap-2 text-zinc-300">
                                    <Mail size={14} className="text-zinc-500" />
                                    <span className="break-all">{customer.email}</span>
                                </div>
                            )}
                            {visibleColumns.includes("phone") && customer.phone && (
                                <div className="flex items-center gap-2 text-zinc-300">
                                    <Phone size={14} className="text-zinc-500" />
                                    {formatPhoneNumber(customer.phone)}
                                </div>
                            )}
                            {visibleColumns.includes("hotel") && customer.metadata?.hotel && (
                                <div className="flex items-center gap-2 text-zinc-300">
                                    <Building2 size={14} className="text-zinc-500" />
                                    {customer.metadata.hotel}
                                </div>
                            )}
                            {visibleColumns.includes("total_value") && (
                                <div className="flex items-center gap-2 text-white font-mono">
                                    <DollarSign size={14} className="text-zinc-500" />
                                    {customer.total_value}
                                </div>
                            )}
                        </div>

                        {/* Footer with Status and Date */}
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            {visibleColumns.includes("status") && (
                                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                    <Activity size={14} className="text-zinc-500" />
                                    {customer.status}
                                </div>
                            )}
                            {visibleColumns.includes("created_at") && customer.created_at && (
                                <div className="flex items-center gap-2 text-zinc-500 text-sm ml-auto">
                                    <Calendar size={14} />
                                    {format(new Date(customer.created_at), "MMM dd, yyyy")}
                                </div>
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
