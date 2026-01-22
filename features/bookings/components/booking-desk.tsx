"use client";

import { useEffect, useState } from "react";
import { SidePanel } from "@/components/ui/side-panel";
import { Availability } from "@/features/availability/components/availability-list-table";
import { ColumnOne } from "./booking-desk/column-one";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ColumnTwo } from "./booking-desk/column-two";
import { ColumnThree } from "./booking-desk/column-three";
import { ColumnFour } from "./booking-desk/column-four";
import {
    Customer, PricingSchedule, PricingTier, PricingRate,
    BookingOption, BookingOptionSchedule
} from "@/features/bookings/types";

interface BookingDeskProps {
    isOpen: boolean;
    onClose: () => void;
    availability: Availability | null;
}

export function BookingDesk({ isOpen, onClose, availability }: BookingDeskProps) {
    // --- State ---
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [notes, setNotes] = useState("");

    // Data Lists
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [schedules, setSchedules] = useState<PricingSchedule[]>([]);
    const [tiers, setTiers] = useState<PricingTier[]>([]);
    const [rates, setRates] = useState<PricingRate[]>([]); // Current schedule's rates

    // Booking Options Data
    const [optionSchedules, setOptionSchedules] = useState<BookingOptionSchedule[]>([]);
    const [selectedOptionScheduleId, setSelectedOptionScheduleId] = useState<string | null>(null);
    const [selectedOptionVariation, setSelectedOptionVariation] = useState<string>("retail");
    const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({}); // id -> qty

    // Selections
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
    const [selectedTier, setSelectedTier] = useState<string>("Retail");

    // Pax: { [customer_type_id]: count }
    const [paxCounts, setPaxCounts] = useState<Record<string, number>>({});

    // Custom Fields Cache
    const [customFieldsCache, setCustomFieldsCache] = useState<Record<string, any>>({});

    const [isSaving, setIsSaving] = useState(false);

    // --- Effects ---

    // 1. Init from Availability & Fetch Lists
    useEffect(() => {
        if (!isOpen || !availability) return;

        // Reset State
        // Keep lists if already fetched? For simplicity, we can fetch again or cache.
        // Important: Reset inputs
        setSelectedCustomer(null);
        setNotes("");
        setPaxCounts({});
        setIsSaving(false);
        // Default Schedule
        if (availability.pricing_schedule_id) {
            setSelectedScheduleId(availability.pricing_schedule_id);
        }
        if (availability.booking_option_schedule_id) {
            setSelectedOptionScheduleId(availability.booking_option_schedule_id);
        }

        const fetchData = async () => {
            // Customers
            const { data: custData } = await supabase.from('customers' as any).select('id, name, email').order('name');
            if (custData) setCustomers(custData as unknown as Customer[]);

            // Schedules
            const { data: schedData } = await supabase.from('pricing_schedules' as any).select('id, name').order('name');
            if (schedData) setSchedules(schedData as unknown as PricingSchedule[]);

            // Tiers
            const { data: tierData } = await supabase.from('pricing_variations' as any).select('name, sort_order').order('sort_order');
            if (tierData) {
                const typedTiers = tierData as unknown as PricingTier[];
                setTiers(typedTiers);
                // Default Tier logic
                if (typedTiers.some(t => t.name === 'Retail')) setSelectedTier('Retail');
                else if (typedTiers.length > 0) setSelectedTier(typedTiers[0].name);
            }

            // Booking Option Schedules
            const { data: optSchedData } = await supabase.from('booking_option_schedules' as any).select('*').order('name');
            if (optSchedData) setOptionSchedules(optSchedData as unknown as BookingOptionSchedule[]);

            // Fetch Custom Fields for Options
            console.log("DEBUG: Fetching custom_field_definitions...");
            const { data: cfData, error: cfError } = await supabase.from('custom_field_definitions' as any).select('*');

            if (cfError) {
                console.error("DEBUG: Error fetching CFs:", cfError);
            } else {
                console.log("DEBUG: CF Data received:", cfData?.length);
                if (cfData) {
                    const map: Record<string, any> = {};
                    cfData.forEach((cf: any) => {
                        map[cf.id] = cf;
                        console.log("DEBUG: Caching CF:", cf.id, cf.label);
                    });
                    setCustomFieldsCache(map);
                }
            }
        };
        fetchData();
    }, [isOpen, availability]);

    // 2. Fetch Rates when Schedule Changes
    useEffect(() => {
        const fetchRates = async () => {
            if (!selectedScheduleId) {
                setRates([]);
                return;
            }

            const { data: rateData } = await supabase
                .from('pricing_rates' as any)
                .select('customer_type_id, price, tax_percentage, tier')
                .eq('schedule_id', selectedScheduleId);

            if (rateData) {
                // Enrich with Customer Type Names
                const { data: typeData } = await supabase.from('customer_types' as any).select('id, name');
                const typeMap = Object.fromEntries(typeData?.map((t: any) => [t.id, t.name]) || []);

                const typedRates = rateData as unknown as PricingRate[];
                const enrichedRates = typedRates.map(r => ({
                    ...r,
                    customer_type_name: typeMap[r.customer_type_id] || "Unknown Type"
                }));
                setRates(enrichedRates);
            } else {
                setRates([]);
            }
        };
        fetchRates();
    }, [selectedScheduleId]);

    // Handle New Customer Quick Add
    const handleCustomerCreated = (newCustomer: Customer) => {
        setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedCustomer(newCustomer);
    };

    const handleSave = async () => {
        if (!availability || !selectedCustomer) return;

        const totalPax = Object.values(paxCounts).reduce((a, b) => a + b, 0);
        if (totalPax === 0) {
            alert("Please add at least one passenger.");
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase.from('bookings' as any).insert({
                availability_id: availability.id,
                customer_id: selectedCustomer.id,
                status: 'confirmed',
                pax_count: totalPax,
                pax_breakdown: paxCounts, // JSONB column
                notes: notes
            });

            if (error) throw error;

            console.log("Booking created successfully!");
            // Hard refresh for now as requested by user workflow limits
            window.location.reload();
        } catch (err) {
            console.error("Error creating booking:", err);
            alert("Failed to create booking. Please try again.");
            setIsSaving(false);
        }
    };

    if (!availability) return null;

    // Derived: Current Rates for Tier (Shared with Col 1 & 3)
    const currentRates = rates.filter(r => r.tier === selectedTier);
    const totalPax = Object.values(paxCounts).reduce((a, b) => a + b, 0);
    const canSave = !!selectedCustomer && totalPax > 0;

    // Derived: Current Options
    // Derived: Current Options (Resolved)
    const currentOptionSchedule = optionSchedules.find(s => s.id === selectedOptionScheduleId);
    let rawOptions: BookingOption[] = [];

    if (currentOptionSchedule) {
        // Safe access to config properties
        const s = currentOptionSchedule as any;
        if (selectedOptionVariation === 'retail') rawOptions = s.config_retail || [];
        else if (selectedOptionVariation === 'online') rawOptions = s.config_online || [];
        else if (selectedOptionVariation === 'special') rawOptions = s.config_special || [];
        else if (selectedOptionVariation === 'custom') rawOptions = s.config_custom || [];
    }

    const currentOptionsList = rawOptions.map(opt => {
        // If it's a linked custom field
        if (opt.field_id && customFieldsCache[opt.field_id]) {
            const cf = customFieldsCache[opt.field_id];
            return {
                ...opt,
                label: cf.label,
                type: cf.type,
                options: cf.options,
                price: opt.price || 0
            };
        }
        return opt;
    });

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title="Booking Desk"
            description={`Create a new booking for ${availability.start_date}`}
            width="w-[85vw] max-w-[85vw]"
            contentClassName="p-0"
        >
            <div className="h-full grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 overflow-hidden">

                {/* COLUMN 1: Customer & Pax */}
                <div className="h-full flex flex-col overflow-y-auto border-r border-zinc-800 pr-6">
                    <ColumnOne
                        availability={availability}
                        customers={customers}
                        selectedCustomer={selectedCustomer}
                        setSelectedCustomer={setSelectedCustomer}
                        schedules={schedules}
                        selectedScheduleId={selectedScheduleId}
                        setSelectedScheduleId={setSelectedScheduleId}
                        tiers={tiers}
                        selectedTier={selectedTier}
                        setSelectedTier={setSelectedTier}
                        currentRates={currentRates}
                        paxCounts={paxCounts}
                        setPaxCounts={setPaxCounts}
                        onCustomerCreated={handleCustomerCreated}
                    />
                </div>

                {/* COLUMN 2: Options & Notes */}
                <div className="h-full flex flex-col overflow-y-auto border-r border-zinc-800 pr-6">
                    <ColumnTwo
                        optionSchedules={optionSchedules}
                        selectedOptionScheduleId={selectedOptionScheduleId}
                        setSelectedOptionScheduleId={setSelectedOptionScheduleId}
                        selectedVariation={selectedOptionVariation}
                        setSelectedVariation={setSelectedOptionVariation}
                        currentOptions={currentOptionsList}
                    />
                </div>

                {/* COLUMN 3: Payment */}
                <div className="h-full flex flex-col overflow-y-auto border-r border-zinc-800 pr-6">
                    <ColumnThree currentRates={currentRates} paxCounts={paxCounts} />
                </div>

                {/* COLUMN 4: Submit */}
                <div className="h-full flex flex-col overflow-y-auto">
                    <ColumnFour onSave={handleSave} isSaving={isSaving} canSave={canSave} />
                </div>

            </div>
        </SidePanel>
    );
}
