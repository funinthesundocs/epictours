"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Handshake, Plus, Loader2, Search } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { VendorsTable } from "@/features/transportation/components/vendors-table";
import { AddVendorSheet } from "@/features/transportation/components/add-vendor-sheet";
import { useAuth } from "@/features/auth/auth-context";

export default function VendorsPage() {
    const { effectiveOrganizationId } = useAuth();
    const [vendors, setVendors] = useState<any[]>([]);
    const [filteredVendors, setFilteredVendors] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const fetchVendors = useCallback(async () => {
        if (!effectiveOrganizationId) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("vendors")
                .select("*, user:users(name, email, phone_number)")
                .eq("organization_id", effectiveOrganizationId)
                .order("id");

            if (error) throw error;
            // Flatten user data - all identity data comes from users table
            const flattenedData = (data || []).map(v => ({
                ...v,
                name: v.user?.name || 'Unknown',
                email: v.user?.email || '',
                phone: v.user?.phone_number || ''
            }));
            setVendors(flattenedData);
            setFilteredVendors(flattenedData);
        } catch (err) {
            console.error("Error loading vendors:", err);
            // Don't alert here to avoid spamming if table doesn't exist yet
        } finally {
            setIsLoading(false);
        }
    }, [effectiveOrganizationId]);

    useEffect(() => {
        fetchVendors();
    }, [fetchVendors]);

    // Client-side search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredVendors(vendors);
            return;
        }
        const lowerQ = searchQuery.toLowerCase();
        const filtered = vendors.filter(v =>
            v.name?.toLowerCase().includes(lowerQ) ||
            v.email?.toLowerCase().includes(lowerQ) ||
            v.phone?.toLowerCase().includes(lowerQ) ||
            v.ein_number?.toLowerCase().includes(lowerQ)
        );
        setFilteredVendors(filtered);
    }, [searchQuery, vendors]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from("vendors")
                .delete()
                .eq("id", id);

            if (error) throw error;
            if (error) throw error;
            toast.success("Vendor deleted");
            fetchVendors();
        } catch (err) {
            console.error("Error deleting vendor:", err);
            alert("Failed to delete vendor.");
        }
    };

    const handleEdit = (vendor: any) => {
        setEditingItem(vendor);
        setIsSheetOpen(true);
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setIsSheetOpen(true);
    };

    return (
        <PageShell
            title="Transportation Vendors"
            description="Manage external transportation providers and partners."
            icon={Handshake}
            action={
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    Add Vendor
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
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary/50 focus:outline-none transition-colors placeholder:text-muted-foreground"
                    />
                </div>

                {/* Table Container - always visible */}
                <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                    {isLoading && vendors.length === 0 ? (
                        <LoadingState message="Loading vendors..." />
                    ) : (
                        <div className={isLoading ? "opacity-50" : ""}>
                            <VendorsTable
                                data={filteredVendors}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        </div>
                    )}
                </div>
            </div>

            <AddVendorSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={fetchVendors}
                initialData={editingItem}
            />
        </PageShell>
    );
}
