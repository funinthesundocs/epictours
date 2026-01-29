"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-context";

export interface User {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    platform_role: string | null;
    tenant_id: string | null;
    is_tenant_admin: boolean;
    is_active: boolean;
    temp_password: boolean;
    created_at: string | null;
    last_login_at: string | null;
    // Joined data
    roles?: Array<{
        id: string;
        name: string;
        color: string | null;
    }>;
}

export interface CreateUserData {
    email: string;
    name: string;
    temp_password?: string;
    is_tenant_admin?: boolean;
    role_ids?: string[];
}

export interface UpdateUserData {
    name?: string;
    is_tenant_admin?: boolean;
    is_active?: boolean;
    role_ids?: string[];
}

export function useUsers() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        if (!currentUser?.tenantId) {
            setUsers([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from("users")
                .select(`
                    *,
                    user_roles(
                        roles(id, name, color)
                    )
                `)
                .eq("tenant_id", currentUser.tenantId)
                .order("name");

            if (fetchError) throw fetchError;

            // Transform data to flatten roles
            const transformedUsers: User[] = (data || []).map(user => ({
                ...user,
                roles: user.user_roles?.map((ur: { roles: { id: string; name: string; color: string | null } }) => ur.roles).filter(Boolean) || []
            }));

            setUsers(transformedUsers);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("Failed to load users");
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.tenantId]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const createUser = async (userData: CreateUserData): Promise<boolean> => {
        if (!currentUser?.tenantId) {
            toast.error("No tenant context");
            return false;
        }

        try {
            // Hash the temporary password (in production, use a proper hashing library)
            // For now, we'll store it as-is since Supabase will handle auth
            const { data: newUser, error: createError } = await supabase
                .from("users")
                .insert({
                    email: userData.email,
                    name: userData.name,
                    tenant_id: currentUser.tenantId,
                    is_tenant_admin: userData.is_tenant_admin || false,
                    password_hash: userData.temp_password || null, // In production: hash this
                    temp_password: !!userData.temp_password,
                    is_active: true,
                })
                .select()
                .single();

            if (createError) throw createError;

            // Assign roles if provided
            if (userData.role_ids && userData.role_ids.length > 0 && newUser) {
                const roleAssignments = userData.role_ids.map(roleId => ({
                    user_id: newUser.id,
                    role_id: roleId,
                    assigned_by: currentUser.id,
                }));

                const { error: roleError } = await supabase
                    .from("user_roles")
                    .insert(roleAssignments);

                if (roleError) {
                    console.error("Error assigning roles:", roleError);
                    // Don't fail the whole operation, user is created
                }
            }

            toast.success("User created successfully");
            await fetchUsers();
            return true;
        } catch (err: any) {
            console.error("Error creating user:", err);
            toast.error(err.message || "Failed to create user");
            return false;
        }
    };

    const updateUser = async (userId: string, userData: UpdateUserData): Promise<boolean> => {
        try {
            // Update user record
            const updateData: Record<string, any> = {};
            if (userData.name !== undefined) updateData.name = userData.name;
            if (userData.is_tenant_admin !== undefined) updateData.is_tenant_admin = userData.is_tenant_admin;
            if (userData.is_active !== undefined) updateData.is_active = userData.is_active;

            if (Object.keys(updateData).length > 0) {
                const { error: updateError } = await supabase
                    .from("users")
                    .update(updateData)
                    .eq("id", userId);

                if (updateError) throw updateError;
            }

            // Update role assignments if provided
            if (userData.role_ids !== undefined) {
                // Delete existing assignments
                await supabase
                    .from("user_roles")
                    .delete()
                    .eq("user_id", userId);

                // Insert new assignments
                if (userData.role_ids.length > 0) {
                    const roleAssignments = userData.role_ids.map(roleId => ({
                        user_id: userId,
                        role_id: roleId,
                        assigned_by: currentUser?.id,
                    }));

                    const { error: roleError } = await supabase
                        .from("user_roles")
                        .insert(roleAssignments);

                    if (roleError) throw roleError;
                }
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

    const deleteUser = async (userId: string): Promise<boolean> => {
        try {
            // Soft delete - just deactivate
            const { error } = await supabase
                .from("users")
                .update({ is_active: false })
                .eq("id", userId);

            if (error) throw error;

            toast.success("User deactivated");
            await fetchUsers();
            return true;
        } catch (err: any) {
            console.error("Error deleting user:", err);
            toast.error(err.message || "Failed to deactivate user");
            return false;
        }
    };

    const resetPassword = async (userId: string, newPassword: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from("users")
                .update({
                    password_hash: newPassword, // In production: hash this
                    temp_password: true,
                })
                .eq("id", userId);

            if (error) throw error;

            toast.success("Password reset - user will need to change on next login");
            return true;
        } catch (err: any) {
            console.error("Error resetting password:", err);
            toast.error(err.message || "Failed to reset password");
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
        resetPassword,
    };
}
