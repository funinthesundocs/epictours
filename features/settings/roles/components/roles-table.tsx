"use client";

import { useState } from "react";
import { Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, UserCog } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface Role {
    id: string;
    name: string;
    description: string;
}

interface RolesTableProps {
    data: Role[];
    onEdit: (role: Role) => void;
    onDelete: (id: string) => void;
}

type SortConfig = {
    key: keyof Role;
    direction: 'asc' | 'desc';
} | null;

export function RolesTable({ data, onEdit, onDelete }: RolesTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [deletingItem, setDeletingItem] = useState<Role | null>(null);

    const handleSort = (key: keyof Role) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0;
        const valA = (a[sortConfig.key] || "").toLowerCase();
        const valB = (b[sortConfig.key] || "").toLowerCase();

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ column }: { column: keyof Role }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown size={12} className="opacity-30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-cyan-400" /> : <ArrowDown size={12} className="text-cyan-400" />;
    };

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500 bg-[#0b1115] rounded-xl border border-white/10">
                No roles found.
            </div>
        );
    }

    return (
        <>
            <div className="h-full overflow-auto relative">
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-white/5 backdrop-blur-sm text-zinc-400 text-xs uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
                        <tr>
                            <th
                                className="px-6 py-4 cursor-pointer hover:bg-[#0b1115] transition-colors select-none"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center gap-2">
                                    Role
                                    <SortIcon column="name" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 cursor-pointer hover:bg-[#0b1115] transition-colors select-none"
                                onClick={() => handleSort('description')}
                            >
                                <div className="flex items-center gap-2">
                                    Notes
                                    <SortIcon column="description" />
                                </div>
                            </th>
                            <th className="px-6 py-4 w-[100px] border-l border-white/10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                        {sortedData.map((role) => (
                            <tr key={role.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 font-medium text-white">
                                    {role.name}
                                </td>
                                <td className="px-6 py-4 text-zinc-400">
                                    {role.description || "-"}
                                </td>
                                <td className="px-6 py-4 border-l border-white/10">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(role);
                                            }}
                                            className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingItem(role);
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
                    {sortedData.map((role) => (
                        <div key={role.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                            {/* Header */}
                            <div className={`flex items-start justify-between gap-4 ${role.description ? 'border-b border-white/5 pb-3' : ''}`}>
                                <h3 className="text-lg font-bold text-white leading-tight">
                                    {role.name}
                                </h3>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onEdit(role)}
                                        className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingItem(role)}
                                        className="p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            {role.description && (
                                <div className="text-zinc-400 pt-3">{role.description}</div>
                            )}
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
                title="Delete Role?"
                description={`Are you sure you want to remove "${deletingItem?.name}"? This action cannot be undone.`}
                confirmLabel="Delete Role"
                isDestructive={true}
            />
        </>
    );
}
