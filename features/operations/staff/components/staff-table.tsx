"use client";

import React, { useState } from "react";
import { Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, User, DollarSign, MessageCircle, Phone, Mail } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface Staff {
    id: string;
    name: string;
    position?: { name: string };
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
    key: keyof Staff | 'position';
    direction: 'asc' | 'desc';
} | null;

// Helper to format phone number as (XXX)XXX-XXXX
function formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits[0] === '1') {
        return `(${digits.slice(1, 4)})${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return phone; // Return original if not standard format
}

// Helper to parse messaging_app JSON and format for display
function parseContactInfo(messagingApp: string): { app: string; handle: string }[] {
    if (!messagingApp) return [];
    try {
        const parsed = JSON.parse(messagingApp);
        if (Array.isArray(parsed)) {
            return parsed.map(item => ({
                app: item.app || '',
                handle: item.handle || ''
            }));
        }
        return [];
    } catch {
        // If not JSON, return as-is with empty app
        return [{ app: '', handle: messagingApp }];
    }
}

export function StaffTable({ data, onEdit, onDelete, onCompensation }: StaffTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [deletingItem, setDeletingItem] = useState<Staff | null>(null);

    const handleSort = (key: keyof Staff | 'position') => {
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

        if (sortConfig.key === 'position') {
            valA = (a.position?.name || "").toLowerCase();
            valB = (b.position?.name || "").toLowerCase();
        } else {
            valA = (String(a[sortConfig.key] || "")).toLowerCase();
            valB = (String(b[sortConfig.key] || "")).toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ column }: { column: keyof Staff | 'position' }) => {
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
                    <thead className="bg-zinc-900/80 backdrop-blur-sm text-white text-sm uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4 cursor-pointer hover:bg-[#0b1115] transition-colors select-none" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-2">Name <SortIcon column="name" /></div>
                            </th>
                            <th className="px-6 py-4 cursor-pointer hover:bg-[#0b1115] transition-colors select-none" onClick={() => handleSort('position')}>
                                <div className="flex items-center gap-2">Position <SortIcon column="position" /></div>
                            </th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Notes</th>
                            <th className="px-6 py-4 text-center">Compensation</th>
                            <th className="px-6 py-4 w-[100px] border-l border-white/10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                        {sortedData.map((staff) => (
                            <tr key={staff.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 font-medium text-white align-middle">
                                    {staff.name}
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    {staff.position?.name ? (
                                        <span className="px-2 py-0.5 rounded text-xs border border-zinc-700 bg-zinc-800 text-zinc-300">
                                            {staff.position.name}
                                        </span>
                                    ) : (
                                        <span className="text-zinc-500 italic">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 align-middle">
                                    <div className="flex flex-col gap-1">
                                        {staff.phone && (
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <Phone size={14} className="text-zinc-500" />
                                                {formatPhoneNumber(staff.phone)}
                                            </div>
                                        )}
                                        {parseContactInfo(staff.messaging_app).map((contact, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-zinc-400">
                                                <MessageCircle size={14} className="text-zinc-500" />
                                                {contact.app ? `${contact.app}: ` : ''}{formatPhoneNumber(contact.handle)}
                                            </div>
                                        ))}
                                        {staff.email && (
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <Mail size={14} className="text-zinc-500" />
                                                {staff.email}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-zinc-400 max-w-[200px] truncate align-middle">
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
                                <td className="px-6 py-4 align-middle border-l border-white/10">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(staff);
                                            }}
                                            className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingItem(staff);
                                            }}
                                            className="p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
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
                                <div>
                                    <h3 className="text-lg font-bold text-white leading-tight">{staff.name}</h3>
                                    {staff.position?.name && (
                                        <span className="px-2 py-0.5 rounded text-xs border border-zinc-700 bg-zinc-800 text-zinc-300">
                                            {staff.position.name}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onEdit(staff)}
                                        className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingItem(staff)}
                                        className="p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="flex flex-col gap-2">
                                {staff.phone && (
                                    <div className="flex items-center gap-2 text-zinc-300">
                                        <Phone size={14} className="text-zinc-500" />
                                        {formatPhoneNumber(staff.phone)}
                                    </div>
                                )}
                                {parseContactInfo(staff.messaging_app).map((contact, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-zinc-400">
                                        <MessageCircle size={14} className="text-zinc-500" />
                                        {contact.app ? `${contact.app}: ` : ''}{formatPhoneNumber(contact.handle)}
                                    </div>
                                ))}
                                {staff.email && (
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <Mail size={14} className="text-zinc-500" />
                                        {staff.email}
                                    </div>
                                )}
                                {staff.notes && (
                                    <div className="text-zinc-400 pt-2 border-t border-white/5">
                                        {staff.notes}
                                    </div>
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
