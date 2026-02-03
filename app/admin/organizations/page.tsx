"use client";

import { PageShell } from "@/components/shell/page-shell";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Building2, Plus, Loader2, Search } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOrganizations, CreateOrganizationData, UpdateOrganizationData } from "@/features/admin/hooks/use-organizations";
import { OrganizationFormSheet } from "@/features/admin/components/organizations/organization-form-sheet";
import { OrganizationsTable } from "@/features/admin/components/organizations/organizations-table";
import { Organization } from "@/features/auth/types";

export default function OrganizationsPage() {
    return (
        <ProtectedRoute>
            <OrganizationsContent />
        </ProtectedRoute>
    );
}

function OrganizationsContent() {
    const router = useRouter();
    const { organizations, isLoading, createOrganization, updateOrganization, toggleOrganizationStatus } = useOrganizations();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

    const handleRowClick = useCallback((org: Organization) => {
        router.push(`/admin/organizations/${org.slug}`);
    }, [router]);

    // Filter by search
    const filteredOrgs = useMemo(() => {
        if (!searchQuery.trim()) return organizations;
        const lowerQ = searchQuery.toLowerCase();
        return organizations.filter(o =>
            o.name.toLowerCase().includes(lowerQ) ||
            o.slug.toLowerCase().includes(lowerQ)
        );
    }, [organizations, searchQuery]);

    // Stats
    const stats = useMemo(() => [
        { label: "Organizations", value: organizations.length.toString(), icon: Building2 },
        { label: "Active", value: organizations.filter(o => o.status === 'active').length.toString(), icon: Building2 },
    ], [organizations]);

    const handleEdit = useCallback((org: Organization) => {
        setEditingOrg(org);
        setIsSheetOpen(true);
    }, []);

    const handleAddNew = useCallback(() => {
        setEditingOrg(null);
        setIsSheetOpen(true);
    }, []);

    const handleFormSubmit = useCallback(async (
        data: CreateOrganizationData | UpdateOrganizationData,
        orgId?: string
    ): Promise<boolean> => {
        if (orgId) {
            return await updateOrganization(orgId, data as UpdateOrganizationData);
        } else {
            const id = await createOrganization(data as CreateOrganizationData);
            return id !== null;
        }
    }, [createOrganization, updateOrganization]);

    return (
        <PageShell
            title="Organization Management"
            description="Manage organizations and their access."
            icon={Building2}
            stats={stats}
            action={
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    New Organization
                </button>
            }
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Search Bar */}
                <div className="relative w-full max-w-md shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search organizations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary/50 focus:outline-none transition-colors placeholder:text-muted-foreground"
                    />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingState message="Loading organizations..." />
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-border bg-card">
                        <OrganizationsTable
                            data={filteredOrgs}
                            onEdit={handleEdit}
                            onToggleStatus={toggleOrganizationStatus}
                            onRowClick={handleRowClick}
                        />
                    </div>
                )}
            </div>

            <OrganizationFormSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingOrg}
            />
        </PageShell>
    );
}
