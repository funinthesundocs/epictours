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
        return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />;
    };

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
                No roles found.
            </div>
        );
    }

    return (
        <>
            <div className="h-full overflow-auto relative">
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-muted/80 backdrop-blur-sm text-foreground text-sm uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-border">
                        <tr>
                            <th
                                className="px-6 py-4 cursor-pointer hover:bg-muted transition-colors select-none"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center gap-2">
                                    Role
                                    <SortIcon column="name" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 cursor-pointer hover:bg-muted transition-colors select-none"
                                onClick={() => handleSort('description')}
                            >
                                <div className="flex items-center gap-2">
                                    Notes
                                    <SortIcon column="description" />
                                </div>
                            </th>
                            <th className="px-6 py-4 w-[100px] border-l border-border"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-muted-foreground">
                        {sortedData.map((role) => (
                            <tr key={role.id} className="hover:bg-muted transition-colors group">
                                <td className="px-6 py-4 font-medium text-foreground">
                                    {role.name}
                                </td>
                                <td className="px-6 py-4 text-muted-foreground">
                                    {role.description || "-"}
                                </td>
                                <td className="px-6 py-4 border-l border-border">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(role);
                                            }}
                                            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingItem(role);
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
                    {sortedData.map((role) => (
                        <div key={role.id} className="bg-card border border-border rounded-xl p-4">
                            {/* Header */}
                            <div className={`flex items-start justify-between gap-4 ${role.description ? 'border-b border-border pb-3' : ''}`}>
                                <h3 className="text-lg font-bold text-foreground leading-tight">
                                    {role.name}
                                </h3>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onEdit(role)}
                                        className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingItem(role)}
                                        className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            {role.description && (
                                <div className="text-muted-foreground pt-3">{role.description}</div>
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
