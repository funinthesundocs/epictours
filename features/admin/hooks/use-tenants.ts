"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/auth-context";
import { toast } from "sonner";
import type { ModuleCode } from "@/features/auth/types";

// Tenant interface
export interface Tenant {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    is_active: boolean;
    // Computed from joins
    user_count?: number;
    subscriptions?: TenantSubscription[];
}

export interface TenantSubscription {
    id: string;
    tenant_id: string;
    module_code: ModuleCode;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
}

export interface CreateTenantData {
    name: string;
    slug: string;
    is_active?: boolean;
}

export interface UpdateTenantData {
    name?: string;
    slug?: string;
    is_active?: boolean;
}

/**
 * Hook for managing tenants (System Admin only).
 */
export function useTenants() {
    const { isPlatformAdmin } = useAuth();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTenants = useCallback(async () => {
        if (!isPlatformAdmin()) {
            setError("Access denied");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch tenants with subscriptions
            const { data, error: fetchError } = await supabase
                .from("tenants")
                .select(`
                    *,
                    tenant_subscriptions(*)
                `)
                .order("name");

            if (fetchError) throw fetchError;

            // Get user counts separately
            const { data: userCounts } = await supabase
                .from("users")
                .select("tenant_id")
                .not("tenant_id", "is", null);

            const countMap = new Map<string, number>();
            (userCounts || []).forEach((u: any) => {
                if (u.tenant_id) {
                    countMap.set(u.tenant_id, (countMap.get(u.tenant_id) || 0) + 1);
                }
            });

            const tenantsWithCounts = (data || []).map((tenant: any) => ({
                ...tenant,
                subscriptions: tenant.tenant_subscriptions || [],
                user_count: countMap.get(tenant.id) || 0,
            }));

            setTenants(tenantsWithCounts);
        } catch (err: any) {
            console.error("Error fetching tenants:", err);
            setError(err.message);
            toast.error("Failed to load tenants");
        } finally {
            setIsLoading(false);
        }
    }, [isPlatformAdmin]);

    useEffect(() => {
        fetchTenants();
    }, [fetchTenants]);

    const createTenant = async (data: CreateTenantData): Promise<string | null> => {
        if (!isPlatformAdmin()) {
            toast.error("Access denied");
            return null;
        }

        try {
            const { data: newTenant, error } = await supabase
                .from("tenants")
                .insert([{
                    name: data.name,
                    slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                    is_active: data.is_active ?? true,
                }])
                .select()
                .single();

            if (error) throw error;

            toast.success("Tenant created successfully");
            await fetchTenants();
            return newTenant?.id || null;
        } catch (err: any) {
            console.error("Error creating tenant:", err);
            toast.error(err.message || "Failed to create tenant");
            return null;
        }
    };

    const updateTenant = async (id: string, data: UpdateTenantData): Promise<boolean> => {
        if (!isPlatformAdmin()) {
            toast.error("Access denied");
            return false;
        }

        try {
            const updateData: Record<string, any> = {};
            if (data.name !== undefined) updateData.name = data.name;
            if (data.slug !== undefined) updateData.slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            if (data.is_active !== undefined) updateData.is_active = data.is_active;

            const { error } = await supabase
                .from("tenants")
                .update(updateData)
                .eq("id", id);

            if (error) throw error;

            toast.success("Tenant updated successfully");
            await fetchTenants();
            return true;
        } catch (err: any) {
            console.error("Error updating tenant:", err);
            toast.error(err.message || "Failed to update tenant");
            return false;
        }
    };

    const deleteTenant = async (id: string): Promise<boolean> => {
        if (!isPlatformAdmin()) {
            toast.error("Access denied");
            return false;
        }

        try {
            // Check if tenant has users
            const tenant = tenants.find(t => t.id === id);
            if (tenant && tenant.user_count && tenant.user_count > 0) {
                toast.error("Cannot delete tenant with active users");
                return false;
            }

            const { error } = await supabase
                .from("tenants")
                .delete()
                .eq("id", id);

            if (error) throw error;

            toast.success("Tenant deleted successfully");
            await fetchTenants();
            return true;
        } catch (err: any) {
            console.error("Error deleting tenant:", err);
            toast.error(err.message || "Failed to delete tenant");
            return false;
        }
    };

    const toggleTenantStatus = async (id: string): Promise<boolean> => {
        const tenant = tenants.find(t => t.id === id);
        if (!tenant) return false;

        return await updateTenant(id, { is_active: !tenant.is_active });
    };

    return {
        tenants,
        isLoading,
        error,
        fetchTenants,
        createTenant,
        updateTenant,
        deleteTenant,
        toggleTenantStatus,
    };
}
