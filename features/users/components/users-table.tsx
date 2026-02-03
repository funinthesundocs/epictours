"use client";

import { useState } from "react";
import { Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, UserCog, Shield } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";
import type { User } from "@/features/users/hooks/use-users";
import { cn } from "@/lib/utils";

interface UsersTableProps {
    data: User[];
    onEdit: (user: User) => void;
    onDelete: (id: string) => void;
}

type SortKey = 'name' | 'email' | 'status' | 'created_at';

interface SortConfig {
    key: SortKey;
    direction: 'asc' | 'desc';
}

export function UsersTable({ data, onEdit, onDelete }: UsersTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);


    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedData = [...data].sort((a, b) => {
        const aVal = a[sortConfig.key as keyof User];
        const bVal = b[sortConfig.key as keyof User];
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
        setUserToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (userToDelete) {
            onDelete(userToDelete);
            setUserToDelete(null);
        }
        setDeleteDialogOpen(false);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Never";
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <UserCog size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No users found</p>
                <p className="text-sm">Invite team members to get started</p>
            </div>
        );
    }

    return (
        <>
            {/* Desktop Table */}
            <div className="hidden md:block h-full overflow-auto">
                <table className="w-full">
                    <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm">
                        <tr className="border-b border-border">
                            <th className="text-left py-3 px-4">
                                <button onClick={() => handleSort('name')} className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                                    Name <SortIcon column="name" />
                                </button>
                            </th>
                            <th className="text-left py-3 px-4">
                                <button onClick={() => handleSort('email')} className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                                    Email <SortIcon column="email" />
                                </button>
                            </th>
                            <th className="text-left py-3 px-4">
                                <span className="text-xs uppercase tracking-wider text-muted-foreground">Position</span>
                            </th>

                            <th className="text-center py-3 px-4">
                                <button onClick={() => handleSort('status')} className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mx-auto">
                                    Status <SortIcon column="status" />
                                </button>
                            </th>
                            <th className="text-left py-3 px-4">
                                <button onClick={() => handleSort('created_at')} className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
                                    Joined <SortIcon column="created_at" />
                                </button>
                            </th>
                            <th className="w-20 py-3 px-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map(user => (
                            <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-foreground">{user.name}</span>
                                            {user.is_organization_owner && <Shield size={14} className="text-amber-500" />}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                                <td className="py-3 px-4">
                                    {user.position ? (
                                        <span
                                            className="px-2 py-0.5 text-xs rounded-full bg-muted text-foreground"
                                        >
                                            {user.position.name}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground text-sm italic">No position</span>
                                    )}
                                </td>

                                <td className="py-3 px-4 text-center">
                                    <span className={cn(
                                        "px-2 py-0.5 text-xs rounded-full",
                                        user.status === 'active'
                                            ? "bg-emerald-500/10 text-emerald-500"
                                            : "bg-muted text-muted-foreground"
                                    )}>
                                        {user.status === 'active' ? "Active" : user.status}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-muted-foreground text-sm">{formatDate(user.created_at)}</td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => onEdit(user)}
                                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                            title="Edit User"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => confirmDelete(user.id)}
                                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                            title="Remove User"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div >

            {/* Mobile Cards */}
            < div className="md:hidden space-y-3 p-3 overflow-auto max-h-full" >
                {
                    sortedData.map(user => (
                        <div key={user.id} className="bg-card rounded-xl p-4 border border-border">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-foreground">{user.name}</span>
                                            {user.is_organization_owner && <Shield size={14} className="text-amber-500" />}
                                        </div>
                                        <span className="text-sm text-muted-foreground">{user.email}</span>
                                    </div>
                                </div>
                                <span className={cn(
                                    "px-2 py-0.5 text-xs rounded-full",
                                    user.status === 'active'
                                        ? "bg-emerald-500/10 text-emerald-500"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    {user.status === 'active' ? "Active" : user.status}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 mb-3 text-sm">
                                <UserCog size={14} className="text-muted-foreground" />
                                {user.position ? (
                                    <span>{user.position.name}</span>
                                ) : (
                                    <span className="text-muted-foreground italic">No position</span>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-border">
                                <span className="text-xs text-muted-foreground">Joined {formatDate(user.created_at)}</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onEdit(user)}
                                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => confirmDelete(user.id)}
                                        className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div >

            <AlertDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                title="Remove User"
                description="This user will be removed from the organization. They can be re-invited later."
                confirmLabel="Remove"
                onConfirm={handleConfirmDelete}
                isDestructive={true}
            />
        </>
    );
}
