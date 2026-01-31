"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/auth-context";
import { toast } from "sonner";
import { AuthenticatedUser } from "@/features/auth/types";
import { UserService } from "@/lib/services/user-service";

export function useUsers() {
    const { isPlatformAdmin } = useAuth();
    const [users, setUsers] = useState<AuthenticatedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        if (!isPlatformAdmin()) return;

        setIsLoading(true);
        setError(null);

        try {
            // Note: AuthenticatedUser type matches most of db user columns,
            // but we need to map them carefully.
            const { data, error: fetchError } = await supabase
                .from("users")
                .select(`
                     *,
                     organization_users (
                        organization_id,
                        organizations (name)
                     )
                `)
                .order("created_at", { ascending: false });

            if (fetchError) throw fetchError;

            const mappedUsers: AuthenticatedUser[] = (data || []).map((u: any) => {
                // Determine active org (just take first for list view)
                const orgMembership = u.organization_users?.[0];

                return {
                    id: u.id,
                    email: u.email,
                    name: u.name,
                    nickname: u.nickname,
                    avatarUrl: u.avatar_url,
                    phone_number: u.phone_number,
                    notes: u.notes,
                    messaging_apps: u.messaging_apps,
                    address: u.address,
                    city: u.city,
                    state: u.state,
                    zip_code: u.zip_code,

                    isPlatformSuperAdmin: u.is_platform_super_admin,
                    isPlatformSystemAdmin: u.is_platform_system_admin,
                    isPlatformAdmin: u.is_platform_super_admin || u.is_platform_system_admin,

                    organizationId: orgMembership?.organization_id ?? null,
                    organizationName: orgMembership?.organizations?.name ?? null,
                    organizationSlug: null, // Not fetching slug for list view optimization

                    memberId: null, // Context-specific
                    isOrganizationOwner: false, // Context-specific
                    activePositionId: null,
                    activePositionName: null,

                    subscribedModules: [],
                    permissions: [],
                    requiresPasswordChange: false
                };
            });

            setUsers(mappedUsers);
        } catch (err: any) {
            console.error("Error fetching users:", err);
            setError(err.message);
            toast.error("Failed to load users");
        } finally {
            setIsLoading(false);
        }
    }, [isPlatformAdmin]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const togglePlatformAdmin = async (userId: string, type: 'super' | 'system', value: boolean) => {
        try {
            // Current values
            const user = users.find(u => u.id === userId);
            if (!user) return;

            const isSuper = type === 'super' ? value : user.isPlatformSuperAdmin;
            const isSystem = type === 'system' ? value : user.isPlatformSystemAdmin;

            await UserService.setPlatformAdmin(userId, isSuper, isSystem);
            toast.success("User admin privileges updated");
            fetchUsers();
        } catch (err: any) {
            console.error("Error updating user:", err);
            toast.error("Failed to update user");
        }
    };

    const createPlatformUser = async (data: {
        email: string;
        name: string;
        nickname?: string;
        phone_number?: string;
        notes?: string;
        messaging_apps?: { type: string; handle: string }[];
        address?: string;
        city?: string;
        state?: string;
        zip_code?: string;
        is_platform_super_admin?: boolean;
        is_platform_system_admin?: boolean;
        password?: string;
    }) => {
        try {
            await UserService.createPlatformUser(data);
            toast.success("User created successfully");
            fetchUsers();
            return true;
        } catch (err: any) {
            console.error("Error creating user:", err);
            toast.error(err.message || "Failed to create user");
            return false;
        }
    };

    const updatePlatformUser = async (userId: string, data: {
        name?: string;
        email?: string;
        nickname?: string;
        password?: string;
        phone_number?: string;
        notes?: string;
        messaging_apps?: { type: string; handle: string }[];
        address?: string;
        city?: string;
        state?: string;
        zip_code?: string;
        is_platform_super_admin?: boolean;
        is_platform_system_admin?: boolean;
    }) => {
        try {
            await UserService.updateUser(userId, data);
            toast.success("User updated successfully");
            fetchUsers();
            return true;
        } catch (err: any) {
            console.error("Error updating user:", err);
            toast.error("Failed to update user");
            return false;
        }
    };

    const deletePlatformUser = async (userId: string) => {
        try {
            await UserService.deleteUser(userId);
            toast.success("User deleted successfully");
            fetchUsers();
        } catch (err: any) {
            console.error("Error deleting user:", err);
            toast.error("Failed to delete user");
        }
    };

    return {
        users,
        isLoading,
        error,
        fetchUsers,
        togglePlatformAdmin,
        createPlatformUser,
        updatePlatformUser,
        deletePlatformUser
    };
}
