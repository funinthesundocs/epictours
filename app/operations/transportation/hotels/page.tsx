"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Building2, Plus, Loader2, Search } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { HotelsTable } from "@/features/transportation/components/hotels-table";
import { AddHotelSheet } from "@/features/transportation/components/add-hotel-sheet";

export default function HotelsPage() {
    const [hotels, setHotels] = useState<any[]>([]);
    const [filteredHotels, setFilteredHotels] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const fetchHotels = useCallback(async () => {
        setIsLoading(true);
        try {
            // Join with pickup_points to get the name
            const { data, error } = await supabase
                .from("hotels")
                .select(`
                    *,
                    pickup_points (
                        name
                    )
                `)
                .order("name");

            if (error) throw error;
            setHotels(data || []);
            setFilteredHotels(data || []);
        } catch (err) {
            console.error("Error loading hotels:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHotels();
    }, [fetchHotels]);

    // Client-side search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredHotels(hotels);
            return;
        }
        const lowerQ = searchQuery.toLowerCase();
        const filtered = hotels.filter(h =>
            h.name.toLowerCase().includes(lowerQ) ||
            (h.pickup_points?.name || "").toLowerCase().includes(lowerQ)
        );
        setFilteredHotels(filtered);
    }, [searchQuery, hotels]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from("hotels")
                .delete()
                .eq("id", id);

            if (error) throw error;
            fetchHotels();
        } catch (err) {
            console.error("Error deleting hotel:", err);
            alert("Failed to delete hotel.");
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
            title="Hotel Directory"
            description="Manage hotel partners and their assigned pickup locations."
            icon={Building2}
            action={
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    Add Hotel
                </button>
            }
        >
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search hotels or pickup points..."
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
                    <HotelsTable
                        data={filteredHotels}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            <AddHotelSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={fetchHotels}
                initialData={editingItem}
            />
        </PageShell>
    );
}
