"use client";

import { PageShell } from "@/components/shell/page-shell";
import { MapPin, Loader2, Plus } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { PickupPointsTable } from "@/features/transportation/components/pickup-points-table";
import { AddPickupSheet } from "@/features/transportation/components/add-pickup-sheet";

export default function PickupPointsPage() {
    const [points, setPoints] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const fetchPoints = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("pickup_points")
                .select("*")
                .order("name");

            if (error) throw error;
            setPoints(data || []);
        } catch (err) {
            console.error("Error loading pickup points:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPoints();
    }, [fetchPoints]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from("pickup_points")
                .delete()
                .eq("id", id);

            if (error) throw error;
            fetchPoints(); // Refresh
        } catch (err) {
            console.error("Error deleting:", err);
            alert("Failed to delete location.");
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setIsSheetOpen(true);
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setIsSheetOpen(true);
    };

    return (
        <PageShell
            title="Pickup Points"
            description="Manage centralized pickup locations and map coordinates."
            icon={MapPin}
            action={
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    Add Location
                </button>
            }
        >
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-cyan-400" size={32} />
                </div>
            ) : (
                <PickupPointsTable
                    data={points}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            <AddPickupSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={fetchPoints}
                initialData={editingItem}
            />
        </PageShell>
    );
}
