"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Settings, List } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { PageShell } from "@/components/shell/page-shell";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BookingOptionsTable } from "@/features/settings/booking-options/components/booking-options-table";
import { EditBookingOptionSheet } from "@/features/settings/booking-options/components/edit-booking-option-sheet";

// Supabase Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function BookingOptionsPage() {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<any | null>(null);

    const fetchSchedules = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("booking_option_schedules")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching schedules:", error);
            // toast.error("Failed to load schedules"); // Suppress initial error if table missing
        } else {
            setSchedules(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const handleCreate = () => {
        setEditingSchedule(null);
        setIsSheetOpen(true);
    };

    const handleEdit = (schedule: any) => {
        setEditingSchedule(schedule);
        setIsSheetOpen(true);
    };

    const handleDuplicate = async (schedule: any) => {
        const confirm = window.confirm(`Duplicate "${schedule.name}"?`);
        if (!confirm) return;

        const { id, created_at, updated_at, ...rest } = schedule;
        const newName = `${rest.name} (Copy)`;

        const { error } = await supabase
            .from("booking_option_schedules")
            .insert([{
                ...rest,
                name: newName
            }]);

        if (error) {
            toast.error("Failed to duplicate schedule");
        } else {
            toast.success("Schedule duplicated");
            fetchSchedules();
        }
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase
            .from("booking_option_schedules")
            .delete()
            .eq("id", id);

        if (error) {
            toast.error("Failed to delete schedule");
        } else {
            toast.success("Schedule deleted");
            fetchSchedules();
        }
    };

    const filteredSchedules = schedules.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <PageShell
            title="Booking Options"
            description="Configure option schedules for booking flows."
            icon={List}
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
            action={
                <Button
                    onClick={handleCreate}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all"
                >
                    <Plus className="mr-2 h-4 w-4" /> New Booking Option
                </Button>
            }
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Toolbar */}
                <div className="flex items-center gap-4 shrink-0">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search schedules..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Table Area */}
                <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse">
                            Loading schedules...
                        </div>
                    ) : (
                        <BookingOptionsTable
                            data={filteredSchedules}
                            onEdit={handleEdit}
                            onDuplicate={handleDuplicate}
                            onDelete={handleDelete}
                        />
                    )}
                </div>
            </div>

            {/* Edit Sheet */}
            <EditBookingOptionSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={fetchSchedules}
                initialData={editingSchedule}
            />
        </PageShell>
    );
}
