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
import {
    Customer, PricingSchedule, PricingTier, PricingRate,
    BookingOption, BookingOptionSchedule
} from "@/features/bookings/types";
import { cn } from "@/lib/utils";
import { Trash2, Loader2, Save } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { format, startOfDay, endOfDay } from "date-fns";
import { useAuth } from "@/features/auth/auth-context";

interface BookingDeskProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void; // Called after successful save to refresh calendar
    availability: Availability | null;
    editingBookingId?: string | null; // If set, we're editing an existing booking
}

export function BookingDesk({ isOpen, onClose, onSuccess, availability, editingBookingId }: BookingDeskProps) {
    const { effectiveOrganizationId } = useAuth();
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
    const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);
    const [confirmationNumber, setConfirmationNumber] = useState<string | null>(null);

    // Snapshot Helper
    const getSnapshot = () => JSON.stringify({
        customer: selectedCustomer?.id,
        pax: paxCounts,
        notes,
        options: optionValues,
        payment: {
            status: paymentState.status,
            method: paymentState.method,
            amount: paymentState.amount,
            override: paymentState.overrideTotal,
            promo: paymentState.promoCode
        },
        schedule: selectedScheduleId,
        tier: selectedTier,
        optSchedule: selectedOptionScheduleId,
        optVariation: selectedOptionVariation
    });

    const [currentAvailability, setCurrentAvailability] = useState<Availability | null>(availability);

    // Sync state when prop changes
    useEffect(() => {
        setCurrentAvailability(availability);
    }, [availability]);

    const handleAvailabilityChange = (newAvailability: Availability) => {
        setCurrentAvailability(newAvailability);
        // Auto-update schedules if present in new availability
        if (newAvailability.pricing_schedule_id) {
            setSelectedScheduleId(newAvailability.pricing_schedule_id);
        }
        if (newAvailability.booking_option_schedule_id) {
            setSelectedOptionScheduleId(newAvailability.booking_option_schedule_id);
        }
    };

    // --- Effects ---

    // 1. Init from Availability & Fetch Lists
    useEffect(() => {
        // In edit mode, we can proceed without availability initially (booking data includes availability_id)
        // In create mode, we need the availability
        if (!isOpen) return;
        if (!currentAvailability && !editingBookingId) return;

        // Reset State only for NEW bookings (not edit mode)
        // In edit mode, we'll populate from the fetched booking data
        if (!editingBookingId) {
            setSelectedCustomer(null);
            setNotes("");
            setPaxCounts({});
            setOptionValues({});
            setConfirmationNumber(null);
        }
        setIsSaving(false);
        // Default Schedule (only if availability is present)
        if (currentAvailability?.pricing_schedule_id) {
            setSelectedScheduleId(currentAvailability.pricing_schedule_id);
        }
        if (currentAvailability?.booking_option_schedule_id) {
            setSelectedOptionScheduleId(currentAvailability.booking_option_schedule_id);
        }

        const fetchData = async () => {
            // Customers - only select id from customers, get name/email from joined users
            const { data: custData, error: custError } = await supabase
                .from('customers' as any)
                .select('id, user_id, user:users(id, name, email)')
                .eq('organization_id', effectiveOrganizationId) // Filter by Org
                .order('created_at', { ascending: false });

            if (custError) {
                console.error("Error fetching customers:", custError);
            }
            if (custData) {
                // Flatten user data - name/email come from the linked user
                const flattenedCustomers = (custData as any[])
                    .filter(c => c.user) // Only include customers with linked users
                    .map(c => ({
                        id: c.id,
                        name: c.user?.name || 'Unknown',
                        email: c.user?.email || ''
                    }));
                setCustomers(flattenedCustomers as unknown as Customer[]);
            }

            // Schedules
            const { data: schedData } = await supabase.from('pricing_schedules' as any).select('id, name').eq('organization_id', effectiveOrganizationId).order('name');
            if (schedData) setSchedules(schedData as unknown as PricingSchedule[]);

            // Tiers
            const { data: tierData } = await supabase.from('pricing_variations' as any).select('name, sort_order').eq('organization_id', effectiveOrganizationId).order('sort_order');
            if (tierData) {
                const typedTiers = tierData as unknown as PricingTier[];
                setTiers(typedTiers);
                // Default Tier logic
                if (typedTiers.some(t => t.name === 'Retail')) setSelectedTier('Retail');
                else if (typedTiers.length > 0) setSelectedTier(typedTiers[0].name);
            }

            // Booking Option Schedules
            const { data: optSchedData } = await supabase.from('booking_option_schedules' as any).select('*').eq('organization_id', effectiveOrganizationId).order('name');
            if (optSchedData) setOptionSchedules(optSchedData as unknown as BookingOptionSchedule[]);

            // Custom Fields for Options
            console.log("DEBUG: Fetching custom_field_definitions...");
            const { data: cfData, error: cfError } = await supabase.from('custom_field_definitions' as any).select('*').eq('organization_id', effectiveOrganizationId);

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
                    .select('*, customers(id, user:users(id, name, email)), availability:availabilities(id, experience_id, pricing_schedule_id, booking_option_schedule_id, transportation_route_id, start_date, start_time, max_capacity, experience:experiences(id, name, short_code), availability_assignments(transportation_route_id))')
                    .eq('id', editingBookingId)
                    .single();

                if (bookingError) {
                    console.error("DEBUG: Error fetching booking:", bookingError);
                } else if (bookingData) {
                    const booking = bookingData as any; // Type cast for flexibility
                    console.log("DEBUG: Loaded booking data:", booking);

                    // Load confirmation number if exists
                    if (booking.confirmation_number) {
                        setConfirmationNumber(booking.confirmation_number);
                    }

                    // Load availability data including pricing schedule
                    if (booking.availability) {
                        console.log("DEBUG: Setting availability from booking:", booking.availability);
                        const enrichedAvail = {
                            ...booking.availability,
                            experience_name: booking.availability.experience?.name || 'Unknown Experience',
                            experience_short_code: booking.availability.experience?.short_code || 'EXP',
                            transportation_route_id: booking.availability.availability_assignments?.[0]?.transportation_route_id || booking.availability.transportation_route_id
                        };
                        delete enrichedAvail.experience;
                        setCurrentAvailability(enrichedAvail);

                        // Set pricing schedule from availability
                        if (booking.availability.pricing_schedule_id) {
                            setSelectedScheduleId(booking.availability.pricing_schedule_id);
                        }
                        if (booking.availability.booking_option_schedule_id) {
                            setSelectedOptionScheduleId(booking.availability.booking_option_schedule_id);
                        }
                    }

                    let waitingForPaxMap = false;

                    // Populate customer - flatten user data
                    if (booking.customers?.user) {
                        setSelectedCustomer({
                            id: booking.customers.id,
                            name: booking.customers.user.name || 'Unknown',
                            email: booking.customers.user.email || ''
                        } as Customer);
                    }

                    // Populate pax breakdown (or fallback to simple pax_count)
                    // Handle both formats: object {typeId: count} or array [{name, type}...]
                    if (booking.pax_breakdown && !Array.isArray(booking.pax_breakdown) && Object.keys(booking.pax_breakdown).length > 0) {
                        // Valid object format - use directly
                        const isValidFormat = Object.values(booking.pax_breakdown).every(v => typeof v === 'number');
                        if (isValidFormat) {
                            console.log("DEBUG: Using pax_breakdown:", booking.pax_breakdown);
                            setPaxCounts(booking.pax_breakdown);
                        } else {
                            // Object but values aren't numbers - fallback to pax_count
                            console.log("DEBUG: pax_breakdown has invalid values, using pax_count");
                            setPendingPaxCount(booking.pax_count || 0);
                            waitingForPaxMap = true;
                        }
                    } else if (booking.pax_count && booking.pax_count > 0) {
                        // Array format or no breakdown - use pax_count
                        console.log("DEBUG: Setting pending pax_count:", booking.pax_count);
                        setPendingPaxCount(booking.pax_count);
                        waitingForPaxMap = true;
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

                    // Only set snapshot if we are NOT waiting for pax map
                    if (!waitingForPaxMap) {
                        setTimeout(() => setInitialSnapshot(getSnapshot()), 100);
                    }
                }
            } else {
                // CREATE MODE
                setTimeout(() => setInitialSnapshot(getSnapshot()), 500);
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
                const { data: typeData } = await supabase.from('customer_types' as any).select('id, name').eq('organization_id', effectiveOrganizationId);
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

                const newPaxCounts = { [firstTypeId]: pendingPaxCount };
                setPaxCounts(newPaxCounts);
                setPendingPaxCount(null); // Clear pending once mapped

                // Also update snapshot NOW because we skipped it earlier
                // We must construct it manually because state update is async
                if (!initialSnapshot) {
                    const snap = JSON.stringify({
                        customer: selectedCustomer?.id,
                        pax: newPaxCounts, // USE NEW VALUE
                        notes,
                        options: optionValues,
                        payment: {
                            status: paymentState.status,
                            method: paymentState.method,
                            amount: paymentState.amount,
                            override: paymentState.overrideTotal,
                            promo: paymentState.promoCode
                        },
                        schedule: selectedScheduleId,
                        tier: selectedTier,
                        optSchedule: selectedOptionScheduleId,
                        optVariation: selectedOptionVariation
                    });
                    console.log("DEBUG: Setting Delayed Initial Snapshot:", snap);
                    setInitialSnapshot(snap);
                }
            }
        }
    }, [pendingPaxCount, rates, selectedTier, selectedCustomer, notes, optionValues, paymentState, selectedScheduleId, selectedOptionScheduleId, selectedOptionVariation, initialSnapshot]); // Added deps for snapshot construction

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
        if (!currentAvailability || !selectedCustomer) return;

        const totalPax = Object.values(paxCounts).reduce((a, b) => a + b, 0);
        if (totalPax === 0) {
            alert("Please add at least one passenger.");
            return;
        }

        setIsSaving(true);
        try {
            const bookingData = {
                availability_id: currentAvailability.id,
                customer_id: selectedCustomer.id,
                organization_id: effectiveOrganizationId,
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
                // INSERT new booking - Generate confirmation number
                console.log("DEBUG: Creating new booking");

                // Generate confirmation number: EXP-MMDDYY-SEQ
                const expCode = currentAvailability.experience_short_code || 'EXP';
                const today = new Date();
                const dateStr = format(today, 'MMddyy');

                // Count existing bookings for this experience created today
                const { count } = await supabase
                    .from('bookings' as any)
                    .select('id', { count: 'exact', head: true })
                    .gte('created_at', startOfDay(today).toISOString())
                    .lt('created_at', endOfDay(today).toISOString())
                    .eq('availability_id', currentAvailability.id);

                // Actually we need to count ALL bookings for this experience on this day
                // First get all availabilities for this experience
                const { data: expAvails } = await supabase
                    .from('availabilities' as any)
                    .select('id')
                    .eq('experience_id', currentAvailability.experience_id);

                const availIds = expAvails?.map((a: any) => a.id) || [];

                // Count bookings across all availabilities for this experience today
                const { count: dailyCount } = await supabase
                    .from('bookings' as any)
                    .select('id', { count: 'exact', head: true })
                    .in('availability_id', availIds)
                    .gte('created_at', startOfDay(today).toISOString())
                    .lt('created_at', endOfDay(today).toISOString());

                const seq = (dailyCount || 0) + 1;
                const newConfirmationNumber = `${expCode}-${dateStr}-${seq}`;

                const result = await supabase.from('bookings' as any).insert({
                    ...bookingData,
                    confirmation_number: newConfirmationNumber
                });
                error = result.error;

                if (!error) {
                    setConfirmationNumber(newConfirmationNumber);
                }
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

    if (!currentAvailability) return null;

    // Derived: Current Rates for Tier (Shared with Col 1 & 3)
    const currentRates = rates.filter(r => r.tier === selectedTier);
    const totalPax = Object.values(paxCounts).reduce((a, b) => a + b, 0);
    const canSave = !!selectedCustomer && totalPax > 0;

    // Derived: isDirty
    const currentSnapshot = getSnapshot();
    const isDirty = initialSnapshot !== currentSnapshot;

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
                ? `Editing booking for ${selectedCustomer?.name || 'Customer'}${confirmationNumber ? ` • ${confirmationNumber}` : ''}`
                : `Create a new booking for ${(() => {
                    const [y, m, d] = currentAvailability.start_date.split('-');
                    return `${m}-${d}-${y}`;
                })()}`}
            width="full-content"
            contentClassName="p-0 overflow-hidden flex flex-col"
        >
            <div className="flex-1 min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-[25fr_45fr_30fr] h-full divide-x divide-border">

                    {/* COLUMN 1: Customer & Pax */}
                    <div className="flex flex-col h-full min-h-0">
                        {currentAvailability && (
                            <ColumnOne
                                availability={currentAvailability}
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
                                isEditMode={isEditMode}
                                onAvailabilityChange={handleAvailabilityChange}
                            />
                        )}
                    </div>

                    {/* COLUMN 2: Options & Notes */}
                    <div className="flex flex-col h-full min-h-0">
                        {currentAvailability && (
                            <ColumnTwo
                                availability={currentAvailability}
                                optionSchedules={optionSchedules}
                                selectedOptionScheduleId={selectedOptionScheduleId}
                                setSelectedOptionScheduleId={setSelectedOptionScheduleId}
                                selectedVariation={selectedOptionVariation}
                                setSelectedVariation={setSelectedOptionVariation}
                                currentOptions={currentOptionsList}
                                optionValues={optionValues}
                                setOptionValues={setOptionValues}
                            />
                        )}
                    </div>

                    {/* COLUMN 3: Payment */}
                    <div className="flex flex-col h-full min-h-0">
                        <ColumnThree
                            currentRates={currentRates}
                            paxCounts={paxCounts}
                            paymentState={paymentState}
                            setPaymentState={setPaymentState}
                            setGrandTotal={setGrandTotal}
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center gap-4 py-4 px-6 border-t border-border mt-auto bg-background/95 backdrop-blur-md">
                {isEditMode && (
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="mr-auto px-4 py-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>
                )}

                <Button
                    onClick={handleSave}
                    disabled={isSaving || !canSave || !isDirty}
                    className={cn(
                        "px-6 py-2 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors",
                        isSaving ? "bg-primary/50 text-primary-foreground cursor-not-allowed" :
                            (canSave && isDirty) ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow" :
                                "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                    )}
                >
                    {isSaving ? <><Loader2 className="animate-spin" size={16} /> Saving...</> :
                        (!canSave || !isDirty) ? "No Changes" :
                            (isEditMode ? <><Save size={16} /> Update Booking</> : <><Save size={16} /> Create Booking</>)}
                </Button>
            </div>

            <AlertDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Booking?"
                description="Are you sure you want to delete this booking? This action cannot be undone."
                confirmLabel={isDeleting ? "Deleting..." : "Delete"}
                isDestructive={true}
            />
        </SidePanel>
    );
}
