"use client";

import { useState } from "react";
import { Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Handshake, MapPin, Phone, Mail, FileText } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface Vendor {
    id: string;
    name: string;
    address: string;
    city?: string;
    state?: string;
    zip_code?: string;
    phone: string;
    email: string;
    ein_number: string;
}

interface VendorsTableProps {
    data: Vendor[];
    onEdit: (vendor: Vendor) => void;
    onDelete: (id: string) => void;
}

type SortConfig = {
    key: keyof Vendor;
    direction: 'asc' | 'desc';
} | null;

export function VendorsTable({ data, onEdit, onDelete }: VendorsTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [deletingItem, setDeletingItem] = useState<Vendor | null>(null);

    const formatPhoneNumber = (str: string | null | undefined) => {
        if (!str) return "—";
        const cleaned = str.replace(/\D/g, "");
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        return str;
    };

    const handleSort = (key: keyof Vendor) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0;
        const valA = a[sortConfig.key] || "";
        const valB = b[sortConfig.key] || "";

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ column }: { column: keyof Vendor }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown size={12} className="opacity-30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />;
    };

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-popover rounded-xl border border-border">
                No vendors found.
            </div>
        );
    }

    return (
        <>
            <div className="h-full overflow-auto relative">
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-muted/50 backdrop-blur-sm text-foreground text-sm uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-border">
                        <tr>
                            {[
                                { key: 'name', label: 'Vendor Name' },
                                { key: 'address', label: 'Address' },
                                { key: 'phone', label: 'Phone' },
                                { key: 'email', label: 'Email' },
                                { key: 'ein_number', label: 'EIN' },
                            ].map((col) => (
                                <th
                                    key={col.key}
                                    className="px-6 py-4 cursor-pointer hover:bg-muted/50 transition-colors select-none"
                                    onClick={() => handleSort(col.key as keyof Vendor)}
                                >
                                    <div className="flex items-center gap-2">
                                        {col.label}
                                        <SortIcon column={col.key as keyof Vendor} />
                                    </div>
                                </th>
                            ))}
                            <th className="px-6 py-4 w-[100px] border-l border-border"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-muted-foreground">
                        {sortedData.map((v) => (
                            <tr key={v.id} className="hover:bg-muted/50 transition-colors group">
                                <td className="px-6 py-4 align-middle font-medium text-foreground">
                                    {v.name}
                                </td>
                                <td className="px-6 py-4 align-middle truncate max-w-xs" title={v.address || ""}>
                                    <div className="flex items-start gap-2 text-muted-foreground">
                                        <MapPin size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span>{v.address || "—"}</span>
                                            {(v.city || v.state || v.zip_code) && (
                                                <span className="text-xs text-muted-foreground">
                                                    {[v.city, v.state].filter(Boolean).join(", ")} {v.zip_code}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <Phone size={14} className="shrink-0 text-muted-foreground" />
                                        {formatPhoneNumber(v.phone)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <Mail size={14} className="shrink-0 text-muted-foreground" />
                                        {v.email || "—"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <FileText size={14} className="shrink-0 text-muted-foreground" />
                                        {v.ein_number || "—"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 align-middle border-l border-border">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(v);
                                            }}
                                            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingItem(v);
                                            }}
                                            className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4">
                    {sortedData.map((v) => (
                        <div key={v.id} className="bg-card border border-border rounded-xl p-4 space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
                                <h3 className="text-lg font-bold text-foreground leading-tight">
                                    {v.name}
                                </h3>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onEdit(v)}
                                        className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingItem(v)}
                                        className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Body Grid */}
                            <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-sm">
                                <div className="text-muted-foreground">Address</div>
                                <div className="text-muted-foreground truncate flex items-start gap-2">
                                    <MapPin size={14} className="mt-0.5 shrink-0" />
                                    <div className="flex flex-col">
                                        <span>{v.address || "—"}</span>
                                        {(v.city || v.state || v.zip_code) && (
                                            <span className="text-xs text-muted-foreground">
                                                {[v.city, v.state].filter(Boolean).join(", ")} {v.zip_code}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-muted-foreground">Phone</div>
                                <div className="text-muted-foreground flex items-center gap-2">
                                    <Phone size={14} />
                                    {formatPhoneNumber(v.phone)}
                                </div>

                                <div className="text-muted-foreground">Email</div>
                                <div className="text-muted-foreground text-xs truncate flex items-center gap-2">
                                    <Mail size={14} />
                                    {v.email || "—"}
                                </div>

                                <div className="text-muted-foreground">EIN</div>
                                <div className="text-muted-foreground flex items-center gap-2">
                                    <FileText size={14} />
                                    {v.ein_number || "—"}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AlertDialog
                isOpen={!!deletingItem}
                onClose={() => setDeletingItem(null)}
                onConfirm={() => {
                    if (deletingItem) {
                        onDelete(deletingItem.id);
                        setDeletingItem(null);
                    }
                }}
                title="Delete Vendor?"
                description={`Are you sure you want to remove "${deletingItem?.name}"? This action cannot be undone.`}
                confirmLabel="Delete Vendor"
                isDestructive={true}
            />
        </>
    );
}
