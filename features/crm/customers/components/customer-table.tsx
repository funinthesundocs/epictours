"use client";

import { Customer } from "../types";
import { StatusBadge } from "./status-badge";
import { MoreHorizontal, ArrowUp, ArrowDown, ChevronsUpDown, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
// import { CustomerActions } from "./customer-actions"; // Removed

interface CustomerTableProps {
    data: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (id: string) => void;
    sortConfig?: { key: string; direction: "asc" | "desc" } | null;
    onSort?: (key: string) => void;
}

import { useState } from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";

export function CustomerTable({ data, onEdit, onDelete, sortConfig, onSort }: CustomerTableProps) {
    const [deletingItem, setDeletingItem] = useState<Customer | null>(null);

    const SortableHeader = ({ label, sortKey, className }: { label: string, sortKey: string, className?: string }) => {
        const isActive = sortConfig?.key === sortKey;
        const DirectionIcon = isActive
            ? (sortConfig?.direction === "asc" ? ArrowUp : ArrowDown)
            : ChevronsUpDown;

        return (
            <th
                className={cn(
                    "px-6 py-4 cursor-pointer hover:bg-[#0b1115] transition-colors group select-none",
                    isActive ? "text-cyan-400" : "text-zinc-400",
                    className
                )}
                onClick={() => onSort && onSort(sortKey)}
            >
                <div className="flex items-center gap-2">
                    {label}
                    <DirectionIcon size={14} className={cn("transition-opacity", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50")} />
                </div>
            </th>
        );
    };

    if (data.length === 0) {
        return (
            <div className="text-center py-20 text-zinc-500">
                No customers found matching your criteria.
            </div>
        );
    }
    return (
        <>
            <div className="h-full overflow-auto relative">
                {/* Desktop Table */}
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-white/5 backdrop-blur-sm text-zinc-400 text-xs uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
                        <tr>
                            <SortableHeader label="Full Name" sortKey="name" />
                            <SortableHeader label="Email" sortKey="email" />
                            <SortableHeader label="Cell" sortKey="phone" />
                            <SortableHeader label="Hotel" sortKey="hotel" />
                            <SortableHeader label="App" sortKey="app" />
                            <SortableHeader label="Source" sortKey="source" />
                            <SortableHeader label="Status" sortKey="status" />
                            <SortableHeader label="AP" sortKey="total_value" />
                            <th className="px-6 py-4 text-right text-zinc-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-base text-zinc-300">
                        {data.map((customer) => (
                            <tr
                                key={customer.id}
                                className="hover:bg-white/5 transition-colors group cursor-pointer"
                            >
                                <td className="px-6 py-4 font-medium text-white group-hover:text-cyan-400 transition-colors">
                                    {customer.name}
                                </td>
                                <td className="px-6 py-4 text-zinc-400">
                                    {customer.email}
                                </td>
                                <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                                    {customer.phone || "-"}
                                </td>
                                <td className="px-6 py-4 text-zinc-400">
                                    {customer.metadata?.hotel || "-"}
                                </td>
                                <td className="px-6 py-4 text-zinc-400">
                                    {customer.preferences?.preferred_messaging_app || "-"}
                                </td>
                                <td className="px-6 py-4 text-zinc-400">
                                    {customer.metadata?.source || "-"}
                                </td>
                                <td className="px-6 py-4 text-zinc-400">
                                    {customer.status}
                                </td>
                                <td className="px-6 py-4 text-white font-mono">
                                    {customer.total_value}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(customer);
                                            }}
                                            className="p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingItem(customer);
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
                    {data.map((customer) => (
                        <div key={customer.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                            {/* Header: Name + Actions */}
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

                            {/* Body: Two Columns */}
                            <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-base">
                                <div className="text-zinc-500">Email</div>
                                <div className="text-zinc-300 break-all">{customer.email}</div>

                                <div className="text-zinc-500">Cell</div>
                                <div className="text-zinc-300 font-mono">{customer.phone || "-"}</div>

                                <div className="text-zinc-500">Hotel</div>
                                <div className="text-zinc-300">{customer.metadata?.hotel || "-"}</div>

                                <div className="text-zinc-500">App</div>
                                <div className="text-zinc-300">{customer.preferences?.preferred_messaging_app || "-"}</div>

                                <div className="text-zinc-500">Source</div>
                                <div className="text-zinc-300">{customer.metadata?.source || "-"}</div>

                                <div className="text-zinc-500">Status</div>
                                <div className="text-zinc-300">{customer.status}</div>

                                <div className="text-zinc-500">AP</div>
                                <div className="text-white font-mono">{customer.total_value}</div>
                            </div>
                        </div>
                    ))}
                </div>
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
