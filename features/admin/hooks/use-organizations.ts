"use client";

import { useState, useCallback, useEffect } from "react";
import { OrganizationService } from "@/lib/services/organization-service";
import { useAuth } from "@/features/auth/auth-context";
import { toast } from "sonner";
import { Organization } from "@/features/auth/types";

export type { Organization };

export interface CreateOrganizationData {
    name: string;
    slug: string;
    status?: 'active' | 'suspended';
}

export interface UpdateOrganizationData {
    name?: string;
    slug?: string;
    status?: 'active' | 'suspended';
}

export function useOrganizations() {
    const { isPlatformAdmin } = useAuth();
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrganizations = useCallback(async () => {
        if (!isPlatformAdmin()) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await OrganizationService.getAllOrganizations();
            setOrganizations(data);
        } catch (err: any) {
            console.error("Error fetching organizations:", err);
            setError(err.message);
            toast.error("Failed to load organizations");
        } finally {
            setIsLoading(false);
        }
    }, [isPlatformAdmin]);

    useEffect(() => {
        fetchOrganizations();
    }, [fetchOrganizations]);

    const createOrganization = async (data: CreateOrganizationData) => {
        try {
            const newOrg = await OrganizationService.createOrganization(data.name, data.slug);
            toast.success("Organization created successfully");
            fetchOrganizations();
            return newOrg.id;
        } catch (err: any) {
            console.error("Error creating organization:", err);
            toast.error(err.message || "Failed to create organization");
            return null;
        }
    };

    const updateOrganization = async (id: string, data: UpdateOrganizationData) => {
        try {
            await OrganizationService.updateOrganization(id, data);
            toast.success("Organization updated successfully");
            fetchOrganizations();
            return true;
        } catch (err: any) {
            console.error("Error updating organization:", err);
            toast.error(err.message || "Failed to update organization");
            return false;
        }
    };

    const toggleOrganizationStatus = async (id: string) => {
        const org = organizations.find(o => o.id === id);
        if (!org) return;
        const newStatus = org.status === 'active' ? 'suspended' : 'active';
        return await updateOrganization(id, { status: newStatus });
    };

    return {
        organizations,
        isLoading,
        error,
        fetchOrganizations,
        createOrganization,
        updateOrganization,
        toggleOrganizationStatus
    };
}
