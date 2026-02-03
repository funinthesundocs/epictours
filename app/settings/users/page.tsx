"use client";

import { PageShell } from "@/components/shell/page-shell";
import { UserCog, Shield, Users, Plus, Loader2, Search } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useState, useCallback, useMemo } from "react";
import { useUsers, type User, type CreateUserData, type UpdateUserData } from "@/features/users/hooks/use-users";
import { useStaffPositions } from "@/features/settings/hooks/use-staff-positions";
import { UsersTable } from "@/features/users/components/users-table";
import { UserFormSheet } from "@/features/users/components/user-form-sheet";

export default function UsersPage() {
    const { users, isLoading, createUser, updateUser, deleteUser } = useUsers();
    const { positions } = useStaffPositions(); // Positions for the dropdown
    const [searchQuery, setSearchQuery] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Filter users by search and position
    const filteredUsers = useMemo(() => {
        // Strict Requirement: Only show users with a position assigned
        const staffUsers = users.filter(u => u.position !== null);

        if (!searchQuery.trim()) return staffUsers;
        const lowerQ = searchQuery.toLowerCase();
        return staffUsers.filter(u =>
            u.name.toLowerCase().includes(lowerQ) ||
            u.email.toLowerCase().includes(lowerQ) ||
            u.position?.name.toLowerCase().includes(lowerQ)
        );
    }, [users, searchQuery]);

    // Stats (Based on Staff Only)
    const stats = useMemo(() => {
        const staffUsers = users.filter(u => u.position !== null);
        return [
            { label: "Total Staff", value: staffUsers.length.toString(), icon: Users },
            { label: "Active", value: staffUsers.filter(u => u.status === 'active').length.toString(), icon: UserCog },
            { label: "Owners", value: staffUsers.filter(u => u.is_organization_owner).length.toString(), icon: Shield },
        ];
    }, [users]);

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
            title="Staff Management"
            description="Manage team access and positions."
            icon={UserCog}
            stats={stats}
            action={
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    Add Staff
                </button>
            }
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Search Bar */}
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

                <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                    {isLoading ? (
                        <LoadingState message="Loading users..." />
                    ) : (
                        <UsersTable
                            data={filteredUsers}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    )}
                </div>
            </div>

            <UserFormSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingUser}
                availablePositions={positions}
            />
        </PageShell>
    );
}
