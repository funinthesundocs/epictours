"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-context";
import { supabase } from "@/lib/supabase";

export interface PartnerUser {
    id: string; // The cross_organization_access ID
    user_id: string;
    email: string; // From users table
    name: string; // From users table
    avatar_url: string | null;
    relationship_type: 'partner' | 'affiliate';
    status: 'active' | 'pending' | 'revoked';
    permission_group: {
        id: string;
        name: string;
    } | null;
    created_at: string;
}

export function usePartners() {
    const { user: currentUser } = useAuth();
    const [partners, setPartners] = useState<PartnerUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPartners = useCallback(async () => {
        if (!currentUser?.organizationId) {
            setPartners([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("cross_organization_access")
                .select(`
                    id,
                    user_id,
                    relationship_type,
                    status,
                    created_at,
                    user:users (
                        id,
                        email,
                        name,
                        avatar_url
                    ),
                    permission_group:roles (
                        id,
                        name
                    )
                `)
                .eq("host_organization_id", currentUser.organizationId)
                .neq("status", "revoked") // Optionally hide revoked, or show them? Let's hide for now or filter in UI
                .order("created_at", { ascending: false });

            if (error) throw error;

            const transformed: PartnerUser[] = data.map((item: any) => ({
                id: item.id,
                user_id: item.user_id,
                email: item.user?.email || "Unknown",
                name: item.user?.name || "Unknown",
                avatar_url: item.user?.avatar_url,
                relationship_type: item.relationship_type,
                status: item.status,
                permission_group: item.permission_group,
                created_at: item.created_at
            }));

            setPartners(transformed);
        } catch (err) {
            console.error("Error fetching partners:", err);
            toast.error("Failed to load partners");
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.organizationId]);

    useEffect(() => {
        fetchPartners();
    }, [fetchPartners]);

    const invitePartner = async (email: string, permissionGroupId: string, relationshipType: 'partner' | 'affiliate') => {
        if (!currentUser?.organizationId) return false;

        try {
            // 1. Check if user exists
            let { data: existingUser } = await supabase
                .from("users")
                .select("id")
                .eq("email", email)
                .single();

            let userId = existingUser?.id;

            // 2. If not, create invited user (PENDING IMPL - Reuse UserService logic or simple create)
            // For now, let's assume strict existing user check or simple create if allowed.
            // Simplified: Create user if missing.
            if (!userId) {
                const { data: newUser, error: createError } = await supabase
                    .from("users")
                    .insert({
                        email,
                        name: email.split('@')[0], // Fallback name
                        temp_password: true,
                        is_active: true
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                userId = newUser.id;
            }

            // 3. Create Cross Org Access
            const { error: inviteError } = await supabase
                .from("cross_organization_access")
                .insert({
                    host_organization_id: currentUser.organizationId,
                    user_id: userId,
                    permission_group_id: permissionGroupId,
                    relationship_type: relationshipType,
                    status: 'pending'
                });

            if (inviteError) {
                if (inviteError.code === '23505') { // Unique violation? (Need to check if unique constraint exists on user+host_org)
                    // If no constraint, logic handles. If constraint exists, catch it.
                    // The schema didn't explicitly show a unique index on (user_id, host_organization_id) but it should probably have one.
                    // Assuming for now it might error if we don't check.
                    // Let's just catch.
                    toast.error("User is already a partner.");
                    return false;
                }
                throw inviteError;
            }

            toast.success("Partner invited successfully");
            fetchPartners();
            return true;
        } catch (err: any) {
            console.error("Error inviting partner:", err);
            toast.error(err.message || "Failed to invite partner");
            return false;
        }
    };

    const revokeAccess = async (accessId: string) => {
        try {
            const { error } = await supabase
                .from("cross_organization_access")
                .delete() // Or set status = 'revoked'
                .eq("id", accessId);

            if (error) throw error;
            toast.success("Access revoked");
            fetchPartners();
            return true;
        } catch (err) {
            console.error("Error revoking access:", err);
            toast.error("Failed to revoke access");
            return false;
        }
    };

    return {
        partners,
        isLoading,
        invitePartner,
        revokeAccess,
        fetchPartners
    };
}
