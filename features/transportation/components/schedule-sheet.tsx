"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Plus, Clock, MapPin, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Combobox } from "@/components/ui/combobox";

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
        formState: { errors }
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
                // If updating, we can close or stay open. Let's just notify.
                // Actually, usually "Save Changes" implies done. 
                // But for "Live Edit" of stops, the Save button only applies to the top.
                onSuccess();
            }
            // For new items, we stay open to add stops. For edits, we just save metadata.
            // Let's close if it was an Edit. Stay open if New.
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

    const handleRemoveStop = async (id: string) => {
        if (!confirm("Remove this stop?")) return;
        try {
            await supabase.from("schedule_stops").delete().eq("id", id);
            if (currentScheduleId) fetchStops(currentScheduleId);
        } catch (err) {
            console.error("Error deleting stop:", err);
        }
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={currentScheduleId ? "Edit Schedule" : "New Schedule"}
            description="Manage schedule details and pickup stops."
            width="max-w-2xl"
        >
            <div className="space-y-8">
                {/* Section 1: Master Details */}
                <form onSubmit={handleSubmit(handleMasterSubmit)} className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Schedule Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Schedule Name</label>
                            <input
                                {...register("name")}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
                                placeholder="e.g. Circle Island"
                            />
                            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Start Time</label>
                            <input
                                {...register("start_time")}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
                                placeholder="e.g. 7:00 AM"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-sm flex items-center gap-2 transition-colors"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                            {currentScheduleId ? "Update Details" : "Create Schedule"}
                        </button>
                    </div>
                </form>

                {/* Section 2: Stops Manager (Only if ID exists) */}
                {currentScheduleId && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Pickup Stops</h3>
                            <span className="text-xs text-zinc-500">{stops.length} stops configured</span>
                        </div>

                        <div className="space-y-2">
                            {/* Header Row */}
                            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-zinc-500 px-2">
                                <div className="col-span-3">Time</div>
                                <div className="col-span-8">Location</div>
                                <div className="col-span-1"></div>
                            </div>

                            {/* Existing Stops */}
                            {stops.map((stop) => (
                                <div key={stop.id} className="grid grid-cols-12 gap-2 items-center bg-black/20 border border-white/5 rounded-lg p-2 group">
                                    <div className="col-span-3 flex items-center gap-2 text-zinc-300 text-sm">
                                        <Clock size={14} className="text-cyan-500/50" />
                                        {stop.pickup_time}
                                    </div>
                                    <div className="col-span-8 flex items-center gap-2 text-white text-sm">
                                        <MapPin size={14} className="text-cyan-500/50" />
                                        {stop.pickup_points?.name || "Unknown Location"}
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <button
                                            onClick={() => handleRemoveStop(stop.id)}
                                            className="text-zinc-600 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Add New Stop Row */}
                            <div className="grid grid-cols-12 gap-2 items-center bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-2 mt-4">
                                <div className="col-span-3">
                                    <input
                                        value={newStopTime}
                                        onChange={(e) => setNewStopTime(e.target.value)}
                                        placeholder="Time"
                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                                    />
                                </div>
                                <div className="col-span-8">
                                    <Combobox
                                        options={pickupOptions}
                                        value={newStopPickupId}
                                        onChange={(val) => setNewStopPickupId(val)}
                                        placeholder="Select Location..."
                                    />
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <button
                                        onClick={handleAddStop}
                                        disabled={isAddingStop}
                                        className="p-1.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded transition-colors"
                                    >
                                        {isAddingStop ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!currentScheduleId && (
                    <div className="text-center py-8 text-zinc-500 text-sm italic">
                        Save the schedule details above to start adding stops.
                    </div>
                )}
            </div>
        </SidePanel>
    );
}
