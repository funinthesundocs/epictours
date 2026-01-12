"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Map, Plus, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ExperiencesTable } from "@/features/experiences/components/experiences-table";
import { ExperienceSheet } from "@/features/experiences/components/experience-sheet";
import { Experience } from "@/features/experiences/types";

export default function ToursPage() {
    const [data, setData] = useState<Experience[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Experience | undefined>(undefined);

    const fetchExperiences = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("experiences")
            .select("*")
            .order("name");

        if (data) setData(data);
        setIsLoading(false);
    }, []);

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
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    Add Experience
                </button>
            }
        >
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-cyan-400" size={32} />
                    </div>
                ) : (
                    <ExperiencesTable
                        data={data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
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
