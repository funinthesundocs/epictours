"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Map, Plus, Loader2 } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { toast } from "sonner";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ExperiencesTable } from "@/features/experiences/components/experiences-table";
import { ExperienceSheet } from "@/features/experiences/components/experience-sheet";
import { Experience } from "@/features/experiences/types";
import { useAuth } from "@/features/auth/auth-context";

export default function ToursPage() {
    const { effectiveOrganizationId } = useAuth();
    const [data, setData] = useState<Experience[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Experience | undefined>(undefined);

    const fetchExperiences = useCallback(async () => {
        if (!effectiveOrganizationId) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from("experiences")
            .select("*")
            .eq("organization_id", effectiveOrganizationId)
            .order("name");

        if (data) setData(data);
        setIsLoading(false);
    }, [effectiveOrganizationId]);

    useEffect(() => {
        fetchExperiences();
    }, [fetchExperiences]);

    const handleAddNew = () => {
        setEditingItem(undefined);
        setIsSheetOpen(true);
    };

    const handleEdit = (item: Experience) => {
        setEditingItem(item);
        setIsSheetOpen(true);
    };

    const handleDelete = async (id: string) => {
        await supabase.from("experiences").delete().eq("id", id);
        toast.success("Experience deleted");
        fetchExperiences();
    };

    return (
        <PageShell
            title="Tours & Experiences"
            description="Manage your inventory of tours, activities, and transport options."
            icon={Map}
            action={
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm transition-colors shadow-glow"
                >
                    <Plus size={16} />
                    Add Experience
                </button>
            }
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            <div className="h-full flex flex-col space-y-4">
                <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                    {isLoading ? (
                        <LoadingState message="Loading experiences..." />
                    ) : (
                        <ExperiencesTable
                            data={data}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    )}
                </div>
            </div>

            <ExperienceSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={fetchExperiences}
                initialData={editingItem}
            />
        </PageShell>
    );
}
