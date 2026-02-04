"use client";

import { useEffect, useState } from "react";
import { BookingOption, BookingOptionSchedule } from "@/features/bookings/types";
import { Availability } from "@/features/availability/components/availability-list-table";
import { Combobox } from "@/components/ui/combobox";
import { Settings, Plus, Minus, MapPin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/auth-context";

interface ColumnTwoProps {
    availability: Availability;
    // Options
    optionSchedules: BookingOptionSchedule[];
    selectedOptionScheduleId: string | null;
    setSelectedOptionScheduleId: (id: string | null) => void;
    selectedVariation: string;
    setSelectedVariation: (v: string) => void;
    currentOptions: BookingOption[];
    // State for selected values
    optionValues: Record<string, any>;
    setOptionValues: (values: Record<string, any>) => void;
}

const inputStyles = "w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none transition-colors placeholder:text-muted-foreground/50";

export function ColumnTwo({
    availability,
    optionSchedules, selectedOptionScheduleId, setSelectedOptionScheduleId,
    selectedVariation, setSelectedVariation,
    currentOptions,
    optionValues, setOptionValues
}: ColumnTwoProps) {
    const { effectiveOrganizationId } = useAuth();

    // --- Smart Pickup Logic ---
    const [hotels, setHotels] = useState<any[]>([]);;
    const [pickupPoints, setPickupPoints] = useState<any[]>([]);
    const [scheduleStops, setScheduleStops] = useState<any[]>([]);
    const [isLoadingSmartData, setIsLoadingSmartData] = useState(false);

    useEffect(() => {
        if (!effectiveOrganizationId) return;

        const fetchSmartData = async () => {
            setIsLoadingSmartData(true);
            console.log("DEBUG: fetchSmartData started. RouteID:", availability.transportation_route_id, "OrgID:", effectiveOrganizationId);

            try {
                // 1. Fetch Hotels
                const { data: hotelsData } = await supabase.from('hotels' as any).select('id, name, pickup_point_id').eq('organization_id', effectiveOrganizationId).order('name');
                if (hotelsData) {
                    setHotels(hotelsData);
                    console.log("DEBUG: Hotels fetched:", hotelsData.length);
                }

                // 2. Fetch Pickup Points
                const { data: ppData } = await supabase.from('pickup_points' as any).select('id, name, map_link').eq('organization_id', effectiveOrganizationId);
                if (ppData) {
                    setPickupPoints(ppData);
                    console.log("DEBUG: PickupPoints fetched:", ppData.length);
                }

                // 3. Fetch Schedule Stops if route exists
                if (availability.transportation_route_id) {
                    console.log("DEBUG: Fetching stops for schedule:", availability.transportation_route_id);
                    const { data: stopsData, error: stopsError } = await supabase
                        .from('schedule_stops' as any)
                        .select('pickup_point_id, pickup_time')
                        .eq('organization_id', effectiveOrganizationId)
                        .eq('schedule_id', availability.transportation_route_id);

                    if (stopsError) console.error("DEBUG: Error fetching stops:", stopsError);
                    if (stopsData) {
                        setScheduleStops(stopsData);
                        console.log("DEBUG: ScheduleStops fetched:", stopsData.length, stopsData);
                    }
                } else {
                    console.warn("DEBUG: No transportation_route_id in availability!");
                    setScheduleStops([]);
                }
            } catch (err) {
                console.error("Error fetching smart pickup data", err);
            } finally {
                setIsLoadingSmartData(false);
            }
        };

        fetchSmartData();
    }, [availability.transportation_route_id, effectiveOrganizationId]);


    const resolvePickupDetails = (hotelId: string) => {
        console.log("DEBUG: resolvePickupDetails called", { hotelId, scheduleStopsCount: scheduleStops.length });
        if (!hotelId) return null;
        const hotel = hotels.find(h => h.id === hotelId);
        if (!hotel || !hotel.pickup_point_id) {
            console.log("DEBUG: Hotel not found or no pickup_point_id", { hotel });
            return null;
        }

        const pickupPoint = pickupPoints.find(p => p.id === hotel.pickup_point_id);
        const stop = scheduleStops.find(s => s.pickup_point_id === hotel.pickup_point_id);

        console.log("DEBUG: Pickup resolution", {
            hotel_pickup_point_id: hotel.pickup_point_id,
            pickupPointName: pickupPoint?.name,
            stopFound: !!stop,
            stopTime: stop?.pickup_time,
            allStops: scheduleStops.map(s => ({ pp: s.pickup_point_id, time: s.pickup_time }))
        });

        return {
            locationName: pickupPoint?.name || "Unknown Location",
            mapLink: pickupPoint?.map_link,
            time: stop?.pickup_time || "Not Scheduled"
        };
    };

    // --- Standard Logic ---

    // Handle value change for an option
    const handleValueChange = (optionId: string, value: any) => {
        setOptionValues({ ...optionValues, [optionId]: value });
    };

    // Get current option schedule
    const currentSchedule = optionSchedules.find(s => s.id === selectedOptionScheduleId);
    const variations = ['retail', 'online'];
    const currentConfig = selectedVariation === 'retail' ? currentSchedule?.config_retail : currentSchedule?.config_online;

    // Match field IDs from config to actual option definitions
    const resolvedFields: BookingOption[] = [];
    if (currentConfig && Array.isArray(currentConfig)) {
        currentConfig.forEach((cfg: any) => {
            const match = currentOptions.find(opt => opt.id === cfg.field_id);
            if (match) {
                resolvedFields.push({ ...match, required: cfg.required ?? false });
            }
        });
    }

    return (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Settings size={14} />
                <span className="text-xs font-medium uppercase tracking-wider">Options & Notes</span>
            </div>

            {/* Option Schedule & Variation Selector */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Option Schedule</span>
                    <Combobox
                        value={selectedOptionScheduleId || ""}
                        onChange={(val) => setSelectedOptionScheduleId(val || null)}
                        options={optionSchedules.map(s => ({ value: s.id, label: s.name + (s.is_default ? " (Default)" : "") }))}
                        placeholder="Select schedule..."
                    />
                </div>
                <div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Variation</span>
                    <Combobox
                        value={selectedVariation}
                        onChange={setSelectedVariation}
                        options={variations.map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) + (v === 'retail' ? ' (Default)' : '') }))}
                    />
                </div>
            </div>

            {/* Dynamic Fields */}
            {resolvedFields.map((opt) => {
                const optId = opt.id || opt.field_id;
                const currentValue = optionValues[optId];

                // --- SMART PICKUP FIELD ---
                if (opt.type === 'smart_pickup') {
                    const pickupDetails = currentValue ? resolvePickupDetails(currentValue) : null;
                    return (
                        <div key={optId} className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-foreground">{opt.label}</span>
                                {opt.required && <span className="text-[10px] bg-cyan-600/30 text-cyan-400 px-1.5 py-0.5 rounded">Required</span>}
                            </div>
                            <Combobox
                                value={currentValue || ""}
                                onChange={(val) => handleValueChange(optId, val)}
                                options={[
                                    ...hotels.map(h => ({ value: h.id, label: h.name })),
                                    { value: 'self_drive', label: 'Self Drive' }
                                ]}
                                placeholder={isLoadingSmartData ? "Loading hotels..." : "Select hotel..."}
                            />
                            {pickupDetails && currentValue !== 'self_drive' && (
                                <div className="mt-2 p-2 bg-card/50 rounded border border-primary/20">
                                    <div className="flex items-start gap-2">
                                        <MapPin size={14} className="text-primary mt-0.5 shrink-0" />
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-medium text-primary uppercase tracking-wider">Pickup Location</p>
                                            <p className="text-sm font-medium text-foreground">{pickupDetails.locationName}</p>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "text-xs px-2 py-0.5 rounded",
                                                    pickupDetails.time === "Not Scheduled"
                                                        ? "bg-muted text-muted-foreground"
                                                        : "bg-primary/20 text-primary"
                                                )}>
                                                    {pickupDetails.time}
                                                </span>
                                                {pickupDetails.mapLink && (
                                                    <a href={pickupDetails.mapLink} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                                                        Map <ExternalLink size={10} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                }

                // --- HEADER (display-only) ---
                if (opt.type === 'header') {
                    return (
                        <div key={optId} className="pt-2">
                            <p className="text-sm font-semibold text-primary uppercase tracking-wide">{opt.label}</p>
                        </div>
                    );
                }

                // --- SELECT ---
                if (opt.type === 'select') {
                    const selectOptions = Array.isArray(opt.options) ? opt.options.map((o: any) => ({
                        value: typeof o === 'object' ? (o.value || o.label) : o,
                        label: typeof o === 'object' ? o.label : o
                    })) : [];
                    return (
                        <div key={optId} className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-foreground">{opt.label}</span>
                                {opt.required && <span className="text-[10px] bg-cyan-600/30 text-cyan-400 px-1.5 py-0.5 rounded">Required</span>}
                            </div>
                            <Combobox
                                value={currentValue || ""}
                                onChange={(val) => handleValueChange(optId, val)}
                                options={selectOptions}
                                placeholder={`Select ${opt.label}...`}
                            />
                        </div>
                    );
                }

                // --- QUANTITY ---
                if (opt.type === 'quantity') {
                    const qty = typeof currentValue === 'number' ? currentValue : 0;
                    return (
                        <div key={optId} className="p-3 bg-muted/30 rounded-lg border border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-foreground">{opt.label}</span>
                                {opt.required && <span className="text-[10px] bg-cyan-600/30 text-cyan-400 px-1.5 py-0.5 rounded">Required</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleValueChange(optId, Math.max(0, qty - 1))} className="w-7 h-7 rounded bg-muted hover:bg-muted-foreground/20 flex items-center justify-center"><Minus size={14} /></button>
                                <span className="w-8 text-center text-sm font-medium">{qty}</span>
                                <button onClick={() => handleValueChange(optId, qty + 1)} className="w-7 h-7 rounded bg-muted hover:bg-muted-foreground/20 flex items-center justify-center"><Plus size={14} /></button>
                            </div>
                        </div>
                    );
                }

                // --- CHECKBOX ---
                if (opt.type === 'checkbox') {
                    const checkOptions = Array.isArray(opt.options) ? opt.options : [];
                    const selectedSet = new Set(Array.isArray(currentValue) ? currentValue : []);
                    return (
                        <div key={optId} className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-foreground">{opt.label}</span>
                                {opt.required && <span className="text-[10px] bg-cyan-600/30 text-cyan-400 px-1.5 py-0.5 rounded">Required</span>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {checkOptions.map((chk: any, idx: number) => {
                                    const val = typeof chk === 'object' ? (chk.value || chk.label) : chk;
                                    const label = typeof chk === 'object' ? chk.label : chk;
                                    const isChecked = selectedSet.has(val);
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                const newSet = new Set(selectedSet);
                                                isChecked ? newSet.delete(val) : newSet.add(val);
                                                handleValueChange(optId, Array.from(newSet));
                                            }}
                                            className={cn(
                                                "text-xs px-2 py-1 rounded border transition-colors",
                                                isChecked ? "bg-primary/20 border-primary text-primary" : "bg-muted/50 border-border text-muted-foreground hover:border-primary/50"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                }

                // --- TEXTAREA ---
                if (opt.type === 'textarea') {
                    return (
                        <div key={optId} className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-1">
                            <span className="text-xs font-medium text-foreground">{opt.label}</span>
                            <textarea
                                value={currentValue || ""}
                                onChange={(e) => handleValueChange(optId, e.target.value)}
                                rows={3}
                                className={inputStyles}
                                placeholder={`Enter ${opt.label.toLowerCase()}...`}
                            />
                        </div>
                    );
                }

                // --- DATE ---
                if (opt.type === 'date') {
                    return (
                        <div key={optId} className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-foreground">{opt.label}</span>
                                {opt.required && <span className="text-[10px] bg-cyan-600/30 text-cyan-400 px-1.5 py-0.5 rounded">Required</span>}
                            </div>
                            <input
                                type="date"
                                value={currentValue || ""}
                                onChange={(e) => handleValueChange(optId, e.target.value)}
                                className={inputStyles}
                            />
                        </div>
                    );
                }

                // --- DEFAULT (text) ---
                return (
                    <div key={optId} className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground">{opt.label}</span>
                            {opt.required && <span className="text-[10px] bg-cyan-600/30 text-cyan-400 px-1.5 py-0.5 rounded">Required</span>}
                        </div>
                        <input
                            type="text"
                            value={currentValue || ""}
                            onChange={(e) => handleValueChange(optId, e.target.value)}
                            className={inputStyles}
                            placeholder={`Enter ${opt.label.toLowerCase()}...`}
                        />
                    </div>
                );
            })}
        </div>
    );
}
