"use client";

import { PageShell } from "@/components/shell/page-shell";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Users, Loader2, Search, Shield, ShieldAlert, Plus, Edit2, Trash2 } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useUsers } from "@/features/admin/hooks/use-users";
import { cn } from "@/lib/utils";
import { PlatformUserSheet, PlatformUserData } from "@/features/admin/components/platform-user-sheet";
import { AuthenticatedUser } from "@/features/auth/types";
import { AlertDialog } from "@/components/ui/alert-dialog";

export default function AdminUsersPage() {
    return (
        <ProtectedRoute>
            <AdminUsersContent />
        </ProtectedRoute>
    );
}

function AdminUsersContent() {
    const {
        users,
        isLoading,
        togglePlatformAdmin,
        createPlatformUser,
        updatePlatformUser,
        deletePlatformUser
    } = useUsers();

    const [searchQuery, setSearchQuery] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<AuthenticatedUser | null>(null);
    const [deletingUser, setDeletingUser] = useState<AuthenticatedUser | null>(null);

    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;
        const lowerQ = searchQuery.toLowerCase();
        return users.filter(u =>
            u.name.toLowerCase().includes(lowerQ) ||
            u.email.toLowerCase().includes(lowerQ)
        );
    }, [users, searchQuery]);

    const stats = useMemo(() => [
        { label: "Total Users", value: users.length.toString(), icon: Users },
        { label: "Platform Admins", value: users.filter(u => u.isPlatformAdmin).length.toString(), icon: ShieldAlert },
    ], [users]);

    const handleAddNew = () => {
        setEditingUser(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (user: AuthenticatedUser) => {
        setEditingUser(user);
        setIsSheetOpen(true);
    };

    const handleDelete = async (userId: string) => {
        await deletePlatformUser(userId);
        setDeletingUser(null);
    };

    const handleFormSubmit = useCallback(async (
        data: PlatformUserData,
        userId?: string
    ): Promise<boolean> => {
        if (userId) {
            return await updatePlatformUser(userId, { name: data.name, email: data.email });
        } else {
            return await createPlatformUser({ name: data.name, email: data.email });
        }
    }, [createPlatformUser, updatePlatformUser]);

    return (
        <PageShell
            title="User Management"
            description="Manage all users and platform privileges."
            icon={Users}
            stats={stats}
            action={
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    Add User
                </button>
            }
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            <div className="h-full flex flex-col space-y-4">
                <div className="relative w-full max-w-md shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary/50 focus:outline-none transition-colors placeholder:text-muted-foreground"
                    />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-border bg-card">
                        <table className="w-full">
                            <thead className="bg-muted/80 backdrop-blur-sm text-muted-foreground text-xs uppercase tracking-wider font-semibold sticky top-0 z-10 border-b border-border">
                                <tr>
                                    <th className="text-left py-3 px-4">User</th>
                                    <th className="text-left py-3 px-4">Organization</th>
                                    <th className="text-center py-3 px-4">Super Admin</th>
                                    <th className="text-center py-3 px-4">System Admin</th>
                                    <th className="text-right py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground">{user.name}</div>
                                                    <div className="text-xs text-muted-foreground">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">
                                            {user.organizationName || "—"}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={() => togglePlatformAdmin(user.id, 'super', !user.isPlatformSuperAdmin)}
                                                className={cn(
                                                    "p-1.5 rounded-lg transition-colors",
                                                    user.isPlatformSuperAdmin
                                                        ? "text-red-500 bg-red-500/10 hover:bg-red-500/20"
                                                        : "text-muted-foreground hover:bg-muted"
                                                )}
                                                title="Toggle Super Admin"
                                            >
                                                <ShieldAlert size={18} />
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={() => togglePlatformAdmin(user.id, 'system', !user.isPlatformSystemAdmin)}
                                                className={cn(
                                                    "p-1.5 rounded-lg transition-colors",
                                                    user.isPlatformSystemAdmin
                                                        ? "text-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
                                                        : "text-muted-foreground hover:bg-muted"
                                                )}
                                                title="Toggle System Admin"
                                            >
                                                <Shield size={18} />
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingUser(user)}
                                                    className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <PlatformUserSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingUser}
            />

            <AlertDialog
                isOpen={!!deletingUser}
                onClose={() => setDeletingUser(null)}
                onConfirm={() => {
                    if (deletingUser) {
                        handleDelete(deletingUser.id);
                    }
                }}
                title="Delete User?"
                description={`Are you sure you want to delete "${deletingUser?.name}"? This action cannot be undone.`}
                confirmLabel="Delete User"
                isDestructive={true}
            />
        </PageShell>
    );
}
