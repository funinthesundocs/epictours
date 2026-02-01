"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Building2, Plus, Loader2, Search } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
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
            if (error) throw error;
            toast.success("Hotel deleted");
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
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    Add Hotel
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
                        placeholder="Search hotels or pickup points..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary/50 focus:outline-none transition-colors placeholder:text-muted-foreground"
                    />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingState message="Loading hotels..." />
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                        <HotelsTable
                            data={filteredHotels}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    </div>
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
