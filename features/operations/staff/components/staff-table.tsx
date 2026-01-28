"use client";

import { useState } from "react";
import { Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, User, DollarSign, MessageCircle, Phone, Mail } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface Staff {
    id: string;
    name: string;
    role?: { name: string };
    phone: string;
    messaging_app: string;
    email: string;
    notes: string;
}

interface StaffTableProps {
    data: Staff[];
    onEdit: (staff: Staff) => void;
    onDelete: (id: string) => void;
    onCompensation: (staff: Staff) => void;
}

type SortConfig = {
    key: keyof Staff | 'role';
    direction: 'asc' | 'desc';
} | null;

export function StaffTable({ data, onEdit, onDelete, onCompensation }: StaffTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [deletingItem, setDeletingItem] = useState<Staff | null>(null);

    const handleSort = (key: keyof Staff | 'role') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0;

        let valA: string = "";
        let valB: string = "";

        if (sortConfig.key === 'role') {
            valA = (a.role?.name || "").toLowerCase();
            valB = (b.role?.name || "").toLowerCase();
        } else {
            valA = (String(a[sortConfig.key] || "")).toLowerCase();
            valB = (String(b[sortConfig.key] || "")).toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ column }: { column: keyof Staff | 'role' }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown size={12} className="opacity-30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-cyan-400" /> : <ArrowDown size={12} className="text-cyan-400" />;
    };

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500 bg-[#0b1115] rounded-xl border border-white/10">
                No staff found.
            </div>
        );
    }

    return (
        <>
            <div className="h-full overflow-auto relative">
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-white/5 backdrop-blur-sm text-zinc-400 text-xs uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4 cursor-pointer hover:bg-[#0b1115] transition-colors select-none" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-2">Name <SortIcon column="name" /></div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-[#0b1115] transition-colors select-none" onClick={() => handleSort('role')}>
                                <div className="flex items-center gap-2">Role <SortIcon column="role" /></div>
                            </th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Notes</th>
                            <th className="px-6 py-4 text-center">Compensation</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                        {sortedData.map((staff) => (
                            <tr key={staff.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 font-medium text-white align-middle">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                                            <User size={16} />
                                        </div>
                                        {staff.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    {staff.role?.name ? (
                                        <span className="px-2 py-0.5 rounded text-xs border border-zinc-700 bg-zinc-800 text-zinc-300">
                                            {staff.role.name}
                                        </span>
                                    ) : (
                                        <span className="text-zinc-500 italic">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    <div className="flex flex-col gap-1 text-xs">
                                        {staff.phone && (
                                            <div className="flex items-center gap-2 text-zinc-300">
                                                <Phone size={12} className="text-zinc-500" />
                                                {staff.phone}
                                            </div>
                                        )}
                                        {staff.messaging_app && (
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <MessageCircle size={12} className="text-zinc-500" />
                                                {staff.messaging_app}
                                            </div>
                                        )}
                                        {staff.email && (
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <Mail size={12} className="text-zinc-500" />
                                                {staff.email}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-zinc-400 text-xs italic max-w-[200px] truncate align-middle">
                                    {staff.notes || "-"}
                                </td>
                                <td className="px-6 py-4 text-center align-middle">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCompensation(staff);
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-xs font-medium"
                                    >
                                        <DollarSign size={12} />
                                        View Rates
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right align-middle">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(staff);
                                            }}
                                            className="p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingItem(staff);
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
                    {sortedData.map((staff) => (
                        <div key={staff.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                            {/* Header: Name + Actions */}
                            <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white leading-tight">{staff.name}</h3>
                                        {staff.role?.name && (
                                            <span className="px-2 py-0.5 rounded text-xs border border-zinc-700 bg-zinc-800 text-zinc-300">
                                                {staff.role.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onEdit(staff)}
                                        className="p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingItem(staff)}
                                        className="p-2 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Body: Two Columns */}
                            <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-base">
                                {staff.phone && (
                                    <>
                                        <div className="text-zinc-500">Phone</div>
                                        <div className="text-zinc-300">{staff.phone}</div>
                                    </>
                                )}
                                {staff.email && (
                                    <>
                                        <div className="text-zinc-500">Email</div>
                                        <div className="text-zinc-300 break-all">{staff.email}</div>
                                    </>
                                )}
                                {staff.messaging_app && (
                                    <>
                                        <div className="text-zinc-500">App</div>
                                        <div className="text-zinc-300">{staff.messaging_app}</div>
                                    </>
                                )}
                                {staff.notes && (
                                    <>
                                        <div className="text-zinc-500">Notes</div>
                                        <div className="text-zinc-400 italic text-sm">{staff.notes}</div>
                                    </>
                                )}
                            </div>

                            {/* Compensation Button */}
                            <button
                                onClick={() => onCompensation(staff)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-sm font-medium"
                            >
                                <DollarSign size={14} />
                                View Compensation Rates
                            </button>
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
                title="Delete Staff Member?"
                description={`Are you sure you want to remove "${deletingItem?.name}"? This action cannot be undone.`}
                confirmLabel="Delete Staff"
                isDestructive={true}
            />
        </>
    );
}
