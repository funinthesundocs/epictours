"use client";

import { useState } from "react";
import { Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, UserCog, Shield, MoreHorizontal, KeyRound, UserX } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";
import type { User } from "@/features/users/hooks/use-users";
import { cn } from "@/lib/utils";

interface UsersTableProps {
    data: User[];
    onEdit: (user: User) => void;
    onDelete: (id: string) => void;
    onResetPassword: (id: string) => void;
}

type SortKey = 'name' | 'email' | 'is_tenant_admin' | 'is_active' | 'created_at';

interface SortConfig {
    key: SortKey;
    direction: 'asc' | 'desc';
}

export function UsersTable({ data, onEdit, onDelete, onResetPassword }: UsersTableProps) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedData = [...data].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortConfig.key !== column) return <ArrowUpDown size={14} className="text-zinc-600" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-cyan-400" /> : <ArrowDown size={14} className="text-cyan-400" />;
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
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
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
                    <thead className="sticky top-0 z-10 bg-[#0e1419]">
                        <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-4">
                                <button onClick={() => handleSort('name')} className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 hover:text-white transition-colors">
                                    Name <SortIcon column="name" />
                                </button>
                            </th>
                            <th className="text-left py-3 px-4">
                                <button onClick={() => handleSort('email')} className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 hover:text-white transition-colors">
                                    Email <SortIcon column="email" />
                                </button>
                            </th>
                            <th className="text-left py-3 px-4">
                                <span className="text-xs uppercase tracking-wider text-zinc-500">Roles</span>
                            </th>
                            <th className="text-center py-3 px-4">
                                <button onClick={() => handleSort('is_tenant_admin')} className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 hover:text-white transition-colors mx-auto">
                                    Admin <SortIcon column="is_tenant_admin" />
                                </button>
                            </th>
                            <th className="text-center py-3 px-4">
                                <button onClick={() => handleSort('is_active')} className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 hover:text-white transition-colors mx-auto">
                                    Status <SortIcon column="is_active" />
                                </button>
                            </th>
                            <th className="text-left py-3 px-4">
                                <button onClick={() => handleSort('created_at')} className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-500 hover:text-white transition-colors">
                                    Joined <SortIcon column="created_at" />
                                </button>
                            </th>
                            <th className="w-20 py-3 px-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map(user => (
                            <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-white">{user.name}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-zinc-400">{user.email}</td>
                                <td className="py-3 px-4">
                                    <div className="flex flex-wrap gap-1">
                                        {user.roles && user.roles.length > 0 ? (
                                            user.roles.map(role => (
                                                <span
                                                    key={role.id}
                                                    className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-zinc-300"
                                                    style={role.color ? { backgroundColor: `${role.color}20`, color: role.color } : {}}
                                                >
                                                    {role.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-zinc-600 text-sm">No roles</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    {user.is_tenant_admin && (
                                        <span title="Tenant Admin">
                                            <Shield size={16} className="text-amber-400 mx-auto" />
                                        </span>
                                    )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span className={cn(
                                        "px-2 py-0.5 text-xs rounded-full",
                                        user.is_active
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : "bg-red-500/20 text-red-400"
                                    )}>
                                        {user.is_active ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-zinc-500 text-sm">{formatDate(user.created_at)}</td>
                                <td className="py-3 px-4">
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>
                                        {openMenuId === user.id && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                                                <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                                                    <button
                                                        onClick={() => { onEdit(user); setOpenMenuId(null); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                                                    >
                                                        <Edit2 size={14} /> Edit User
                                                    </button>
                                                    <button
                                                        onClick={() => { onResetPassword(user.id); setOpenMenuId(null); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                                                    >
                                                        <KeyRound size={14} /> Reset Password
                                                    </button>
                                                    <button
                                                        onClick={() => { confirmDelete(user.id); setOpenMenuId(null); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                                    >
                                                        <UserX size={14} /> Deactivate
                                                    </button>
                                                </div>
                                            </>
                                        )}
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
                        <div key={user.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white">{user.name}</span>
                                            {user.is_tenant_admin && <Shield size={14} className="text-amber-400" />}
                                        </div>
                                        <span className="text-sm text-zinc-400">{user.email}</span>
                                    </div>
                                </div>
                                <span className={cn(
                                    "px-2 py-0.5 text-xs rounded-full",
                                    user.is_active
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-red-500/20 text-red-400"
                                )}>
                                    {user.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-3">
                                {user.roles && user.roles.length > 0 ? (
                                    user.roles.map(role => (
                                        <span
                                            key={role.id}
                                            className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-zinc-300"
                                            style={role.color ? { backgroundColor: `${role.color}20`, color: role.color } : {}}
                                        >
                                            {role.name}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-zinc-600 text-sm">No roles assigned</span>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                <span className="text-xs text-zinc-500">Joined {formatDate(user.created_at)}</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onEdit(user)}
                                        className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => confirmDelete(user.id)}
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
                                    >
                                        <UserX size={16} />
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
                title="Deactivate User"
                description="This user will lose access to the system. You can reactivate them later."
                confirmLabel="Deactivate"
                onConfirm={handleConfirmDelete}
                isDestructive={true}
            />
        </>
    );
}
