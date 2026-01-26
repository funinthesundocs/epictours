"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Plus, Clock, MapPin, Trash2, Calendar, Route } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Combobox } from "@/components/ui/combobox";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Master Schema
const ScheduleSchema = z.object({
    name: z.string().min(2, "Name is required"),
    start_time: z.string().optional()
});

type ScheduleFormData = z.infer<typeof ScheduleSchema>;

interface ScheduleSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export function ScheduleSheet({ isOpen, onClose, onSuccess, initialData }: ScheduleSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stops, setStops] = useState<any[]>([]);
    const [pickupOptions, setPickupOptions] = useState<{ value: string; label: string }[]>([]);

    // Add Stop State
    const [newStopTime, setNewStopTime] = useState("");
    const [newStopPickupId, setNewStopPickupId] = useState("");
    const [isAddingStop, setIsAddingStop] = useState(false);

    // Current Schedule ID (needed for stops)
    const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty }
    } = useForm<ScheduleFormData>({
        resolver: zodResolver(ScheduleSchema),
        defaultValues: { name: "", start_time: "" }
    });

    // Load Pickup Options & Reset
    useEffect(() => {
        const fetchPickups = async () => {
            const { data } = await supabase.from("pickup_points").select("id, name").order("name");
            if (data) {
                setPickupOptions(data.map(p => ({ value: p.id, label: p.name })));
            }
        };
        fetchPickups();
    }, []);

    useEffect(() => {
        if (isOpen && initialData) {
            setCurrentScheduleId(initialData.id);
            reset({
                name: initialData.name,
                start_time: initialData.start_time || ""
            });
            fetchStops(initialData.id);
        } else if (isOpen) {
            // New Mode
            setCurrentScheduleId(null);
            setStops([]);
            reset({ name: "", start_time: "" });
        }
    }, [isOpen, initialData, reset]);

    const fetchStops = async (scheduleId: string) => {
        const { data } = await supabase
            .from("schedule_stops")
            .select(`
                *,
                pickup_points (name)
            `)
            .eq("schedule_id", scheduleId)
            .order("order_index", { ascending: true })
            .order("pickup_time", { ascending: true });

        if (data) setStops(data);
    };

    const handleMasterSubmit = async (data: ScheduleFormData) => {
        setIsSubmitting(true);
        try {
            let scheduleId = currentScheduleId;

            if (scheduleId) {
                // Update Master
                const { error } = await supabase
                    .from("schedules")
                    .update(data)
                    .eq("id", scheduleId);
                if (error) throw error;
            } else {
                // Insert Master
                const { data: newData, error } = await supabase
                    .from("schedules")
                    .insert([data])
                    .select()
                    .single();
                if (error) throw error;
                scheduleId = newData.id;
                setCurrentScheduleId(scheduleId);
            }

            // If we just created it, we don't close, we let them add stops now
            if (!currentScheduleId) {
                alert("Schedule Created! You can now add stops below.");
            } else {
                // If updating, we notify success.
                onSuccess();
            }
            // Close if it was an Edit. Stay open if New.
            if (initialData) {
                onClose();
            }
        } catch (err) {
            console.error("Error saving schedule:", err);
            alert("Failed to save schedule.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddStop = async () => {
        if (!currentScheduleId) return alert("Please save the schedule details first.");
        if (!newStopPickupId || !newStopTime) return alert("Please fill in time and location.");

        setIsAddingStop(true);
        try {
            const { error } = await supabase.from("schedule_stops").insert([{
                schedule_id: currentScheduleId,
                pickup_point_id: newStopPickupId,
                pickup_time: newStopTime,
                order_index: stops.length + 1 // Simple append logic
            }]);
            if (error) throw error;

            setNewStopTime("");
            setNewStopPickupId("");
            fetchStops(currentScheduleId);
        } catch (err) {
            console.error("Error adding stop:", err);
            alert("Failed to add stop.");
        } finally {
            setIsAddingStop(false);
        }
    };

    const [deletingStopId, setDeletingStopId] = useState<string | null>(null);

    const handleConfirmDeleteStop = async () => {
        if (!deletingStopId) return;
        try {
            await supabase.from("schedule_stops").delete().eq("id", deletingStopId);
            if (currentScheduleId) fetchStops(currentScheduleId);
        } catch (err) {
            console.error("Error deleting stop:", err);
        } finally {
            setDeletingStopId(null);
        }
    };

    const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className="flex items-center gap-2 text-cyan-400 border-b border-white/10 pb-2 mb-6 mt-2">
            <Icon size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
        </div>
    );

    const inputClasses = "w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none transition-colors";

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={currentScheduleId ? "Edit Schedule" : "New Schedule"}
            description="Manage schedule details and pickup stops."
            width="max-w-2xl"
            contentClassName="p-0 overflow-hidden flex flex-col"
        >
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24 space-y-10">
                {/* Section 1: Master Details */}
                <form id="schedule-form" onSubmit={handleSubmit(handleMasterSubmit)} className="space-y-6">
                    <div>
                        <SectionHeader icon={Calendar} title="Schedule Details" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Schedule Name</Label>
                                <Input
                                    {...register("name")}
                                    className="text-lg font-semibold"
                                    placeholder="e.g. Circle Island"
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Default Start Time</Label>
                                <Input
                                    {...register("start_time")}
                                    placeholder="e.g. 07:00 AM"
                                />
                            </div>
                        </div>
                    </div>
                    {/* Submit button moved to footer */}
                </form>

                {/* Section 2: Stops Manager */}
                <div>
                    <SectionHeader icon={Route} title="Route Stops" />

                    {currentScheduleId ? (
                        <div className="space-y-4">
                            {/* Route List */}
                            <div className="relative pl-4 space-y-4 before:absolute before:left-[23px] before:top-4 before:bottom-4 before:w-0.5 before:bg-white/10">
                                {stops.map((stop, index) => (
                                    <div key={stop.id} className="relative flex items-center gap-4 bg-black/20 border border-white/5 p-3 rounded-lg group">
                                        {/* Dot on timeline */}
                                        <div className="absolute -left-[27px] w-3 h-3 rounded-full bg-cyan-500 border-2 border-black"></div>

                                        <div className="min-w-[80px]">
                                            <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-sm">
                                                <Clock size={14} />
                                                <span>{stop.pickup_time}</span>
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 text-white font-medium">
                                                <MapPin size={14} className="text-zinc-500" />
                                                {stop.pickup_points?.name || "Unknown Location"}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setDeletingStopId(stop.id); }}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add New Stop Form */}
                            <div className="mt-8 bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4">
                                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">Add New Stop</h4>
                                <div className="flex gap-3 items-end">
                                    <div className="w-32 space-y-1">
                                        <label className="text-xs text-zinc-400">Time</label>
                                        <input
                                            value={newStopTime}
                                            onChange={(e) => setNewStopTime(e.target.value)}
                                            placeholder="00:00 AM"
                                            className={cn(inputClasses, "py-2 px-3")}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-xs text-zinc-400">Pickup Location</label>
                                        <Combobox
                                            options={pickupOptions}
                                            value={newStopPickupId}
                                            onChange={(val) => setNewStopPickupId(val)}
                                            placeholder="Select Location..."
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddStop}
                                        disabled={isAddingStop}
                                        className="h-[42px] px-4 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        {isAddingStop ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 bg-white/5 border border-white/5 border-dashed rounded-xl text-center">
                            <Route size={48} className="text-cyan-500/20 mb-4" />
                            <p className="text-zinc-400 font-medium">Create the schedule first</p>
                            <p className="text-zinc-500 text-sm mt-1">Once saved, you can add pickup stops here.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end items-center gap-4 py-4 px-6 border-t border-white/10 mt-auto bg-[#0b1115]">
                <Button
                    type="submit"
                    form="schedule-form"
                    disabled={isSubmitting || !isDirty}
                    className={cn(
                        "px-6 py-2 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors",
                        isSubmitting ? "bg-cyan-500/50 text-white cursor-not-allowed" :
                            isDirty ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]" :
                                "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                    )}
                >
                    {isSubmitting ? <><Loader2 className="animate-spin" size={16} /> Saving...</> :
                        isDirty ? <><Save size={16} /> {currentScheduleId ? "Update Details" : "Create Schedule"}</> :
                            "No Changes"}
                </Button>
            </div>

            <AlertDialog
                isOpen={!!deletingStopId}
                onClose={() => setDeletingStopId(null)}
                onConfirm={handleConfirmDeleteStop}
                title="Remove Stop?"
                description="Are you sure you want to remove this pickup stop from the schedule?"
                confirmLabel="Remove Stop"
                isDestructive={true}
            />
        </SidePanel>
    );
}
