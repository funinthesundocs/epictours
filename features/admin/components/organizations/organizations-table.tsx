"use client";

import { useState } from "react";
import { Edit2, ArrowUpDown, ArrowUp, ArrowDown, Building2, Power, ChevronRight } from "lucide-react";
import type { Organization } from "@/features/auth/types";
import { cn } from "@/lib/utils";

interface OrganizationsTableProps {
    data: Organization[];
    onEdit: (org: Organization) => void;
    onToggleStatus: (id: string) => void;
    onRowClick?: (org: Organization) => void;
}

type SortKey = 'name' | 'slug' | 'status' | 'created_at';

interface SortConfig {
    key: SortKey;
    direction: 'asc' | 'desc';
}

export function OrganizationsTable({ data, onEdit, onToggleStatus, onRowClick }: OrganizationsTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedData = [...data].sort((a, b) => {
        const aVal = a[sortConfig.key as keyof Organization];
        const bVal = b[sortConfig.key as keyof Organization];
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

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
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
                            <button onClick={() => handleSort('status')} className="flex items-center gap-2 hover:text-foreground transition-colors mx-auto">
                                Status <SortIcon column="status" />
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
                    {sortedData.map(org => (
                        <tr
                            key={org.id}
                            className={cn(
                                "border-b border-border hover:bg-muted/50 transition-colors",
                                onRowClick && "cursor-pointer"
                            )}
                            onClick={() => onRowClick?.(org)}
                        >
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                                        {org.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-foreground">{org.name}</span>
                                </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-sm text-muted-foreground">{org.slug}</td>
                            <td className="py-3 px-4 text-center">
                                <span className={cn(
                                    "px-2 py-0.5 text-xs rounded-full",
                                    org.status === 'active'
                                        ? "bg-emerald-500/10 text-emerald-500"
                                        : "bg-destructive/10 text-destructive"
                                )}>
                                    {org.status === 'active' ? "Active" : "Suspended"}
                                </span>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-sm">{formatDate(org.created_at)}</td>
                            <td className="py-3 px-4 border-l border-border">
                                <div className="flex items-center justify-center gap-1">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit(org); }}
                                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onToggleStatus(org.id); }}
                                        className={cn(
                                            "p-1.5 rounded-lg transition-colors",
                                            org.status === 'active'
                                                ? "hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                                : "hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500"
                                        )}
                                        title={org.status === 'active' ? "Suspend" : "Activate"}
                                    >
                                        <Power size={14} />
                                    </button>
                                    {onRowClick && (
                                        <ChevronRight size={16} className="text-muted-foreground ml-1" />
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
