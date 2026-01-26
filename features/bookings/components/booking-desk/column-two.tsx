"use client";

import { useEffect, useState } from "react";
import { BookingOption, BookingOptionSchedule } from "@/features/bookings/types";
import { Availability } from "@/features/availability/components/availability-list-table";
import { Combobox } from "@/components/ui/combobox";
import { Settings, Plus, Minus, MapPin, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

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

const inputStyles = "w-full bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none transition-colors placeholder:text-zinc-600";

export function ColumnTwo({
    availability,
    optionSchedules, selectedOptionScheduleId, setSelectedOptionScheduleId,
    selectedVariation, setSelectedVariation,
    currentOptions,
    optionValues, setOptionValues
}: ColumnTwoProps) {

    // --- Smart Pickup Logic ---
    const [hotels, setHotels] = useState<any[]>([]);
    const [pickupPoints, setPickupPoints] = useState<any[]>([]);
    const [scheduleStops, setScheduleStops] = useState<any[]>([]);
    const [isLoadingSmartData, setIsLoadingSmartData] = useState(false);

    useEffect(() => {
        const fetchSmartData = async () => {
            setIsLoadingSmartData(true);
            try {
                // 1. Fetch Hotels
                const { data: hotelsData } = await supabase.from('hotels' as any).select('id, name, pickup_point_id').order('name');
                if (hotelsData) setHotels(hotelsData);

                // 2. Fetch Pickup Points
                const { data: ppData } = await supabase.from('pickup_points' as any).select('id, name, map_link');
                if (ppData) setPickupPoints(ppData);

                // 3. Fetch Schedule Stops if route exists
                if (availability.transportation_route_id) {
                    // Assumption: route_id maps to schedule_id
                    const { data: stopsData } = await supabase
                        .from('schedule_stops' as any)
                        .select('pickup_point_id, pickup_time')
                        .eq('schedule_id', availability.transportation_route_id);
                    if (stopsData) setScheduleStops(stopsData);
                }
            } catch (err) {
                console.error("Error fetching smart pickup data", err);
            } finally {
                setIsLoadingSmartData(false);
            }
        };

        fetchSmartData();
    }, [availability.transportation_route_id]);

    const resolvePickupDetails = (hotelId: string) => {
        if (!hotelId) return null;
        const hotel = hotels.find(h => h.id === hotelId);
        if (!hotel || !hotel.pickup_point_id) return null;

        const pickupPoint = pickupPoints.find(p => p.id === hotel.pickup_point_id);
        const stop = scheduleStops.find(s => s.pickup_point_id === hotel.pickup_point_id);

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

    // Render the appropriate input based on field type
    const renderFieldInput = (opt: BookingOption) => {
        const optId = opt.id || opt.field_id || String(Math.random());
        const currentValue = optionValues[optId];

        // inputStyles defined at top
        const selectClasses = cn(inputStyles, "appearance-none cursor-pointer");

        if (opt.type === 'smart_pickup') {
            const pickupDetails = resolvePickupDetails(currentValue);

            return (
                <div className="space-y-3">
                    <Combobox
                        value={currentValue || ""}
                        onChange={(val) => handleValueChange(optId, val)}
                        options={hotels.map(h => ({ label: h.name, value: h.id }))}
                        placeholder={isLoadingSmartData ? "Loading..." : "Select Pickup Hotel"}
                        inputClassName={inputStyles}
                        disabled={isLoadingSmartData}
                    />

                    {currentValue && pickupDetails && (
                        <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                            <div className="mt-0.5 text-cyan-500 flex-shrink-0">
                                <MapPin size={16} />
                            </div>
                            <div className="space-y-1 min-w-0">
                                <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Pickup Location</div>
                                <div className="text-sm text-zinc-200 font-medium truncate">{pickupDetails.locationName}</div>
                                <div className="flex items-center gap-3 text-xs text-zinc-400">
                                    <span className="bg-white/5 px-1.5 py-0.5 rounded text-white">{pickupDetails.time}</span>
                                    {pickupDetails.mapLink && (
                                        <a
                                            href={pickupDetails.mapLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
                                        >
                                            Map <ExternalLink size={10} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        switch (opt.type) {
            case 'select':
            case 'quantity':
                // Dropdown select
                return (
                    <Combobox
                        value={currentValue || ""}
                        onChange={(val) => handleValueChange(optId, val)}
                        options={opt.options?.map((o: any) => ({
                            label: o.label,
                            value: o.value
                        })) || []}
                        placeholder="-- Select --"
                        inputClassName={inputStyles}
                    />
                );

            case 'checkbox':
                // Determine if multi-select or single-select (radio)
                const isMulti = opt.options?.settings?.allow_multiselect;
                const selectedValues = Array.isArray(currentValue) ? currentValue : [];

                return (
                    <div className="flex flex-col gap-2">
                        {opt.options?.filter((o: any) => o.value !== undefined).map((o: any, i: number) => {
                            const isSelected = isMulti
                                ? selectedValues.includes(o.value)
                                : currentValue === o.value;

                            const handleClick = () => {
                                if (isMulti) {
                                    // Toggle in array
                                    const newValues = isSelected
                                        ? selectedValues.filter((v: string) => v !== o.value)
                                        : [...selectedValues, o.value];
                                    handleValueChange(optId, newValues);
                                } else {
                                    // Single select (radio behavior)
                                    handleValueChange(optId, o.value);
                                }
                            };

                            return (
                                <button
                                    key={o.value || i}
                                    type="button"
                                    onClick={handleClick}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg border text-left text-sm transition-colors",
                                        isSelected
                                            ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                                            : "bg-zinc-900/80 border-white/10 text-zinc-300 hover:border-white/20"
                                    )}
                                >
                                    <div className={cn(
                                        "w-4 h-4 border flex items-center justify-center flex-shrink-0",
                                        isMulti ? "rounded" : "rounded-full",
                                        isSelected ? "border-cyan-500 bg-cyan-500" : "border-white/20"
                                    )}>
                                        {isSelected && (
                                            <div className={cn(
                                                "bg-white",
                                                isMulti ? "w-2 h-2 rounded-sm" : "w-1.5 h-1.5 rounded-full"
                                            )} />
                                        )}
                                    </div>
                                    <span>{o.label}</span>
                                </button>
                            );
                        })}
                    </div>
                );

            case 'number':
                // Numeric stepper
                const numValue = Number(currentValue) || 0;
                return (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleValueChange(optId, Math.max(0, numValue - 1))}
                            className="p-2 bg-zinc-900/80 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
                        >
                            <Minus size={14} className="text-zinc-400" />
                        </button>
                        <input
                            type="number"
                            value={numValue}
                            onChange={(e) => handleValueChange(optId, Number(e.target.value) || 0)}
                            className={cn(inputStyles, "w-20 text-center")}
                            min={0}
                        />
                        <button
                            type="button"
                            onClick={() => handleValueChange(optId, numValue + 1)}
                            className="p-2 bg-zinc-900/80 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
                        >
                            <Plus size={14} className="text-zinc-400" />
                        </button>
                    </div>
                );

            case 'date':
                return (
                    <input
                        type="date"
                        value={currentValue || ""}
                        onChange={(e) => handleValueChange(optId, e.target.value)}
                        className={inputStyles}
                    />
                );

            case 'text':
            case 'textarea':
            default:
                // Text input
                if (opt.type === 'textarea') {
                    return (
                        <textarea
                            value={currentValue || ""}
                            onChange={(e) => handleValueChange(optId, e.target.value)}
                            placeholder="Enter details..."
                            className={cn(inputStyles, "min-h-[80px] resize-none")}
                        />
                    );
                }
                return (
                    <input
                        type="text"
                        value={currentValue || ""}
                        onChange={(e) => handleValueChange(optId, e.target.value)}
                        placeholder="Enter value..."
                        className={inputStyles}
                    />
                );
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
            {/* Header */}
            <div className="shrink-0 flex items-center gap-2 px-6 py-4 bg-white/5 backdrop-blur-md border-b border-white/5 sticky top-0 z-10">
                <Settings size={16} className="text-cyan-500" />
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Options & Notes</span>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Controls */}
                <div className="px-6 py-6 grid grid-cols-2 gap-4 shrink-0 border-b border-white/5">
                    {/* Schedule Selector */}
                    <div className={cn("space-y-1.5", !selectedOptionScheduleId ? "col-span-2" : "col-span-1")}>
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Option Schedule</label>
                        <div className="relative">
                            <Combobox
                                value={selectedOptionScheduleId || undefined}
                                onChange={(val) => setSelectedOptionScheduleId(val || null)}
                                options={optionSchedules.map(sch => ({
                                    label: sch.name + (sch.id === availability.booking_option_schedule_id ? " (Default)" : ""),
                                    value: sch.id
                                }))}
                                placeholder="-- No Options --"
                                inputClassName={inputStyles}
                            />
                        </div>
                    </div>

                    {/* Variation Selector (Only show if schedule selected) */}
                    {selectedOptionScheduleId && (
                        <div className="space-y-1.5 col-span-1">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Variation</label>
                            <div className="relative">
                                <Combobox
                                    value={selectedVariation}
                                    onChange={(val) => setSelectedVariation(val)}
                                    options={[
                                        { label: "Retail (Default)", value: "retail" },
                                        { label: "Online", value: "online" },
                                        { label: "Special", value: "special" },
                                        { label: "Custom", value: "custom" }
                                    ]}
                                    placeholder="Select variation..."
                                    inputClassName={inputStyles}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Options List */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3 custom-scrollbar">
                    {selectedOptionScheduleId && currentOptions.length === 0 && (
                        <div className="text-zinc-500 text-xs italic p-2 border border-dashed border-zinc-800 rounded">
                            No options configured for this variation.
                        </div>
                    )}

                    {currentOptions.map(opt => {
                        const optId = opt.id || opt.field_id || String(Math.random());

                        // Special Handling: Section Headers
                        if (opt.type === 'header') {
                            return (
                                <div key={optId} className="pt-4 pb-2">
                                    <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-widest border-b border-cyan-500/30 pb-1 mb-1">
                                        {opt.label}
                                    </h4>
                                    {opt.description && (
                                        <p className="text-xs text-zinc-500 italic">
                                            {opt.description}
                                        </p>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <div key={optId} className="p-3 bg-black/20 border border-white/10 rounded-lg hover:border-white/20 transition-colors">
                                {/* Label and Price */}
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="text-sm font-medium text-white flex items-center gap-2">
                                            {opt.label || "Unnamed Option"}
                                            {opt.required && (
                                                <span className="text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded">Required</span>
                                            )}
                                        </div>
                                        {opt.description && (
                                            <div className="text-xs text-zinc-500 mt-0.5">{opt.description}</div>
                                        )}
                                    </div>
                                    {opt.price > 0 && (
                                        <div className="text-sm font-semibold text-cyan-400">
                                            ${opt.price}
                                        </div>
                                    )}
                                </div>

                                {/* Field Input */}
                                {renderFieldInput(opt)}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
