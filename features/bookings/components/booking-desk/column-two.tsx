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
                    // Assumption: route_id maps to schedule_id
                    const { data: stopsData, error: stopsError } = await supabase
                        .from('schedule_stops' as any)
                        .select('pickup_point_id, pickup_time')
                        .eq('organization_id', effectiveOrganizationId) // Robustness
                        .eq('schedule_id', availability.transportation_route_id);

                    if (stopsError) console.error("DEBUG: Error fetching stops:", stopsError);
                    if (stopsData) {
                        setScheduleStops(stopsData);
                        console.log("DEBUG: ScheduleStops fetched:", stopsData.length, stopsData);
                    }
                } else {
                    console.warn("DEBUG: No transportation_route_id in availability!");
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
        if (!hotelId) return null;
        const hotel = hotels.find(h => h.id === hotelId);
        if (!hotel || !hotel.pickup_point_id) {
            console.log("DEBUG: Hotel not found or no pickup_point_id. HotelID:", hotelId, "Found:", !!hotel);
            return null;
        }

        const pickupPoint = pickupPoints.find(p => p.id === hotel.pickup_point_id);
        const stop = scheduleStops.find(s => s.pickup_point_id === hotel.pickup_point_id);

        if (!stop) {
            console.log("DEBUG: Stop not found for hotel/pp.", "Hotel:", hotel.name, "PP_ID:", hotel.pickup_point_id, "Available Stops:", scheduleStops.length);
        }

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
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                            <div className="mt-0.5 text-primary flex-shrink-0">
                                <MapPin size={16} />
                            </div>
                            <div className="space-y-1 min-w-0">
                                <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Pickup Location</div>
                                <div className="text-sm text-foreground font-medium truncate">{pickupDetails.locationName}</div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="bg-background/80 px-1.5 py-0.5 rounded text-foreground border border-border">{pickupDetails.time}</span>
                                    {pickupDetails.mapLink && (
                                        <a
                                            href={pickupDetails.mapLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1 hover:text-primary transition-colors"
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
                                            ? "bg-primary/10 border-primary/50 text-primary"
                                            : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
                                    )}
                                >
                                    <div className={cn(
                                        "w-4 h-4 border flex items-center justify-center flex-shrink-0",
                                        isMulti ? "rounded" : "rounded-full",
                                        isSelected ? "border-primary bg-primary" : "border-border"
                                    )}>
                                        {isSelected && (
                                            <div className={cn(
                                                "bg-primary-foreground",
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
                            className="p-2 bg-muted/50 border border-border rounded-lg hover:border-primary/50 transition-colors"
                        >
                            <Minus size={14} className="text-muted-foreground" />
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
                            className="p-2 bg-muted/50 border border-border rounded-lg hover:border-primary/50 transition-colors"
                        >
                            <Plus size={14} className="text-muted-foreground" />
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
            <div className="shrink-0 flex items-center gap-2 px-6 py-4 bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-10">
                <Settings size={16} className="text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Options & Notes</span>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Controls */}
                <div className="px-6 py-6 grid grid-cols-2 gap-4 shrink-0 border-b border-border">
                    {/* Schedule Selector */}
                    <div className={cn("space-y-1.5", !selectedOptionScheduleId ? "col-span-2" : "col-span-1")}>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Option Schedule</label>
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
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Variation</label>
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
                        <div className="text-muted-foreground text-xs italic p-2 border border-dashed border-border rounded">
                            No options configured for this variation.
                        </div>
                    )}

                    {currentOptions.map(opt => {
                        const optId = opt.id || opt.field_id || String(Math.random());

                        // Special Handling: Section Headers
                        if (opt.type === 'header') {
                            return (
                                <div key={optId} className="pt-4 pb-2">
                                    <h4 className="text-sm font-bold text-primary uppercase tracking-widest border-b border-primary/30 pb-1 mb-1">
                                        {opt.label}
                                    </h4>
                                    {opt.description && (
                                        <p className="text-xs text-muted-foreground italic">
                                            {opt.description}
                                        </p>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <div key={optId} className="p-3 bg-card border border-border rounded-lg hover:border-primary/20 transition-colors shadow-sm">
                                {/* Label and Price */}
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="text-sm font-medium text-foreground flex items-center gap-2">
                                            {opt.label || "Unnamed Option"}
                                            {opt.required && (
                                                <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">Required</span>
                                            )}
                                        </div>
                                        {opt.description && (
                                            <div className="text-xs text-muted-foreground mt-0.5">{opt.description}</div>
                                        )}
                                    </div>
                                    {opt.price > 0 && (
                                        <div className="text-sm font-semibold text-primary">
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
