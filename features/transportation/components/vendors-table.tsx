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
        return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-cyan-400" /> : <ArrowDown size={12} className="text-cyan-400" />;
    };

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500 bg-[#0b1115] rounded-xl border border-white/10">
                No vendors found.
            </div>
        );
    }

    return (
        <>
            <div className="h-full overflow-auto relative">
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-white/5 backdrop-blur-sm text-zinc-400 text-xs uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
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
                                    className="px-6 py-4 cursor-pointer hover:bg-[#0b1115] transition-colors select-none"
                                    onClick={() => handleSort(col.key as keyof Vendor)}
                                >
                                    <div className="flex items-center gap-2">
                                        {col.label}
                                        <SortIcon column={col.key as keyof Vendor} />
                                    </div>
                                </th>
                            ))}
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                        {sortedData.map((v) => (
                            <tr key={v.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 align-middle font-medium text-white">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                                            <Handshake size={16} />
                                        </div>
                                        {v.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 align-middle truncate max-w-xs" title={v.address || ""}>
                                    <div className="flex items-start gap-2 text-zinc-400">
                                        <MapPin size={14} className="mt-0.5 shrink-0" />
                                        <div className="flex flex-col">
                                            <span>{v.address || "—"}</span>
                                            {(v.city || v.state || v.zip_code) && (
                                                <span className="text-xs text-zinc-500">
                                                    {[v.city, v.state].filter(Boolean).join(", ")} {v.zip_code}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    <span className="flex items-center gap-2 text-zinc-400">
                                        <Phone size={14} />
                                        {formatPhoneNumber(v.phone)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    <span className="flex items-center gap-2 text-zinc-400">
                                        <Mail size={14} />
                                        {v.email || "—"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    <span className="flex items-center gap-2 text-zinc-400 font-mono text-xs">
                                        <FileText size={14} />
                                        {v.ein_number || "—"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 align-middle text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(v);
                                            }}
                                            className="p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingItem(v);
                                            }}
                                            className="p-2 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400 transition-colors"
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
                        <div key={v.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                                        <Handshake size={16} />
                                    </div>
                                    <h3 className="text-lg font-bold text-white leading-tight">
                                        {v.name}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onEdit(v)}
                                        className="p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingItem(v)}
                                        className="p-2 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Body Grid */}
                            <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-sm">
                                <div className="text-zinc-500">Address</div>
                                <div className="text-zinc-400 truncate flex items-start gap-2">
                                    <MapPin size={14} className="mt-0.5 shrink-0" />
                                    <div className="flex flex-col">
                                        <span>{v.address || "—"}</span>
                                        {(v.city || v.state || v.zip_code) && (
                                            <span className="text-xs text-zinc-500">
                                                {[v.city, v.state].filter(Boolean).join(", ")} {v.zip_code}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-zinc-500">Phone</div>
                                <div className="text-zinc-400 flex items-center gap-2">
                                    <Phone size={14} />
                                    {formatPhoneNumber(v.phone)}
                                </div>

                                <div className="text-zinc-500">Email</div>
                                <div className="text-zinc-400 text-xs truncate flex items-center gap-2">
                                    <Mail size={14} />
                                    {v.email || "—"}
                                </div>

                                <div className="text-zinc-500">EIN</div>
                                <div className="text-zinc-400 font-mono text-xs flex items-center gap-2">
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
