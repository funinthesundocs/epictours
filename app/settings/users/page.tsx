"use client";

import { PageShell } from "@/components/shell/page-shell";
import { UserCog, Shield, Users, Plus, Loader2, Search } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { useUsers, type User, type CreateUserData, type UpdateUserData } from "@/features/users/hooks/use-users";
import { useRoles } from "@/features/users/hooks/use-roles";
import { UsersTable } from "@/features/users/components/users-table";
import { UserFormSheet } from "@/features/users/components/user-form-sheet";
import { toast } from "sonner";

export default function UsersPage() {
    const { users, isLoading, createUser, updateUser, deleteUser, resetPassword } = useUsers();
    const { roles } = useRoles();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Filter users by search
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;
        const lowerQ = searchQuery.toLowerCase();
        return users.filter(u =>
            u.name.toLowerCase().includes(lowerQ) ||
            u.email.toLowerCase().includes(lowerQ) ||
            u.roles?.some(r => r.name.toLowerCase().includes(lowerQ))
        );
    }, [users, searchQuery]);

    // Stats
    const stats = useMemo(() => [
        { label: "Total Users", value: users.length.toString(), icon: Users },
        { label: "Active Users", value: users.filter(u => u.is_active).length.toString(), icon: UserCog },
        { label: "Admins", value: users.filter(u => u.is_tenant_admin).length.toString(), icon: Shield },
    ], [users]);

    const handleEdit = useCallback((user: User) => {
        setEditingUser(user);
        setIsSheetOpen(true);
    }, []);

    const handleAddNew = useCallback(() => {
        setEditingUser(null);
        setIsSheetOpen(true);
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        await deleteUser(id);
    }, [deleteUser]);

    const handleResetPassword = useCallback(async (id: string) => {
        const newPassword = prompt("Enter new temporary password (min 8 characters):");
        if (newPassword && newPassword.length >= 8) {
            await resetPassword(id, newPassword);
        } else if (newPassword) {
            toast.error("Password must be at least 8 characters");
        }
    }, [resetPassword]);

    const handleFormSubmit = useCallback(async (
        data: CreateUserData | UpdateUserData,
        userId?: string
    ): Promise<boolean> => {
        if (userId) {
            return await updateUser(userId, data as UpdateUserData);
        } else {
            return await createUser(data as CreateUserData);
        }
    }, [createUser, updateUser]);

    return (
        <PageShell
            title="User Management"
            description="Team access, roles, and invite links."
            icon={UserCog}
            stats={stats}
            action={
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    Invite User
                </button>
            }
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Search Bar */}
                <div className="relative w-full max-w-md shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0b1115] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                    />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-cyan-400" size={32} />
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-white/5 bg-[#0b1115]">
                        <UsersTable
                            data={filteredUsers}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onResetPassword={handleResetPassword}
                        />
                    </div>
                )}
            </div>

            <UserFormSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingUser}
                availableRoles={roles}
            />
        </PageShell>
    );
}
