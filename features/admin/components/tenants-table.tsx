"use client";

import { useState } from "react";
import { Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Building2, Power, Users, Package } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";
import type { Tenant } from "@/features/admin/hooks/use-tenants";
import { cn } from "@/lib/utils";

interface TenantsTableProps {
    data: Tenant[];
    onEdit: (tenant: Tenant) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (id: string) => void;
}

type SortKey = 'name' | 'slug' | 'user_count' | 'is_active' | 'created_at';

interface SortConfig {
    key: SortKey;
    direction: 'asc' | 'desc';
}

export function TenantsTable({ data, onEdit, onDelete, onToggleStatus }: TenantsTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [tenantToDelete, setTenantToDelete] = useState<string | null>(null);

    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedData = [...data].sort((a, b) => {
        const aVal = a[sortConfig.key as keyof Tenant];
        const bVal = b[sortConfig.key as keyof Tenant];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortConfig.key !== column) return <ArrowUpDown size={14} className="text-muted-foreground" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-primary" /> : <ArrowDown size={14} className="text-primary" />;
    };

    const confirmDelete = (id: string) => {
        setTenantToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (tenantToDelete) {
            onDelete(tenantToDelete);
            setTenantToDelete(null);
        }
        setDeleteDialogOpen(false);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    const getActiveModulesCount = (tenant: Tenant) => {
        return tenant.subscriptions?.filter(s => s.is_active).length || 0;
    };

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Building2 size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No organizations found</p>
                <p className="text-sm">Create your first organization to get started</p>
            </div>
        );
    }

    return (
        <>
            <div className="hidden md:block h-full overflow-auto">
                <table className="w-full">
                    <thead className="bg-muted/80 backdrop-blur-sm text-muted-foreground text-xs uppercase tracking-wider font-semibold sticky top-0 z-10 border-b border-border">
                        <tr>
                            <th className="text-left py-3 px-4">
                                <button onClick={() => handleSort('name')} className="flex items-center gap-2 hover:text-foreground transition-colors">
                                    Organization <SortIcon column="name" />
                                </button>
                            </th>
                            <th className="text-left py-3 px-4">
                                <button onClick={() => handleSort('slug')} className="flex items-center gap-2 hover:text-foreground transition-colors">
                                    Slug <SortIcon column="slug" />
                                </button>
                            </th>
                            <th className="text-center py-3 px-4">
                                <button onClick={() => handleSort('user_count')} className="flex items-center gap-2 hover:text-foreground transition-colors mx-auto">
                                    Users <SortIcon column="user_count" />
                                </button>
                            </th>
                            <th className="text-center py-3 px-4">Modules</th>
                            <th className="text-center py-3 px-4">
                                <button onClick={() => handleSort('is_active')} className="flex items-center gap-2 hover:text-foreground transition-colors mx-auto">
                                    Status <SortIcon column="is_active" />
                                </button>
                            </th>
                            <th className="text-left py-3 px-4">
                                <button onClick={() => handleSort('created_at')} className="flex items-center gap-2 hover:text-foreground transition-colors">
                                    Created <SortIcon column="created_at" />
                                </button>
                            </th>
                            <th className="w-[100px] py-3 px-4 border-l border-border"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map(tenant => (
                            <tr key={tenant.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                                            {tenant.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-foreground">{tenant.name}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 font-mono text-sm text-muted-foreground">{tenant.slug}</td>
                                <td className="py-3 px-4 text-center text-muted-foreground">{tenant.user_count || 0}</td>
                                <td className="py-3 px-4 text-center">
                                    <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                                        {getActiveModulesCount(tenant)}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span className={cn(
                                        "px-2 py-0.5 text-xs rounded-full",
                                        tenant.is_active
                                            ? "bg-emerald-500/10 text-emerald-500"
                                            : "bg-destructive/10 text-destructive"
                                    )}>
                                        {tenant.is_active ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-muted-foreground text-sm">{formatDate(tenant.created_at)}</td>
                                <td className="py-3 px-4 border-l border-border">
                                    <div className="flex items-center justify-center gap-1">
                                        <button
                                            onClick={() => onEdit(tenant)}
                                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => onToggleStatus(tenant.id)}
                                            className={cn(
                                                "p-1.5 rounded-lg transition-colors",
                                                tenant.is_active
                                                    ? "hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500"
                                                    : "hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500"
                                            )}
                                            title={tenant.is_active ? "Deactivate" : "Activate"}
                                        >
                                            <Power size={14} />
                                        </button>
                                        <button
                                            onClick={() => confirmDelete(tenant.id)}
                                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 p-3 overflow-auto max-h-full">
                {sortedData.map(tenant => (
                    <div key={tenant.id} className="bg-card rounded-xl p-4 border border-border">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-medium">
                                    {tenant.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <span className="font-medium text-foreground">{tenant.name}</span>
                                    <span className="block text-sm font-mono text-muted-foreground">{tenant.slug}</span>
                                </div>
                            </div>
                            <span className={cn(
                                "px-2 py-0.5 text-xs rounded-full",
                                tenant.is_active
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : "bg-destructive/10 text-destructive"
                            )}>
                                {tenant.is_active ? "Active" : "Inactive"}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Users size={14} />
                                <span>{tenant.user_count || 0} users</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Package size={14} />
                                <span>{getActiveModulesCount(tenant)} modules</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border">
                            <span className="text-xs text-muted-foreground">Created {formatDate(tenant.created_at)}</span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onEdit(tenant)}
                                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => onToggleStatus(tenant.id)}
                                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Power size={16} />
                                </button>
                                <button
                                    onClick={() => confirmDelete(tenant.id)}
                                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <AlertDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                title="Delete Organization"
                description="This action cannot be undone. All data associated with this organization will be permanently deleted."
                confirmLabel="Delete"
                onConfirm={handleConfirmDelete}
                isDestructive={true}
            />
        </>
    );
}
