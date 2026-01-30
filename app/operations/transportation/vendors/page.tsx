"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Handshake, Plus, Loader2, Search } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { VendorsTable } from "@/features/transportation/components/vendors-table";
import { AddVendorSheet } from "@/features/transportation/components/add-vendor-sheet";

export default function VendorsPage() {
    const [vendors, setVendors] = useState<any[]>([]);
    const [filteredVendors, setFilteredVendors] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const fetchVendors = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("vendors")
                .select("*")
                .order("name");

            if (error) throw error;
            setVendors(data || []);
            setFilteredVendors(data || []);
        } catch (err) {
            console.error("Error loading vendors:", err);
            // Don't alert here to avoid spamming if table doesn't exist yet
        } finally {
            setIsLoading(false);
        }
    }, []);

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
            v.name.toLowerCase().includes(lowerQ) ||
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
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-bold rounded-lg text-sm transition-colors"
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0b1115] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:border-cyan-400/50 focus:outline-none transition-colors"
                    />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-cyan-400" size={32} />
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-white/5 bg-[#010e0f]">
                        <VendorsTable
                            data={filteredVendors}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    </div>
                )}
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
