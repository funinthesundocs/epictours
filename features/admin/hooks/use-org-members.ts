"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/auth-context";
import { toast } from "sonner";
import type { ModuleCode } from "@/features/auth/types";

export interface OrgMember {
    id: string; // organization_users.id
    userId: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    isOwner: boolean;
    status: string;
    positionId: string | null;
    positionName: string | null;
    createdAt: string;
    // Computed: which modules the user can access via this org
    moduleAccess: ModuleCode[];
}

export interface UpdateMemberData {
    isOwner?: boolean;
    positionId?: string | null;
    status?: string;
}

/**
 * Hook for managing organization members (Platform Admin only).
 * Fetches users who belong to a specific organization and allows management.
 */
export function useOrgMembers(organizationId: string | null) {
    const { isPlatformAdmin } = useAuth();
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMembers = useCallback(async () => {
        if (!organizationId || !isPlatformAdmin()) {
            setMembers([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch organization_users with joined user and position data
            const { data, error: fetchError } = await supabase
                .from("organization_users")
                .select(`
                    id,
                    user_id,
                    is_organization_owner,
                    status,
                    primary_position_id,
                    created_at,
                    users (id, email, name, avatar_url),
                    staff_positions (id, name)
                `)
                .eq("organization_id", organizationId)
                .order("created_at", { ascending: false });

            console.log("[useOrgMembers] Query result:", { organizationId, data, fetchError });

            if (fetchError) throw fetchError;

            // Fetch org subscriptions to know available modules
            const { data: subs } = await supabase
                .from("organization_subscriptions")
                .select("module_code, is_active")
                .eq("organization_id", organizationId)
                .eq("is_active", true);

            const activeModules: ModuleCode[] = (subs || [])
                .filter((s: any) => s.is_active)
                .map((s: any) => s.module_code as ModuleCode);

            const mapped: OrgMember[] = (data || []).map((row: any) => ({
                id: row.id,
                userId: row.user_id,
                email: row.users?.email || "",
                name: row.users?.name || "Unknown",
                avatarUrl: row.users?.avatar_url || null,
                isOwner: row.is_organization_owner || false,
                status: row.status || "active",
                positionId: row.primary_position_id,
                positionName: row.staff_positions?.name || null,
                createdAt: row.created_at,
                moduleAccess: activeModules, // All active org modules for now
            }));

            setMembers(mapped);
        } catch (err: any) {
            console.error("Error fetching org members:", err);
            setError(err.message);
            toast.error("Failed to load organization members");
        } finally {
            setIsLoading(false);
        }
    }, [organizationId, isPlatformAdmin]);

    // Auto-fetch on mount and when org changes
    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const updateMember = async (memberId: string, data: UpdateMemberData): Promise<boolean> => {
        if (!isPlatformAdmin()) {
            toast.error("Access denied");
            return false;
        }

        try {
            const updatePayload: Record<string, unknown> = {};
            if (data.isOwner !== undefined) updatePayload.is_organization_owner = data.isOwner;
            if (data.positionId !== undefined) updatePayload.primary_position_id = data.positionId;
            if (data.status !== undefined) updatePayload.status = data.status;

            const { error } = await supabase
                .from("organization_users")
                .update(updatePayload)
                .eq("id", memberId);

            if (error) throw error;

            toast.success("Member updated");
            await fetchMembers();
            return true;
        } catch (err: any) {
            console.error("Error updating member:", err);
            toast.error(err.message || "Failed to update member");
            return false;
        }
    };

    const removeMember = async (memberId: string): Promise<boolean> => {
        if (!isPlatformAdmin()) {
            toast.error("Access denied");
            return false;
        }

        try {
            const { error } = await supabase
                .from("organization_users")
                .delete()
                .eq("id", memberId);

            if (error) throw error;

            toast.success("Member removed from organization");
            await fetchMembers();
            return true;
        } catch (err: any) {
            console.error("Error removing member:", err);
            toast.error(err.message || "Failed to remove member");
            return false;
        }
    };

    const toggleOwnerStatus = async (memberId: string, makeOwner: boolean): Promise<boolean> => {
        return updateMember(memberId, { isOwner: makeOwner });
    };

    return {
        members,
        isLoading,
        error,
        fetchMembers,
        updateMember,
        removeMember,
        toggleOwnerStatus,
    };
}
