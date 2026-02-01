"use client";

import { PageShell } from "@/components/shell/page-shell";
import { CalendarClock, Plus, Loader2, Search } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { SchedulesTable } from "@/features/transportation/components/schedules-table";
import { ScheduleSheet } from "@/features/transportation/components/schedule-sheet";

export default function SchedulesPage() {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [filteredSchedules, setFilteredSchedules] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const fetchSchedules = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("schedules")
                .select("*")
                .order("start_time");

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

    // Client-side search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredSchedules(schedules);
            return;
        }
        const lowerQ = searchQuery.toLowerCase();
        const filtered = schedules.filter(s =>
            s.name.toLowerCase().includes(lowerQ)
        );
        setFilteredSchedules(filtered);
    }, [searchQuery, schedules]);

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from("schedules")
                .delete()
                .eq("id", id);

            if (error) throw error;
            if (error) throw error;
            toast.success("Schedule deleted");
            fetchSchedules();
        } catch (err) {
            console.error("Error deleting schedule:", err);
            alert("Failed to delete schedule.");
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
            title="Route Schedules"
            description="Manage routes, start times, and ordered pickup stops."
            icon={CalendarClock}
            action={
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    Create Schedule
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
                        placeholder="Search schedules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary/50 focus:outline-none transition-colors placeholder:text-muted-foreground"
                    />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingState message="Loading schedules..." />
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                        <SchedulesTable
                            data={filteredSchedules}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    </div>
                )}
            </div>

            <ScheduleSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={fetchSchedules}
                initialData={editingItem}
            />
        </PageShell>
    );
}
