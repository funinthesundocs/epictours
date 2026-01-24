"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Availability } from "@/features/availability/components/availability-list-table";
import { Settings, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GlassCombobox } from "@/components/ui/glass-combobox";

interface ColumnThreeProps {
    availability: Availability;
    onSaved: () => void;
}

export function ColumnThree({ availability, onSaved }: ColumnThreeProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Form state
    const [headline, setHeadline] = useState(availability.private_announcement || "");
    const [startTime, setStartTime] = useState(availability.start_time || "");
    const [maxCapacity, setMaxCapacity] = useState(availability.max_capacity?.toString() || "");
    const [routeId, setRouteId] = useState(availability.transportation_route_id || "");
    const [vehicleId, setVehicleId] = useState(availability.vehicle_id || "");

    // Reference data
    const [routes, setRoutes] = useState<{ id: string, name: string }[]>([]);
    const [vehicles, setVehicles] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        const fetchRefs = async () => {
            const { data: routeData } = await supabase.from('schedules').select('id, name');
            const { data: vehicleData } = await supabase.from('vehicles').select('id, name');
            if (routeData) setRoutes(routeData);
            if (vehicleData) setVehicles(vehicleData);
        };
        fetchRefs();
    }, []);

    // Track changes
    useEffect(() => {
        const changed =
            headline !== (availability.private_announcement || "") ||
            startTime !== (availability.start_time || "") ||
            maxCapacity !== (availability.max_capacity?.toString() || "") ||
            routeId !== (availability.transportation_route_id || "") ||
            vehicleId !== (availability.vehicle_id || "");
        setHasChanges(changed);
    }, [headline, startTime, maxCapacity, routeId, vehicleId, availability]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('availabilities')
                .update({
                    private_announcement: headline || null,
                    start_time: startTime || null,
                    max_capacity: maxCapacity ? parseInt(maxCapacity) : 0,
                    transportation_route_id: routeId || null,
                    vehicle_id: vehicleId || null
                })
                .eq('id', availability.id);

            if (error) throw error;

            toast.success("Settings saved");
            setHasChanges(false);
            onSaved();
        } catch (err: any) {
            toast.error("Failed to save: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Section Header */}
            <div className="space-y-2">
                <label className="text-base font-medium text-zinc-400 flex items-center gap-2">
                    <Settings size={18} className="text-cyan-500" />
                    Quick Settings
                </label>
            </div>

            {/* Private Note */}
            <div className="space-y-2">
                <label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                    Private Note
                </label>
                <textarea
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-cyan-500/50 placeholder-zinc-600"
                    rows={2}
                    placeholder="Internal note for staff..."
                />
            </div>

            {/* Time */}
            <div className="space-y-2">
                <label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                    Start Time
                </label>
                <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                />
            </div>

            {/* Capacity */}
            <div className="space-y-2">
                <label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                    Max Capacity
                </label>
                <input
                    type="number"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                    min="0"
                />
            </div>

            {/* Pickup Route */}
            <div className="space-y-2">
                <label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                    Pickup Route
                </label>
                <GlassCombobox
                    options={[
                        { value: "", label: "No route" },
                        ...routes.map(r => ({ value: r.id, label: r.name }))
                    ]}
                    value={routeId}
                    onValueChange={setRouteId}
                    placeholder="Select route..."
                />
            </div>

            {/* Vehicle */}
            <div className="space-y-2">
                <label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                    Vehicle
                </label>
                <GlassCombobox
                    options={[
                        { value: "", label: "No vehicle" },
                        ...vehicles.map(v => ({ value: v.id, label: v.name }))
                    ]}
                    value={vehicleId}
                    onValueChange={setVehicleId}
                    placeholder="Select vehicle..."
                />
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={cn(
                    "w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all",
                    hasChanges && !isSaving
                        ? "bg-cyan-500 hover:bg-cyan-400 text-black"
                        : "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-white/10"
                )}
            >
                {isSaving ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <Save size={18} />
                )}
                {isSaving ? "Saving..." : hasChanges ? "Save Changes" : "No Changes"}
            </button>
        </div>
    );
}
