"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Settings, List } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
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
        <div className="flex flex-col h-full bg-[#0b1115] text-white p-6 gap-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                            <List size={24} />
                        </div>
                        Booking Options
                    </h1>
                    <p className="text-zinc-400 mt-1">Configure option schedules for booking flows</p>
                </div>

                <Button
                    onClick={handleCreate}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all"
                >
                    <Plus className="mr-2 h-4 w-4" /> New Schedule
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 shrink-0">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search schedules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-[#0f172a]/50 border-white/10 text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
                    />
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 min-h-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-zinc-500 animate-pulse">
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

            {/* Edit Sheet */}
            <EditBookingOptionSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onSuccess={fetchSchedules}
                initialData={editingSchedule}
            />
        </div>
    );
}
