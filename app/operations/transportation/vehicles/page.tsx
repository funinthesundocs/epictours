"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Bus, Plus, Loader2, Search } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { VehiclesTable } from "@/features/transportation/components/vehicles-table";
import { AddVehicleSheet } from "@/features/transportation/components/add-vehicle-sheet";

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [filteredVehicles, setFilteredVehicles] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const fetchVehicles = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("vehicles")
                .select("*, vendor:vendors(name)")
                .order("name");

            if (error) throw error;
            setVehicles(data || []);
            setFilteredVehicles(data || []);
        } catch (err) {
            console.error("Error loading vehicles:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    // Client-side search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredVehicles(vehicles);
            return;
        }
        const lowerQ = searchQuery.toLowerCase();
        const filtered = vehicles.filter(v =>
            v.name.toLowerCase().includes(lowerQ) ||
            v.plate_number?.toLowerCase().includes(lowerQ) ||
            v.vin_number?.toLowerCase().includes(lowerQ)
        );
        setFilteredVehicles(filtered);
    }, [searchQuery, vehicles]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from("vehicles")
                .delete()
                .eq("id", id);

            if (error) throw error;
            if (error) throw error;
            toast.success("Vehicle deleted");
            fetchVehicles();
        } catch (err) {
            console.error("Error deleting vehicle:", err);
            alert("Failed to delete vehicle.");
        }
    };

    const handleEdit = (vehicle: any) => {
        setEditingItem(vehicle);
        setIsSheetOpen(true);
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setIsSheetOpen(true);
    };

    return (
        <PageShell
            title="Fleet Vehicles"
            description="Manage your fleet, compliance, and vehicle specifications."
            icon={Bus}
            action={
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    Add Vehicle
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
                        placeholder="Search by name, plate, or VIN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary/50 focus:outline-none transition-colors placeholder:text-muted-foreground"
                    />
                </div>

                {/* Table Container - always visible */}
                <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                    {isLoading && vehicles.length === 0 ? (
                        <LoadingState message="Loading vehicles..." />
                    ) : (
                        <div className={isLoading ? "opacity-50" : ""}>
                            <VehiclesTable
                                data={filteredVehicles}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        </div>
                    )}
                </div>
            </div>

            <AddVehicleSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={fetchVehicles}
                initialData={editingItem}
            />
        </PageShell>
    );
}
