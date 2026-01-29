"use client";

import { PageShell } from "@/components/shell/page-shell";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Building2, Users, Power, Plus, Loader2, Search } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useTenants, type Tenant, type CreateTenantData, type UpdateTenantData } from "@/features/admin/hooks/use-tenants";
import { TenantFormSheet } from "@/features/admin/components/tenant-form-sheet";
import { TenantsTable } from "@/features/admin/components/tenants-table";

export default function TenantsPage() {
    return (
        <ProtectedRoute requirePlatformAdmin showAccessDenied>
            <TenantsContent />
        </ProtectedRoute>
    );
}

function TenantsContent() {
    const { tenants, isLoading, createTenant, updateTenant, deleteTenant, toggleTenantStatus } = useTenants();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

    // Filter tenants by search
    const filteredTenants = useMemo(() => {
        if (!searchQuery.trim()) return tenants;
        const lowerQ = searchQuery.toLowerCase();
        return tenants.filter(t =>
            t.name.toLowerCase().includes(lowerQ) ||
            t.slug.toLowerCase().includes(lowerQ)
        );
    }, [tenants, searchQuery]);

    // Stats
    const stats = useMemo(() => [
        { label: "Organizations", value: tenants.length.toString(), icon: Building2 },
        { label: "Active", value: tenants.filter(t => t.is_active).length.toString(), icon: Power },
        { label: "Total Users", value: tenants.reduce((sum, t) => sum + (t.user_count || 0), 0).toString(), icon: Users },
    ], [tenants]);

    const handleEdit = useCallback((tenant: Tenant) => {
        setEditingTenant(tenant);
        setIsSheetOpen(true);
    }, []);

    const handleAddNew = useCallback(() => {
        setEditingTenant(null);
        setIsSheetOpen(true);
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        await deleteTenant(id);
    }, [deleteTenant]);

    const handleToggleStatus = useCallback(async (id: string) => {
        await toggleTenantStatus(id);
    }, [toggleTenantStatus]);

    const handleFormSubmit = useCallback(async (
        data: CreateTenantData | UpdateTenantData,
        tenantId?: string
    ): Promise<boolean> => {
        if (tenantId) {
            return await updateTenant(tenantId, data as UpdateTenantData);
        } else {
            const id = await createTenant(data as CreateTenantData);
            return id !== null;
        }
    }, [createTenant, updateTenant]);

    return (
        <PageShell
            title="Organization Management"
            description="Manage organizations and their subscriptions."
            icon={Building2}
            stats={stats}
            action={
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    New Organization
                </button>
            }
            className="h-[calc(100dvh-2rem)] lg:h-[calc(100dvh-4rem)] flex flex-col"
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Search Bar */}
                <div className="relative w-full max-w-md shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search organizations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0b1115] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                    />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-cyan-400" size={32} />
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-white/5 bg-[#0b1115]">
                        <TenantsTable
                            data={filteredTenants}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onToggleStatus={handleToggleStatus}
                        />
                    </div>
                )}
            </div>

            <TenantFormSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={editingTenant}
            />
        </PageShell>
    );
}

