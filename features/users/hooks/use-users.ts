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
    nickname: string | null;
    avatar_url: string | null;
    is_organization_owner: boolean;
    status: 'active' | 'invited' | 'suspended';
    created_at: string;
    // Extended profile
    phone_number?: string | null;
    notes?: string | null;
    messaging_apps?: { type: string; handle: string }[] | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
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
    nickname?: string;
    phone_number?: string;
    notes?: string;
    position_id?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    messaging_apps?: { type: string; handle: string }[];
}

export interface UpdateUserData {
    name?: string;
    email?: string;
    nickname?: string;
    password?: string;
    phone_number?: string;
    notes?: string;
    position_id?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    messaging_apps?: { type: string; handle: string }[];
}

export function useUsers() {
    const { user: currentUser, effectiveOrganizationId } = useAuth(); // currentUser is AuthenticatedUser
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        if (!effectiveOrganizationId) {
            setUsers([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const members = await OrganizationService.getOrganizationMembers(effectiveOrganizationId);

            const transformedUsers: User[] = members.map(m => ({
                id: m.id, // organization_users.id
                userId: m.user.id,
                email: m.user.email,
                name: m.user.name,
                nickname: m.user.nickname,
                avatar_url: m.user.avatar_url,
                is_organization_owner: m.is_organization_owner,
                status: m.status as 'active' | 'invited' | 'suspended',
                created_at: m.created_at,
                phone_number: m.user.phone_number,
                notes: m.user.notes,
                messaging_apps: m.user.messaging_apps,
                address: m.user.address,
                city: m.user.city,
                state: m.user.state,
                zip_code: m.user.zip_code,
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
    }, [effectiveOrganizationId]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const createUser = async (userData: CreateUserData): Promise<boolean> => {
        if (!effectiveOrganizationId) {
            toast.error("No organization context");
            return false;
        }

        try {
            const result = await UserService.inviteUserToOrganization(
                effectiveOrganizationId,
                userData
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
            // Find the user to get their actual user.id
            const user = users.find(u => u.id === memberId);

            console.log("updateUser called:", { memberId, userData, foundUser: user });

            if (!user) {
                console.error("User not found in list for memberId:", memberId);
                toast.error("User not found");
                return false;
            }

            // 1. Update User Profile
            await UserService.updateUser(user.userId, {
                name: userData.name,
                email: userData.email,
                nickname: userData.nickname,
                password: userData.password,
                phone_number: userData.phone_number,
                notes: userData.notes,
                messaging_apps: userData.messaging_apps,
                address: userData.address,
                city: userData.city,
                state: userData.state,
                zip_code: userData.zip_code
            });

            // 2. Update Position (organization_users.primary_position_id)
            if (userData.position_id !== undefined) {
                await UserService.updateMemberPosition(memberId, userData.position_id || null);
            }

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
