"use client";

import { useRef, useState, useMemo, memo } from "react";
import { Customer } from "../types";
import { ArrowUp, ArrowDown, ChevronsUpDown, Edit2, Trash2, Mail, Phone, Building2, Activity, DollarSign, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CUSTOMER_COLUMNS, ColumnConfig } from "./column-picker";
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

    const visibleColumnConfigs = useMemo(() =>
        CUSTOMER_COLUMNS.filter(col => visibleColumns.includes(col.key)),
        [visibleColumns]);

    const virtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 10,
    });

    const gridTemplateColumns = useMemo(() => {
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
        return visibleColumnConfigs.map(col => getColumnWidth(col.key)).join(" ") + " 100px";
    }, [visibleColumnConfigs]);

    if (data.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                No customers found matching your criteria.
            </div>
        );
    }

    return (
        <TooltipProvider delayDuration={200}>
            <div className="h-full flex flex-col">
                {/* Desktop Grid Table - Single scroll container with sticky header */}
                <div
                    ref={parentRef}
                    className="h-full hidden md:block overflow-auto"
                >
                    {/* Sticky Header Row with Glassy Background */}
                    <div
                        className="grid bg-muted/80 backdrop-blur-sm text-foreground text-sm uppercase tracking-wider font-semibold border-b border-border sticky top-0 z-20"
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
                                        "px-4 py-3 cursor-pointer hover:bg-muted transition-colors group select-none flex items-center gap-2",
                                        isActive ? "text-primary" : "text-foreground"
                                    )}
                                    onClick={() => onSort && onSort(col.sortKey || col.key)}
                                >
                                    {col.label}
                                    <DirectionIcon size={14} className={cn("shrink-0 transition-opacity", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50")} />
                                </div>
                            );
                        })}
                        <div className="px-4 py-3 border-l border-border"></div>
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
                                <CustomerRow
                                    key={customer.id}
                                    customer={customer}
                                    virtualRow={virtualRow}
                                    visibleColumnConfigs={visibleColumnConfigs}
                                    gridTemplateColumns={gridTemplateColumns}
                                    onEdit={onEdit}
                                    onDelete={setDeletingItem}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden h-full overflow-auto space-y-4 p-4">
                    {data.slice(0, 100).map((customer) => (
                        <div key={customer.id} className="bg-card border border-border rounded-xl p-4 space-y-4">
                            <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
                                <h3 className="text-lg font-bold text-foreground leading-tight">
                                    {customer.name}
                                </h3>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onEdit(customer)}
                                        className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingItem(customer)}
                                        className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {visibleColumns.includes("email") && customer.email && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail size={14} className="text-muted-foreground" />
                                        <span className="break-all">{customer.email}</span>
                                    </div>
                                )}
                                {visibleColumns.includes("phone") && customer.phone && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone size={14} className="text-muted-foreground" />
                                        {formatPhoneNumber(customer.phone)}
                                    </div>
                                )}
                                {visibleColumns.includes("hotel") && customer.metadata?.hotel && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Building2 size={14} className="text-muted-foreground" />
                                        {customer.metadata.hotel}
                                    </div>
                                )}
                                {visibleColumns.includes("total_value") && (
                                    <div className="flex items-center gap-2 text-foreground font-mono">
                                        <DollarSign size={14} className="text-muted-foreground" />
                                        {customer.total_value}
                                    </div>
                                )}
                            </div>

                            {/* Footer with Status and Date */}
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                                {visibleColumns.includes("status") && (
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                        <Activity size={14} className="text-muted-foreground" />
                                        {customer.status}
                                    </div>
                                )}
                                {visibleColumns.includes("created_at") && customer.created_at && (
                                    <div className="flex items-center gap-2 text-muted-foreground text-sm ml-auto">
                                        <Calendar size={14} />
                                        {format(new Date(customer.created_at), "MMM dd, yyyy")}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {data.length > 100 && (
                        <div className="text-center text-muted-foreground py-4">
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
            </div>
        </TooltipProvider>
    );
}

// Optimization: Memoized Row Component
const CustomerRow = memo(({ customer, virtualRow, visibleColumnConfigs, gridTemplateColumns, onEdit, onDelete }: {
    customer: Customer;
    virtualRow: any;
    visibleColumnConfigs: ColumnConfig[];
    gridTemplateColumns: string;
    onEdit: (c: Customer) => void;
    onDelete: (c: Customer) => void;
}) => {
    return (
        <div
            className="grid hover:bg-muted/50 transition-colors group cursor-pointer border-b border-border"
            style={{
                gridTemplateColumns,
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${ROW_HEIGHT}px`,
                transform: `translateY(${virtualRow.start}px)`,
                willChange: 'transform', // Optimization
            }}
        >
            {visibleColumnConfigs.map((col: ColumnConfig) => (
                <div key={col.key} className="px-4 py-3 flex items-center overflow-hidden">
                    {getCellValue(customer, col.key)}
                </div>
            ))}
            <div className="px-4 py-3 pl-6 flex items-center justify-end gap-2 border-l border-border" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(customer);
                    }}
                    className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(customer);
                    }}
                    className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
}, (prev: any, next: any) => {
    return (
        prev.customer === next.customer &&
        prev.virtualRow.start === next.virtualRow.start &&
        prev.visibleColumnConfigs === next.visibleColumnConfigs &&
        prev.gridTemplateColumns === next.gridTemplateColumns
    );
});

// Helper for cell rendering (extracted to avoid recreation)
const getCellValue = (customer: Customer, columnKey: string) => {
    switch (columnKey) {
        case "name":
            return <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate">{customer.name}</span>;
        case "email":
            return (
                <span className="flex items-center gap-2 text-muted-foreground truncate">
                    <Mail size={14} className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{customer.email}</span>
                </span>
            );
        case "phone":
            return (
                <span className="flex items-center gap-2 text-muted-foreground truncate">
                    <Phone size={14} className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{customer.phone ? formatPhoneNumber(customer.phone) : "-"}</span>
                </span>
            );
        case "hotel":
            return (
                <span className="flex items-center gap-2 text-muted-foreground truncate">
                    <Building2 size={14} className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{customer.metadata?.hotel || "-"}</span>
                </span>
            );
        case "app":
            const app = customer.preferences?.preferred_messaging_app;
            const handle = customer.preferences?.messaging_handle;
            const icon = getMessagingIcon(app);
            if (!app) return <span className="text-muted-foreground">-</span>;

            // Format handle as phone number if it looks like one
            const formattedHandle = handle ? (
                /^\d{10,}$/.test(handle.replace(/\D/g, ''))
                    ? formatPhoneNumber(handle)
                    : handle
            ) : "";

            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span className="flex items-center gap-2 text-muted-foreground truncate cursor-help">
                            <span className="flex-shrink-0">{icon}</span>
                            <span className="truncate">{formattedHandle}</span>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <span>{app}</span>
                    </TooltipContent>
                </Tooltip>
            );
        case "source":
            return <span className="text-muted-foreground truncate">{customer.metadata?.source || "-"}</span>;
        case "status":
            return <span className="text-muted-foreground truncate">{customer.status}</span>;
        case "total_value":
            return <span className="text-foreground font-mono">{customer.total_value}</span>;
        case "created_at":
            return <span className="text-muted-foreground text-sm whitespace-nowrap">{customer.created_at ? format(new Date(customer.created_at), "MMM dd, yyyy") : "-"}</span>;
        default:
            return "-";
    }
};
