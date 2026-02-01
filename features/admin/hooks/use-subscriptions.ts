"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/auth-context";
import { toast } from "sonner";
import type { ModuleCode } from "@/features/auth/types";
import { getRegisteredModules } from "@/features/modules/registry";

export interface Subscription {
    id: string;
    organization_id: string;
    module_code: ModuleCode;
    is_active: boolean;
    expires_at: string | null;
    created_at: string;
}

export interface SubscriptionUpdate {
    module_code: ModuleCode;
    is_active: boolean;
    expires_at?: string | null;
}

/**
 * Hook for managing organization subscriptions (System Admin only).
 */
export function useSubscriptions(organizationId: string | null) {
    const { isPlatformAdmin } = useAuth();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const availableModules = getRegisteredModules();

    const fetchSubscriptions = useCallback(async () => {
        if (!organizationId || !isPlatformAdmin()) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from("organization_subscriptions")
                .select("*")
                .eq("organization_id", organizationId)
                .order("module_code");

            if (fetchError) throw fetchError;

            setSubscriptions(data || []);
        } catch (err: any) {
            console.error("Error fetching subscriptions:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [organizationId, isPlatformAdmin]);

    const setModuleSubscription = async (
        moduleCode: ModuleCode,
        isActive: boolean,
        expiresAt?: string | null
    ): Promise<boolean> => {
        if (!organizationId || !isPlatformAdmin()) {
            toast.error("Access denied");
            return false;
        }

        try {
            // Check if subscription exists
            const existingSub = subscriptions.find(s => s.module_code === moduleCode);

            if (existingSub) {
                // Update existing
                const { error } = await supabase
                    .from("organization_subscriptions")
                    .update({
                        is_active: isActive,
                        expires_at: expiresAt ?? null,
                    })
                    .eq("id", existingSub.id);

                if (error) throw error;
            } else if (isActive) {
                // Create new subscription
                const { error } = await supabase
                    .from("organization_subscriptions")
                    .insert([{
                        organization_id: organizationId,
                        module_code: moduleCode,
                        is_active: true,
                        expires_at: expiresAt ?? null,
                    }]);

                if (error) throw error;
            }

            toast.success(`Module ${isActive ? 'enabled' : 'disabled'}`);
            await fetchSubscriptions();
            return true;
        } catch (err: any) {
            console.error("Error updating subscription:", err);
            toast.error(err.message || "Failed to update subscription");
            return false;
        }
    };

    const updateBulkSubscriptions = async (updates: SubscriptionUpdate[]): Promise<boolean> => {
        if (!organizationId || !isPlatformAdmin()) {
            toast.error("Access denied");
            return false;
        }

        try {
            for (const update of updates) {
                await setModuleSubscription(update.module_code, update.is_active, update.expires_at);
            }
            toast.success("Subscriptions updated");
            return true;
        } catch (err: any) {
            console.error("Error updating subscriptions:", err);
            toast.error("Failed to update some subscriptions");
            return false;
        }
    };

    const isModuleActive = (moduleCode: ModuleCode): boolean => {
        const sub = subscriptions.find(s => s.module_code === moduleCode);
        if (!sub) return false;
        if (!sub.is_active) return false;
        if (sub.expires_at && new Date(sub.expires_at) < new Date()) return false;
        return true;
    };

    const isModuleExpired = (moduleCode: ModuleCode): boolean => {
        const sub = subscriptions.find(s => s.module_code === moduleCode);
        if (!sub || !sub.expires_at) return false;
        return new Date(sub.expires_at) < new Date();
    };

    const getExpiryDate = (moduleCode: ModuleCode): string | null => {
        const sub = subscriptions.find(s => s.module_code === moduleCode);
        return sub?.expires_at || null;
    };

    return {
        subscriptions,
        isLoading,
        error,
        availableModules,
        fetchSubscriptions,
        setModuleSubscription,
        updateBulkSubscriptions,
        isModuleActive,
        isModuleExpired,
        getExpiryDate,
    };
}
