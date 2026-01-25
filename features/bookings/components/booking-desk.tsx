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
    onSuccess?: () => void; // Called after successful save to refresh calendar
    availability: Availability | null;
    editingBookingId?: string | null; // If set, we're editing an existing booking
}

export function BookingDesk({ isOpen, onClose, onSuccess, availability, editingBookingId }: BookingDeskProps) {
    const isEditMode = !!editingBookingId;
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
    const [optionValues, setOptionValues] = useState<Record<string, any>>({}); // Option field values

    // Selections
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
    const [selectedTier, setSelectedTier] = useState<string>("Retail");

    // Pax: { [customer_type_id]: count }
    const [paxCounts, setPaxCounts] = useState<Record<string, number>>({});
    const [pendingPaxCount, setPendingPaxCount] = useState<number | null>(null); // For edit mode when no pax_breakdown

    // Custom Fields Cache
    const [customFieldsCache, setCustomFieldsCache] = useState<Record<string, any>>({});

    const [isSaving, setIsSaving] = useState(false);

    const [paymentState, setPaymentState] = useState<any>({
        status: 'paid_full',
        method: 'credit_card',
        amount: 0 // Will auto-update in ColumnThree based on total
    });
    const [grandTotal, setGrandTotal] = useState(0);

    // --- Effects ---

    // 1. Init from Availability & Fetch Lists
    useEffect(() => {
        if (!isOpen || !availability) return;

        // Reset State only for NEW bookings (not edit mode)
        // In edit mode, we'll populate from the fetched booking data
        if (!editingBookingId) {
            setSelectedCustomer(null);
            setNotes("");
            setPaxCounts({});
            setOptionValues({});
        }
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

            // Custom Fields for Options
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

            // EDIT MODE: Fetch existing booking data
            if (editingBookingId) {
                console.log("DEBUG: Edit mode - fetching booking:", editingBookingId);
                const { data: bookingData, error: bookingError } = await supabase
                    .from('bookings' as any)
                    .select('*, customers(id, name, email)')
                    .eq('id', editingBookingId)
                    .single();

                if (bookingError) {
                    console.error("DEBUG: Error fetching booking:", bookingError);
                } else if (bookingData) {
                    const booking = bookingData as any; // Type cast for flexibility
                    console.log("DEBUG: Loaded booking data:", booking);

                    // Populate customer
                    if (booking.customers) {
                        setSelectedCustomer(booking.customers as Customer);
                    }

                    // Populate pax breakdown (or fallback to simple pax_count)
                    if (booking.pax_breakdown && Object.keys(booking.pax_breakdown).length > 0) {
                        console.log("DEBUG: Using pax_breakdown:", booking.pax_breakdown);
                        setPaxCounts(booking.pax_breakdown);
                    } else if (booking.pax_count && booking.pax_count > 0) {
                        // Store pending pax count - will be mapped when rates load
                        console.log("DEBUG: Setting pending pax_count:", booking.pax_count);
                        setPendingPaxCount(booking.pax_count);
                    }

                    // Populate notes
                    if (booking.notes) {
                        setNotes(booking.notes);
                    }

                    // Populate option values
                    if (booking.option_values) {
                        setOptionValues(booking.option_values);
                    }

                    // Populate payment state
                    setPaymentState({
                        status: booking.payment_status || 'paid_full',
                        method: booking.payment_method || 'credit_card',
                        amount: booking.amount_paid || 0,
                        overrideTotal: booking.total_amount,
                        promoCode: booking.promo_code
                    });
                }
            }
        };
        fetchData();
    }, [isOpen, availability, editingBookingId]);

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

    // 3. Map pendingPaxCount to first customer type when rates become available
    useEffect(() => {
        if (pendingPaxCount !== null && pendingPaxCount > 0 && rates.length > 0) {
            // Find rates for the selected tier
            const tieredRates = rates.filter(r => r.tier === selectedTier);
            if (tieredRates.length > 0) {
                const firstTypeId = tieredRates[0].customer_type_id;
                console.log("DEBUG: Mapping pendingPaxCount to type:", firstTypeId, "count:", pendingPaxCount);
                setPaxCounts({ [firstTypeId]: pendingPaxCount });
                setPendingPaxCount(null); // Clear pending once mapped
            }
        }
    }, [pendingPaxCount, rates, selectedTier]);

    // Handle New Customer Quick Add
    const handleCustomerCreated = (newCustomer: Customer) => {
        setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedCustomer(newCustomer);
    };

    const handleCustomerUpdated = (updatedCustomer: Customer) => {
        // Update list
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c).sort((a, b) => a.name.localeCompare(b.name)));
        // Update selection if it matches
        if (selectedCustomer?.id === updatedCustomer.id) {
            setSelectedCustomer(updatedCustomer);
        }
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
            const bookingData = {
                availability_id: availability.id,
                customer_id: selectedCustomer.id,
                status: 'confirmed',
                pax_count: totalPax,
                pax_breakdown: paxCounts, // JSONB column
                option_values: optionValues, // Dynamic Options
                notes: notes,
                payment_status: paymentState.status,
                payment_method: paymentState.method,
                amount_paid: paymentState.amount || 0,
                total_amount: grandTotal || paymentState.overrideTotal || 0,
                promo_code: paymentState.promoCode,
                payment_details: {} // Placeholder for tokens
            };

            let error;
            if (editingBookingId) {
                // UPDATE existing booking
                console.log("DEBUG: Updating booking:", editingBookingId);
                const result = await supabase
                    .from('bookings' as any)
                    .update(bookingData)
                    .eq('id', editingBookingId);
                error = result.error;
            } else {
                // INSERT new booking
                console.log("DEBUG: Creating new booking");
                const result = await supabase.from('bookings' as any).insert(bookingData);
                error = result.error;
            }

            if (error) throw error;

            console.log("PAYMENT PROCESSED:", paymentState); // Mock log

            toast.success(editingBookingId ? "Booking updated successfully!" : "Booking created successfully!");
            // Close panel and trigger calendar refresh
            onClose();
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error(editingBookingId ? "Error updating booking:" : "Error creating booking:", err);
            toast.error(err.message || (editingBookingId ? "Failed to update booking." : "Failed to create booking."));
            setIsSaving(false);
        }
    };

    // Delete booking handler
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!editingBookingId) return;

        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('bookings' as any)
                .delete()
                .eq('id', editingBookingId);

            if (error) throw error;

            toast.success("Booking deleted successfully!");
            setShowDeleteConfirm(false);
            onClose();
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error("Error deleting booking:", err);
            toast.error(err.message || "Failed to delete booking.");
            setIsDeleting(false);
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
            title={isEditMode ? "Edit Booking" : "Booking Desk"}
            description={isEditMode
                ? `Editing booking for ${selectedCustomer?.name || 'Customer'}`
                : `Create a new booking for ${(() => {
                    const [y, m, d] = availability.start_date.split('-');
                    return `${m}-${d}-${y}`;
                })()}`}
            width="w-[90vw] max-w-[90vw]"
            contentClassName="p-0"
        >
            <div className="h-full grid grid-cols-1 lg:grid-cols-[20fr_35fr_25fr_20fr] gap-6 p-6 overflow-hidden">

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
                        onCustomerUpdated={handleCustomerUpdated}
                    />
                </div>

                {/* COLUMN 2: Options & Notes */}
                <div className="h-full flex flex-col overflow-y-auto border-r border-zinc-800 pr-6">
                    <ColumnTwo
                        availability={availability}
                        optionSchedules={optionSchedules}
                        selectedOptionScheduleId={selectedOptionScheduleId}
                        setSelectedOptionScheduleId={setSelectedOptionScheduleId}
                        selectedVariation={selectedOptionVariation}
                        setSelectedVariation={setSelectedOptionVariation}
                        currentOptions={currentOptionsList}
                        optionValues={optionValues}
                        setOptionValues={setOptionValues}
                    />
                </div>

                {/* COLUMN 3: Payment */}
                <div className="h-full flex flex-col overflow-y-auto border-r border-zinc-800 pr-6">
                    <ColumnThree
                        currentRates={currentRates}
                        paxCounts={paxCounts}
                        paymentState={paymentState}
                        setPaymentState={setPaymentState}
                        setGrandTotal={setGrandTotal}
                    />
                </div>

                {/* COLUMN 4: Submit */}
                <div className="h-full flex flex-col overflow-y-auto">
                    <ColumnFour
                        onSave={handleSave}
                        isSaving={isSaving}
                        canSave={canSave}
                        isEditMode={isEditMode}
                        onDelete={handleDelete}
                        isDeleting={isDeleting}
                    />
                </div>

            </div>
        </SidePanel>
    );
}
