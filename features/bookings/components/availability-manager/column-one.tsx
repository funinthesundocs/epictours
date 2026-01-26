"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Availability } from "@/features/availability/components/availability-list-table";
import { Settings } from "lucide-react";
import { GlassCombobox } from "@/components/ui/glass-combobox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";

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
        <div className="flex flex-col h-full bg-[#0b1115]">
            {/* Fixed Header */}
            <div className="shrink-0 px-6 py-4 bg-white/5 backdrop-blur-md border-b border-white/5 sticky top-0 z-10 space-y-4">
                <div className="flex flex-col gap-0.5">
                    <div className="text-sm font-bold text-white uppercase tracking-wider truncate" title={availability.experience_name || ""}>
                        {availability.experience_name || "Unknown Experience"}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                        {availability.id}
                    </div>
                </div>

                {/* Session Details Card (Time/Capacity) */}
                <div className="space-y-3">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Session Details</div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Time</div>
                            <div className="text-white font-medium">
                                {formatTime(availability.start_time)}
                            </div>
                        </div>
                        <div>
                            <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Date</div>
                            <div className="text-white font-medium">
                                {formatDate(availability.start_date)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transportation and Staff */}
                <div className="space-y-3 border-t border-white/5 pt-4">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Transportation & Staff</div>
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
                    <div className="grid grid-cols-2 gap-4">
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

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-0 space-y-0 custom-scrollbar animate-in fade-in slide-in-from-left-4 duration-500">



                {/* Quick Settings Header - Sticky */}
                <div className="px-6 py-3 border-b border-white/5 bg-black/40 backdrop-blur-sm sticky top-0 z-10 w-full mb-6 relative">
                    <div className="text-base font-medium text-zinc-400 flex items-center gap-2">
                        <Settings size={18} className="text-cyan-500" />
                        Quick Settings
                    </div>
                </div>

                <div className="px-6 pb-6 space-y-4">

                    {/* Time & Capacity Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                                Start Time
                            </Label>
                            <TimePicker
                                value={startTime}
                                onChange={(val) => setStartTime(val)}
                                placeholder="Select time"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                                Max Capacity
                            </Label>
                            <Input
                                type="number"
                                value={maxCapacity}
                                onChange={(e) => setMaxCapacity(e.target.value)}
                                min="0"
                            />
                        </div>
                    </div>

                    {/* Pickup Route & Vehicle Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                                Pickup Route
                            </Label>
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
                            <Label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                                Vehicle
                            </Label>
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
                            <Label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                                Driver
                            </Label>
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
                            <Label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                                Guide
                            </Label>
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
                            <Label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                                Pricing Schedule
                            </Label>
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
                            <Label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                                Rate Tier
                            </Label>
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
                            <Label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                                Booking Options
                            </Label>
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
                            <Label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                                Options Variation
                            </Label>
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
                        <Label className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                            Private Note
                        </Label>
                        <Textarea
                            value={headline}
                            onChange={(e) => setHeadline(e.target.value)}
                            className="bg-black/20 border-white/10 text-white placeholder:text-zinc-600 focus-visible:border-cyan-500/50 min-h-[80px]"
                            placeholder="Internal note for staff..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
