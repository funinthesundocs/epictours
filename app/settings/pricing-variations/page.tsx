"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Layers, Plus, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { PricingVariationsTable } from "@/features/settings/pricing-variations/components/pricing-variations-table";
import { EditVariationSheet } from "@/features/settings/pricing-variations/components/edit-variation-sheet";
import { toast } from "sonner";

export default function PricingVariationsPage() {
    const [variations, setVariations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingVariation, setEditingVariation] = useState<any>(null);

    const fetchVariations = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("pricing_variations" as any)
                .select("*")
                .order("sort_order", { ascending: true });

            if (error) throw error;
            setVariations(data || []);
        } catch (err) {
            console.error("Error loading variations:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVariations();
    }, [fetchVariations]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from("pricing_variations" as any)
                .delete()
                .eq("id", id);

            if (error) throw error;
            toast.success("Variation deleted");
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
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-400 hover:bg-cyan-400 text-white font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    New Variation
                </button>
            }
            className="h-[calc(100dvh-2rem)] lg:h-[calc(100dvh-4rem)] flex flex-col"
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-cyan-400" size={32} />
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-white/5 bg-[#0b1115]">
                    <PricingVariationsTable
                        data={variations}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onReorder={handleReorder}
                    />
                </div>
            )}

            <EditVariationSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={fetchVariations}
                initialData={editingVariation}
            />
        </PageShell>
    );
}
