"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Layers, Plus, Loader2, Search } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { PricingVariationsTable } from "@/features/settings/pricing-variations/components/pricing-variations-table";
import { EditVariationSheet } from "@/features/settings/pricing-variations/components/edit-variation-sheet";
import { toast } from "sonner";

export default function PricingVariationsPage() {
    const [variations, setVariations] = useState<any[]>([]);
    const [filteredVariations, setFilteredVariations] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingVariation, setEditingVariation] = useState<any>(null);

    // Debounce Ref
    const searchTimeoutRef = useRef<NodeJS.Timeout>(null);

    const fetchVariations = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("pricing_variations" as any)
                .select("*")
                .order("sort_order", { ascending: true });

            if (error) throw error;
            setVariations(data || []);
            setFilteredVariations(data || []);
        } catch (err) {
            console.error("Error loading variations:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVariations();
    }, [fetchVariations]);

    // Client-side search with debounce
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(() => {
            if (!searchQuery.trim()) {
                setFilteredVariations(variations);
                return;
            }
            const lowerQ = searchQuery.toLowerCase();
            const filtered = variations.filter(v =>
                v.name.toLowerCase().includes(lowerQ)
            );
            setFilteredVariations(filtered);
        }, 300);

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [searchQuery, variations]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from("pricing_variations" as any)
                .delete()
                .eq("id", id);

            if (error) throw error;
            fetchVariations();
        } catch (err) {
            console.error("Error deleting variation:", err);
            alert("Failed to delete variation.");
        }
    };

    const handleEdit = (variation: any) => {
        setEditingVariation(variation);
        setIsSheetOpen(true);
    };

    const handleAddNew = () => {
        setEditingVariation(null);
        setIsSheetOpen(true);
    };

    // Handle reordering and persist to DB
    const handleReorder = async (reorderedData: any[]) => {
        // Optimistic update
        setVariations(reorderedData);
        setFilteredVariations(reorderedData);

        try {
            // Update each item's sort_order in DB
            const updates = reorderedData.map(item =>
                supabase
                    .from("pricing_variations" as any)
                    .update({ sort_order: item.sort_order })
                    .eq("id", item.id)
            );

            await Promise.all(updates);
            toast.success("Order saved");
        } catch (err) {
            console.error("Error saving order:", err);
            toast.error("Failed to save order");
            // Revert on error
            fetchVariations();
        }
    };

    return (
        <PageShell
            title="Pricing Variations"
            description="Define and order pricing variation labels. Drag to reorder."
            icon={Layers}
            action={
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    New Variation
                </button>
            }
            className="h-[calc(100vh-2rem)] lg:h-[calc(100vh-4rem)] flex flex-col"
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Comprehensive Search Bar */}
                <div className="relative w-full max-w-md shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search variations..."
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
                    <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-white/5 bg-[#0b1115]">
                        <PricingVariationsTable
                            data={filteredVariations}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onReorder={handleReorder}
                        />
                    </div>
                )}
            </div>

            <EditVariationSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={fetchVariations}
                initialData={editingVariation}
            />
        </PageShell>
    );
}
