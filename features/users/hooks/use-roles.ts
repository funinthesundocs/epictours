"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-context";
import type { ModuleCode, PermissionAction } from "@/features/auth/types";

export interface Role {
    id: string;
    organization_id: string;
    name: string;
    description: string | null;
    color: string | null;
    is_default: boolean;
    created_at: string | null;
    // Joined data
    permissions?: RolePermission[];
    user_count?: number;
}

export interface RolePermission {
    id: string;
    role_id: string;
    module_code: ModuleCode;
    resource_type: string;
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
    scope?: Record<string, unknown>;
}

export interface CreateRoleData {
    name: string;
    description?: string;
    color?: string;
    is_default?: boolean;
    permissions?: Omit<RolePermission, 'id' | 'role_id'>[];
}

export interface UpdateRoleData {
    name?: string;
    description?: string;
    color?: string;
    is_default?: boolean;
    permissions?: Omit<RolePermission, 'id' | 'role_id'>[];
}

export function useRoles() {
    const { user: currentUser } = useAuth();
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRoles = useCallback(async () => {
        if (!currentUser?.organizationId) {
            setRoles([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from("roles")
                .select(`
                    *,
                    role_permissions(*),
                    user_roles(count)
                `)
                .eq("organization_id", currentUser.organizationId)
                .order("name");

            if (fetchError) throw fetchError;

            // Transform data
            const transformedRoles: Role[] = (data || []).map(role => ({
                ...role,
                permissions: role.role_permissions || [],
                user_count: role.user_roles?.[0]?.count || 0,
            }));

            setRoles(transformedRoles);
        } catch (err) {
            console.error("Error fetching roles:", err);
            setError("Failed to load roles");
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.organizationId]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const createRole = async (roleData: CreateRoleData): Promise<string | null> => {
        if (!currentUser?.organizationId) {
            toast.error("No organization context");
            return null;
        }

        try {
            const { data: newRole, error: createError } = await supabase
                .from("roles")
                .insert({
                    organization_id: currentUser.organizationId,
                    name: roleData.name,
                    description: roleData.description || null,
                    color: roleData.color || null,
                    is_default: roleData.is_default || false,
                })
                .select()
                .single();

            if (createError) throw createError;

            // Add permissions if provided
            if (roleData.permissions && roleData.permissions.length > 0 && newRole) {
                const permissionsToInsert = roleData.permissions.map(p => ({
                    role_id: newRole.id,
                    module_code: p.module_code,
                    resource_type: p.resource_type,
                    can_create: p.can_create,
                    can_read: p.can_read,
                    can_update: p.can_update,
                    can_delete: p.can_delete,
                    scope: p.scope || null,
                }));

                const { error: permError } = await supabase
                    .from("role_permissions")
                    .insert(permissionsToInsert);

                if (permError) {
                    console.error("Error adding permissions:", permError);
                }
            }

            toast.success("Role created successfully");
            await fetchRoles();
            return newRole?.id || null;
        } catch (err: any) {
            console.error("Error creating role:", err);
            toast.error(err.message || "Failed to create role");
            return null;
        }
    };

    const updateRole = async (roleId: string, roleData: UpdateRoleData): Promise<boolean> => {
        try {
            // Update role record
            const updateData: Record<string, any> = {};
            if (roleData.name !== undefined) updateData.name = roleData.name;
            if (roleData.description !== undefined) updateData.description = roleData.description;
            if (roleData.color !== undefined) updateData.color = roleData.color;
            if (roleData.is_default !== undefined) updateData.is_default = roleData.is_default;

            if (Object.keys(updateData).length > 0) {
                const { error: updateError } = await supabase
                    .from("roles")
                    .update(updateData)
                    .eq("id", roleId);

                if (updateError) throw updateError;
            }

            // Update permissions if provided
            if (roleData.permissions !== undefined) {
                // Delete existing permissions
                await supabase
                    .from("role_permissions")
                    .delete()
                    .eq("role_id", roleId);

                // Insert new permissions
                if (roleData.permissions.length > 0) {
                    const permissionsToInsert = roleData.permissions.map(p => ({
                        role_id: roleId,
                        module_code: p.module_code,
                        resource_type: p.resource_type,
                        can_create: p.can_create,
                        can_read: p.can_read,
                        can_update: p.can_update,
                        can_delete: p.can_delete,
                        scope: p.scope || null,
                    }));

                    const { error: permError } = await supabase
                        .from("role_permissions")
                        .insert(permissionsToInsert);

                    if (permError) throw permError;
                }
            }

            toast.success("Role updated successfully");
            await fetchRoles();
            return true;
        } catch (err: any) {
            console.error("Error updating role:", err);
            toast.error(err.message || "Failed to update role");
            return false;
        }
    };

    const deleteRole = async (roleId: string): Promise<boolean> => {
        try {
            // Check if role has users
            const roleToDelete = roles.find(r => r.id === roleId);
            if (roleToDelete?.user_count && roleToDelete.user_count > 0) {
                toast.error("Cannot delete role with assigned users");
                return false;
            }

            // Delete permissions first (cascade should handle this but just in case)
            await supabase
                .from("role_permissions")
                .delete()
                .eq("role_id", roleId);

            // Delete the role
            const { error } = await supabase
                .from("roles")
                .delete()
                .eq("id", roleId);

            if (error) throw error;

            toast.success("Role deleted");
            await fetchRoles();
            return true;
        } catch (err: any) {
            console.error("Error deleting role:", err);
            toast.error(err.message || "Failed to delete role");
            return false;
        }
    };

    const duplicateRole = async (roleId: string, newName: string): Promise<string | null> => {
        const roleToDuplicate = roles.find(r => r.id === roleId);
        if (!roleToDuplicate) {
            toast.error("Role not found");
            return null;
        }

        return createRole({
            name: newName,
            description: roleToDuplicate.description || undefined,
            color: roleToDuplicate.color || undefined,
            is_default: false,
            permissions: roleToDuplicate.permissions?.map(p => ({
                module_code: p.module_code,
                resource_type: p.resource_type,
                can_create: p.can_create,
                can_read: p.can_read,
                can_update: p.can_update,
                can_delete: p.can_delete,
                scope: p.scope,
            })),
        });
    };

    return {
        roles,
        isLoading,
        error,
        fetchRoles,
        createRole,
        updateRole,
        deleteRole,
        duplicateRole,
    };
}
