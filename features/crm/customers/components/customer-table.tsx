
"use client";

import { Customer } from "../types";
import { StatusBadge } from "./status-badge";
import { MoreHorizontal, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomerActions } from "./customer-actions";

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
                    "px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors group select-none",
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
            <div className="w-full rounded-xl border border-white/5 bg-[#09090b] overflow-x-auto">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white/5 uppercase text-xs font-semibold sticky top-0 z-10 backdrop-blur-md">
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
                        <tbody className="divide-y divide-white/5">
                            {data.map((customer) => (
                                <tr
                                    key={customer.id}
                                    className="group hover:bg-cyan-500/5 transition-colors duration-200 cursor-pointer"
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
                                        <div className="relative z-50 text-right flex justify-end" onClick={(e) => e.stopPropagation()}>
                                            <CustomerActions
                                                customer={customer}
                                                onEdit={onEdit}
                                                onDelete={(id) => setDeletingItem(customer)}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
