"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Availability } from "@/features/availability/components/availability-list-table";
import { Settings } from "lucide-react";
import { GlassCombobox } from "@/components/ui/glass-combobox";

interface ColumnOneProps {
    availability: Availability;
    // Expose state for parent/column-three
    onStateChange: (state: {
        hasChanges: boolean;
        isSaving: boolean;
    }) => void;
    saveRef: React.MutableRefObject<(() => Promise<void>) | null>;
}

export function ColumnOne({ availability, onStateChange, saveRef }: ColumnOneProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Form state - initialized from availability
    const [headline, setHeadline] = useState(availability.private_announcement || "");
    const [startTime, setStartTime] = useState(availability.start_time || "");
    const [maxCapacity, setMaxCapacity] = useState(availability.max_capacity?.toString() || "");
    const [routeId, setRouteId] = useState(availability.transportation_route_id || "");
    const [vehicleId, setVehicleId] = useState(availability.vehicle_id || "");
    const [pricingScheduleId, setPricingScheduleId] = useState(availability.pricing_schedule_id || "");
    const [bookingOptionScheduleId, setBookingOptionScheduleId] = useState(availability.booking_option_schedule_id || "");

    // Staff - stored as staff_ids array, we'll extract driver/guide
    const [staffIds, setStaffIds] = useState<string[]>(availability.staff_ids || []);
    const [driverId, setDriverId] = useState("");
    const [guideId, setGuideId] = useState("");

    // Rate tier and option variation are runtime selections, not stored on availability
    const [rateTier, setRateTier] = useState("Retail");
    const [optionVariation, setOptionVariation] = useState("retail");

    // Reference data
    const [routes, setRoutes] = useState<{ id: string, name: string }[]>([]);
    const [vehicles, setVehicles] = useState<{ id: string, name: string }[]>([]);
    const [drivers, setDrivers] = useState<{ id: string, name: string }[]>([]);
    const [guides, setGuides] = useState<{ id: string, name: string }[]>([]);
    const [pricingSchedules, setPricingSchedules] = useState<{ id: string, name: string }[]>([]);
    const [bookingOptionSchedules, setBookingOptionSchedules] = useState<{ id: string, name: string }[]>([]);
    const tiers = ["Retail", "Online", "Special", "Custom"];

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-');
        return `${m}-${d}-${y}`;
    };

    const formatTime = (timeStr: string | undefined) => {
        if (!timeStr) return "All Day";
        return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    const bookedCount = availability.booked_count || 0;
    const maxCap = availability.max_capacity || 0;
    const remaining = Math.max(0, maxCap - bookedCount);

    // Fetch reference data and extract driver/guide from staff_ids
    useEffect(() => {
        const fetchRefs = async () => {
            // Fetch routes (schedules table)
            const { data: routeData } = await supabase.from('schedules').select('id, name').order('name');

            // Fetch vehicles
            const { data: vehicleData } = await supabase.from('vehicles').select('id, name').eq('status', 'active').order('name');

            // Fetch staff with roles
            const { data: staffData } = await supabase.from('staff').select('id, name, role:roles(name)').order('name');

            // Fetch pricing schedules
            const { data: pricingData } = await supabase.from('pricing_schedules').select('id, name').order('name');

            // Fetch booking option schedules
            const { data: optionData } = await supabase.from('booking_option_schedules').select('id, name').order('name');

            if (routeData) setRoutes(routeData);
            if (vehicleData) setVehicles(vehicleData);
            if (pricingData) setPricingSchedules(pricingData);
            if (optionData) setBookingOptionSchedules(optionData);

            // Separate staff into drivers and guides based on role
            if (staffData) {
                const driverList: { id: string, name: string }[] = [];
                const guideList: { id: string, name: string }[] = [];

                staffData.forEach((s: any) => {
                    const roleName = s.role?.name?.toLowerCase() || '';
                    if (roleName.includes('driver')) {
                        driverList.push({ id: s.id, name: s.name });
                    }
                    if (roleName.includes('guide')) {
                        guideList.push({ id: s.id, name: s.name });
                    }
                    // Staff can be both or neither - add to both if generic
                    if (!roleName.includes('driver') && !roleName.includes('guide')) {
                        // Add to both lists for generic staff
                        driverList.push({ id: s.id, name: s.name });
                        guideList.push({ id: s.id, name: s.name });
                    }
                });

                setDrivers(driverList);
                setGuides(guideList);

                // Try to extract driver/guide from existing staff_ids
                const existingIds = availability.staff_ids || [];
                if (existingIds.length > 0 && staffData) {
                    // First staff is typically driver, second is guide
                    const first = existingIds[0];
                    const second = existingIds[1];

                    if (first && driverList.some(d => d.id === first)) {
                        setDriverId(first);
                    }
                    if (second && guideList.some(g => g.id === second)) {
                        setGuideId(second);
                    } else if (first && guideList.some(g => g.id === first) && !driverList.some(d => d.id === first)) {
                        // If first is only a guide
                        setGuideId(first);
                    }
                }
            }
        };
        fetchRefs();
    }, [availability.staff_ids]);

    // Track changes and notify parent
    useEffect(() => {
        const originalStaffIds = availability.staff_ids || [];
        const newStaffIds = [driverId, guideId].filter(Boolean);
        const staffChanged = JSON.stringify(originalStaffIds.sort()) !== JSON.stringify(newStaffIds.sort());

        const changed =
            headline !== (availability.private_announcement || "") ||
            startTime !== (availability.start_time || "") ||
            maxCapacity !== (availability.max_capacity?.toString() || "") ||
            routeId !== (availability.transportation_route_id || "") ||
            vehicleId !== (availability.vehicle_id || "") ||
            pricingScheduleId !== (availability.pricing_schedule_id || "") ||
            bookingOptionScheduleId !== (availability.booking_option_schedule_id || "") ||
            staffChanged;

        setHasChanges(changed);
        onStateChange({ hasChanges: changed, isSaving });
    }, [headline, startTime, maxCapacity, routeId, vehicleId, pricingScheduleId, bookingOptionScheduleId, driverId, guideId, isSaving, availability, onStateChange]);

    // Expose save function to parent
    useEffect(() => {
        saveRef.current = async () => {
            setIsSaving(true);
            try {
                // Build staff_ids array from driver and guide
                const newStaffIds = [driverId, guideId].filter(Boolean);

                const { error } = await supabase
                    .from('availabilities')
                    .update({
                        private_announcement: headline || null,
                        start_time: startTime || null,
                        max_capacity: maxCapacity ? parseInt(maxCapacity) : 0,
                        transportation_route_id: routeId || null,
                        vehicle_id: vehicleId || null,
                        pricing_schedule_id: pricingScheduleId || null,
                        booking_option_schedule_id: bookingOptionScheduleId || null,
                        staff_ids: newStaffIds.length > 0 ? newStaffIds : null
                    })
                    .eq('id', availability.id);

                if (error) throw error;
                setHasChanges(false);
            } finally {
                setIsSaving(false);
            }
        };
    }, [headline, startTime, maxCapacity, routeId, vehicleId, pricingScheduleId, bookingOptionScheduleId, driverId, guideId, availability.id, saveRef]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Header Info Card */}
            <div className="p-4 bg-black/20 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-xs tracking-wider border-b border-white/5 pb-2">
                    {availability.experience_name || "Unknown Experience"}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Date</div>
                        <div className="text-white font-medium">
                            {formatDate(availability.start_date)}
                        </div>
                    </div>
                    <div>
                        <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Time</div>
                        <div className="text-white font-medium">
                            {formatTime(availability.start_time)}
                        </div>
                    </div>
                    <div className="col-span-2 border-t border-white/5 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Capacity</div>
                                <div className="text-white font-medium">
                                    {bookedCount} / {maxCap} Pax
                                </div>
                            </div>
                            <div>
                                <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Remaining</div>
                                <div className={`font-medium ${remaining <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {remaining} Pax
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-span-2 border-t border-white/5 pt-2">
                        <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Availability ID</div>
                        <div className="text-zinc-400 font-mono text-[10px] truncate" title={availability.id}>
                            {availability.id}
                        </div>
                    </div>
                </div>
            </div>

            {/* Transportation and Staff (Live display from current form state) */}
            <div className="space-y-2">
                <label className="text-base font-medium text-zinc-400">
                    Transportation and Staff
                </label>
                <div className="p-4 bg-black/20 rounded-xl border border-white/10 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Route</div>
                            <div className="text-white text-sm">
                                {routes.find(r => r.id === routeId)?.name || availability.route_name || "—"}
                            </div>
                        </div>
                        <div>
                            <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Vehicle</div>
                            <div className="text-white text-sm">
                                {vehicles.find(v => v.id === vehicleId)?.name || availability.vehicle_name || "—"}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                        <div>
                            <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Driver</div>
                            <div className="text-white text-sm">
                                {drivers.find(d => d.id === driverId)?.name || availability.driver_name || "—"}
                            </div>
                        </div>
                        <div>
                            <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Guide</div>
                            <div className="text-white text-sm">
                                {guides.find(g => g.id === guideId)?.name || availability.guide_name || ""}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Settings */}
            <div className="space-y-4">
                <label className="text-base font-medium text-zinc-400 flex items-center gap-2">
                    <Settings size={18} className="text-cyan-500" />
                    Quick Settings
                </label>

                {/* Time & Capacity Row */}
                <div className="grid grid-cols-2 gap-4">
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
                </div>

                {/* Pickup Route & Vehicle Row */}
                <div className="grid grid-cols-2 gap-4">
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
                            onChange={setRouteId}
                            placeholder="Select route..."
                        />
                    </div>
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
                            onChange={setVehicleId}
                            placeholder="Select vehicle..."
                        />
                    </div>
                </div>

                {/* Driver & Guide Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                            Driver
                        </label>
                        <GlassCombobox
                            options={[
                                { value: "", label: "No driver" },
                                ...drivers.map(s => ({ value: s.id, label: s.name }))
                            ]}
                            value={driverId}
                            onChange={setDriverId}
                            placeholder="Select driver..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                            Guide
                        </label>
                        <GlassCombobox
                            options={[
                                { value: "", label: "No guide" },
                                ...guides.map(s => ({ value: s.id, label: s.name }))
                            ]}
                            value={guideId}
                            onChange={setGuideId}
                            placeholder="Select guide..."
                        />
                    </div>
                </div>

                {/* Pricing Schedule & Rate Tier Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                            Pricing Schedule
                        </label>
                        <GlassCombobox
                            options={[
                                { value: "", label: "No schedule" },
                                ...pricingSchedules.map(p => ({ value: p.id, label: p.name }))
                            ]}
                            value={pricingScheduleId}
                            onChange={setPricingScheduleId}
                            placeholder="Select pricing..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                            Rate Tier
                        </label>
                        <GlassCombobox
                            options={tiers.map(t => ({ value: t, label: t }))}
                            value={rateTier}
                            onChange={setRateTier}
                            placeholder="Select tier..."
                        />
                    </div>
                </div>

                {/* Booking Options Schedule & Variation Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                            Booking Options
                        </label>
                        <GlassCombobox
                            options={[
                                { value: "", label: "No options" },
                                ...bookingOptionSchedules.map(b => ({ value: b.id, label: b.name }))
                            ]}
                            value={bookingOptionScheduleId}
                            onChange={setBookingOptionScheduleId}
                            placeholder="Select options..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                            Options Variation
                        </label>
                        <GlassCombobox
                            options={[
                                { value: "retail", label: "Retail" },
                                { value: "online", label: "Online" },
                                { value: "special", label: "Special" },
                                { value: "custom", label: "Custom" }
                            ]}
                            value={optionVariation}
                            onChange={setOptionVariation}
                            placeholder="Select variation..."
                        />
                    </div>
                </div>

                {/* Private Note - at bottom */}
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
            </div>
        </div>
    );
}
