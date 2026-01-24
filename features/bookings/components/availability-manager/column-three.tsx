"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Availability } from "@/features/availability/components/availability-list-table";
import {
    ChevronDown, ChevronRight, FileText, Clock, Users,
    Settings, Map, Truck, Save, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ColumnThreeProps {
    availability: Availability;
    onSaved: () => void;
}

interface SettingSection {
    id: string;
    label: string;
    icon: React.ReactNode;
}

export function ColumnThree({ availability, onSaved }: ColumnThreeProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Form state
    const [headline, setHeadline] = useState(availability.private_announcement || "");
    const [startTime, setStartTime] = useState(availability.start_time || "");
    const [hoursLong, setHoursLong] = useState(availability.hours_long?.toString() || "");
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
            hoursLong !== (availability.hours_long?.toString() || "") ||
            maxCapacity !== (availability.max_capacity?.toString() || "") ||
            routeId !== (availability.transportation_route_id || "") ||
            vehicleId !== (availability.vehicle_id || "");
        setHasChanges(changed);
    }, [headline, startTime, hoursLong, maxCapacity, routeId, vehicleId, availability]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('availabilities')
                .update({
                    private_announcement: headline || null,
                    start_time: startTime || null,
                    hours_long: hoursLong ? parseInt(hoursLong) : null,
                    max_capacity: maxCapacity ? parseInt(maxCapacity) : 0,
                    transportation_route_id: routeId || null,
                    vehicle_id: vehicleId || null
                })
                .eq('id', availability.id);

            if (error) throw error;

            toast.success("Settings saved successfully");
            setHasChanges(false);
            onSaved();
        } catch (err: any) {
            toast.error("Failed to save: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const sections: SettingSection[] = [
        { id: 'headlines', label: 'Headlines & Notes', icon: <FileText size={16} /> },
        { id: 'time', label: 'Time', icon: <Clock size={16} /> },
        { id: 'capacity', label: 'Capacity', icon: <Users size={16} /> },
        { id: 'route', label: 'Pickup Route', icon: <Map size={16} /> },
        { id: 'vehicle', label: 'Vehicle', icon: <Truck size={16} /> },
    ];

    const toggleSection = (id: string) => {
        setExpandedSection(expandedSection === id ? null : id);
    };

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Settings size={18} className="text-zinc-400" />
                    Quick Settings
                </h3>
            </div>

            {/* Accordion Sections */}
            <div className="space-y-2">
                {sections.map((section) => (
                    <div key={section.id} className="border border-white/10 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleSection(section.id)}
                            className="w-full px-4 py-3 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <span className="text-white font-medium flex items-center gap-3">
                                <span className="text-zinc-400">{section.icon}</span>
                                {section.label}
                            </span>
                            {expandedSection === section.id ? (
                                <ChevronDown size={16} className="text-zinc-400" />
                            ) : (
                                <ChevronRight size={16} className="text-zinc-400" />
                            )}
                        </button>

                        {expandedSection === section.id && (
                            <div className="px-4 py-4 bg-black/20 space-y-3">
                                {section.id === 'headlines' && (
                                    <div>
                                        <label className="text-zinc-400 text-xs uppercase font-bold block mb-2">
                                            Private Announcement
                                        </label>
                                        <textarea
                                            value={headline}
                                            onChange={(e) => setHeadline(e.target.value)}
                                            className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-cyan-500/50"
                                            rows={3}
                                            placeholder="Internal note for staff..."
                                        />
                                    </div>
                                )}

                                {section.id === 'time' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-zinc-400 text-xs uppercase font-bold block mb-2">
                                                Start Time
                                            </label>
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-zinc-400 text-xs uppercase font-bold block mb-2">
                                                Duration (Hours)
                                            </label>
                                            <input
                                                type="number"
                                                value={hoursLong}
                                                onChange={(e) => setHoursLong(e.target.value)}
                                                className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                                                min="1"
                                            />
                                        </div>
                                    </div>
                                )}

                                {section.id === 'capacity' && (
                                    <div>
                                        <label className="text-zinc-400 text-xs uppercase font-bold block mb-2">
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
                                )}

                                {section.id === 'route' && (
                                    <div>
                                        <label className="text-zinc-400 text-xs uppercase font-bold block mb-2">
                                            Pickup Route / Schedule
                                        </label>
                                        <select
                                            value={routeId}
                                            onChange={(e) => setRouteId(e.target.value)}
                                            className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                                        >
                                            <option value="">No route assigned</option>
                                            {routes.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {section.id === 'vehicle' && (
                                    <div>
                                        <label className="text-zinc-400 text-xs uppercase font-bold block mb-2">
                                            Assigned Vehicle
                                        </label>
                                        <select
                                            value={vehicleId}
                                            onChange={(e) => setVehicleId(e.target.value)}
                                            className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                                        >
                                            <option value="">No vehicle assigned</option>
                                            {vehicles.map(v => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={cn(
                    "w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all",
                    hasChanges && !isSaving
                        ? "bg-cyan-500 hover:bg-cyan-400 text-black"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
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
