"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-context";
import { OrganizationService } from "@/lib/services/organization-service";
import { UserService } from "@/lib/services/user-service";

export interface User {
    id: string; // This is the ORGANIZATION MEMBER ID (organization_users.id)
    userId: string; // The actual user.id
    email: string;
    name: string;
    avatar_url: string | null;
    is_organization_owner: boolean;
    status: 'active' | 'invited' | 'suspended';
    created_at: string;
    // Position Data
    position: {
        id: string;
        name: string;
        color?: string | null;
    } | null;
    // Permissions (Resolved)
    role?: {
        id: string;
        name: string;
    } | null;
}

export interface CreateUserData {
    email: string;
    name: string;
    position_id?: string;
}

export interface UpdateUserData {
    position_id?: string;
}

export function useUsers() {
    const { user: currentUser } = useAuth(); // currentUser is AuthenticatedUser
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        if (!currentUser?.organizationId) {
            setUsers([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const members = await OrganizationService.getOrganizationMembers(currentUser.organizationId);

            const transformedUsers: User[] = members.map(m => ({
                id: m.id, // organization_users.id
                userId: m.user.id,
                email: m.user.email,
                name: m.user.name,
                avatar_url: m.user.avatar_url,
                is_organization_owner: m.is_owner,
                status: m.status,
                created_at: m.created_at,
                position: m.position ? {
                    id: m.position.id,
                    name: m.position.name,
                    // color: m.position.color // Service needs to fetch color if we want it
                } : null,
                role: null // Derived from position usually
            }));

            setUsers(transformedUsers);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("Failed to load users");
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.organizationId]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const createUser = async (userData: CreateUserData): Promise<boolean> => {
        if (!currentUser?.organizationId) {
            toast.error("No organization context");
            return false;
        }

        try {
            const result = await UserService.inviteUserToOrganization(
                currentUser.organizationId,
                userData.email,
                userData.name,
                userData.position_id
            );

            if (!result.success && result.message) {
                toast.error(result.message);
                return false;
            }

            toast.success("User invited successfully");
            await fetchUsers();
            return true;
        } catch (err: any) {
            console.error("Error inviting user:", err);
            toast.error(err.message || "Failed to invite user");
            return false;
        }
    };

    const updateUser = async (memberId: string, userData: UpdateUserData): Promise<boolean> => {
        try {
            // Only updating position supported for now via this simplified hook
            await UserService.updateMemberPosition(memberId, userData.position_id || null);

            toast.success("User updated successfully");
            await fetchUsers();
            return true;
        } catch (err: any) {
            console.error("Error updating user:", err);
            toast.error(err.message || "Failed to update user");
            return false;
        }
    };

    const deleteUser = async (memberId: string): Promise<boolean> => {
        try {
            await UserService.removeUserFromOrganization(memberId);
            toast.success("User removed from organization");
            await fetchUsers();
            return true;
        } catch (err: any) {
            console.error("Error removing user:", err);
            toast.error(err.message || "Failed to remove user");
            return false;
        }
    };

    return {
        users,
        isLoading,
        error,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        // resetPassword removed - handled via Supabase Auth reset flow generally, can add back tailored for Organization Admin if needed later
    };
}
