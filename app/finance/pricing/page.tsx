"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Coins, Plus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { PricingSchedulesTable } from "@/features/finance/pricing/components/pricing-table";
import { EditPricingSheet } from "@/features/finance/pricing/components/edit-pricing-sheet";

export default function PricingPage() {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [filteredSchedules, setFilteredSchedules] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<any>(null);

    const fetchSchedules = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("pricing_schedules" as any)
                .select("*")
                .order("name");

            if (error) throw error;
            setSchedules(data || []);
            setFilteredSchedules(data || []);
        } catch (err) {
            console.error("Error loading schedules:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    // Client-side search (Name + Notes)
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredSchedules(schedules);
            return;
        }
        const lowerQ = searchQuery.toLowerCase();
        const filtered = schedules.filter(s =>
            s.name.toLowerCase().includes(lowerQ) ||
            s.notes?.toLowerCase().includes(lowerQ)
        );
        setFilteredSchedules(filtered);
    }, [searchQuery, schedules]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from("pricing_schedules" as any)
                .delete()
                .eq("id", id);

            if (error) throw error;
            toast.success("Pricing schedule deleted");
            fetchSchedules();
        } catch (err) {
            console.error("Error deleting schedule:", err);
            alert("Failed to delete schedule.");
        }
    };

    const handleEdit = (schedule: any) => {
        setEditingSchedule(schedule);
        setIsSheetOpen(true);
    };

    const handleAddNew = () => {
        setEditingSchedule(null);
        setIsSheetOpen(true);
    };

    return (
        <PageShell
            title="Pricing Schedules"
            description="Manage multi-tiered pricing structures for your experiences."
            icon={Coins}
            action={
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    New Schedule
                </button>
            }
            className="h-[calc(100vh-2rem)] lg:h-[calc(100vh-4rem)] flex flex-col"
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Search Bar */}
                <div className="relative w-full max-w-md shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search schedules..."
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
                        <PricingSchedulesTable
                            data={filteredSchedules}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    </div>
                )}
            </div>

            <EditPricingSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={fetchSchedules}
                initialData={editingSchedule}
            />
        </PageShell>
    );
}
