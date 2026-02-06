"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SidePanel } from "@/components/ui/side-panel";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader2, Save, Trash2 } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { LoadingState } from "@/components/ui/loading-state";
import { ColumnOne } from "./edit-availability/column-one";
import { ColumnTwo } from "./edit-availability/column-two";
import { ColumnThree } from "./edit-availability/column-three";
import { Assignment } from "./edit-availability/resource-cluster-list";
import { useAuth } from "@/features/auth/auth-context";

// Schema
const AvailabilitySchema = z.object({
    id: z.string().optional(),
    experience_id: z.string().min(1, "Experience is required"), // REQUIRED
    start_date: z.string().min(1, "Start date required"),

    // Repeat
    is_repeating: z.boolean().default(false),
    repeat_days: z.array(z.string()).default([]),
    end_date: z.string().optional().nullable(),

    // Duration
    duration_type: z.enum(["all_day", "time_range"]).default("all_day"),
    start_time: z.string().optional().nullable(),
    hours_long: z.coerce.number().min(0).optional().nullable(),

    // Capacity
    max_capacity: z.coerce.number().min(0).default(0),

    // Schedules
    booking_option_schedule_id: z.string().optional().nullable(),
    booking_option_variation: z.enum(["retail", "online", "special", "custom"]).default("retail"),
    pricing_schedule_id: z.string().optional().nullable(),
    pricing_tier_id: z.string().optional().nullable(),

    // Legacy single-vehicle fields (kept for schema validity but unused/hidden in UI)
    transportation_route_id: z.string().optional().nullable(),
    vehicle_id: z.string().optional().nullable(),
    staff_ids: z.array(z.string()).default([]),

    // Info
    private_announcement: z.string().optional().nullable(),
    online_booking_status: z.enum(["open", "closed"]).default("open"),
});

type AvailabilityFormData = z.infer<typeof AvailabilitySchema>;

interface EditAvailabilitySheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
    selectedDate?: string; // YYYY-MM-DD format
    onDelete?: (id: string) => void;
}

export function EditAvailabilitySheet({
    isOpen,
    onClose,
    onSuccess,
    initialData,
    selectedDate,
    onDelete
}: EditAvailabilitySheetProps) {
    const { effectiveOrganizationId } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Reference data
    const [experiences, setExperiences] = useState<{ id: string, name: string }[]>([]); // New State
    const [bookingSchedules, setBookingSchedules] = useState<{ id: string, name: string }[]>([]);
    const [pricingSchedules, setPricingSchedules] = useState<{ id: string, name: string }[]>([]);
    const [pricingVariations, setPricingVariations] = useState<{ id: string, name: string }[]>([]);
    const [transportationSchedules, setTransportationSchedules] = useState<{ id: string, name: string }[]>([]);
    const [vehicles, setVehicles] = useState<{ id: string, name: string }[]>([]);
    const [staff, setStaff] = useState<{ id: string, name: string, role: { name: string } | null }[]>([]);

    // Resource Cluster State
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    const methods = useForm<AvailabilityFormData>({
        resolver: zodResolver(AvailabilitySchema) as any,
        defaultValues: {
            id: undefined,
            experience_id: "", // Default to empty string for required validation
            start_date: "",
            is_repeating: false,
            repeat_days: [],
            end_date: null,
            duration_type: "time_range",
            start_time: null,
            hours_long: null,
            max_capacity: 0,
            booking_option_schedule_id: null,
            booking_option_variation: "retail",
            pricing_schedule_id: null,
            pricing_tier_id: null,
            transportation_route_id: null,
            vehicle_id: null,
            staff_ids: [],
            private_announcement: null,
            online_booking_status: "open",
        }
    });

    const { reset, handleSubmit, formState: { isDirty } } = methods;

    // Track initial assignments to detect changes
    const [initialAssignments, setInitialAssignments] = useState<Assignment[]>([]);
    const isAssignmentsDirty = JSON.stringify(assignments) !== JSON.stringify(initialAssignments);

    // Fetch reference data & assignments
    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // ... (existing fetches)
                const [
                    { data: exps }, // Fetch experiences
                    { data: bookings },
                    { data: pricing },
                    { data: variations },
                    { data: transSchedules },
                    { data: vehs },
                    { data: staffData },
                    { data: rolesData } // Fetch roles separately
                ] = await Promise.all([
                    supabase.from("experiences" as any).select("id, name").order("name"), // Added
                    supabase.from("booking_option_schedules" as any).select("id, name").order("name"),
                    supabase.from("pricing_schedules" as any).select("id, name").order("name"),
                    supabase.from("pricing_variations" as any).select("id, name").order("sort_order"),
                    supabase.from("schedules" as any).select("id, name").order("name"),
                    supabase.from("vehicles" as any).select("id, name, capacity").eq("status", "active").order("name"),
                    // Removed 'role:roles(name)' to avoid 400 bad request with join
                    supabase.from("staff" as any).select("*, user:users(name)"),
                    supabase.from("staff_positions" as any).select("id, name")
                ]);

                // Deduplicate experiences by name
                const uniqueExps = (exps as any[] || []).reduce((acc: any[], current) => {
                    const x = acc.find(item => item.name === current.name);
                    if (!x) {
                        return acc.concat([current]);
                    } else {
                        return acc;
                    }
                }, []);

                setExperiences(uniqueExps);
                setBookingSchedules((bookings as any) || []);
                setPricingSchedules((pricing as any) || []);
                setPricingVariations((variations as any) || []);
                setTransportationSchedules((transSchedules as any) || []);
                setVehicles((vehs as any) || []);

                // Map roles manually
                const roleMap = new Map((rolesData as any[] || []).map(r => [r.id, r.name]));

                // Pass all staff and let UI handle display/filtering, ensure Name is mapped
                const mappedStaff = (staffData || []).map((s: any) => {
                    // DB uses position_id, mapped to staff_positions
                    const rName = s.position_id ? roleMap.get(s.position_id) : (s.role_id ? roleMap.get(s.role_id) : null);
                    return {
                        ...s,
                        name: s.user?.name || s.name || 'Unknown Staff',
                        role: { name: rName }
                    };
                })
                    .sort((a: any, b: any) => a.name.localeCompare(b.name));

                setStaff(mappedStaff as any);

                // Fetch Existing Assignments if Edit Mode
                if (initialData?.id) {
                    const { data: assignData } = await supabase
                        .from("availability_assignments" as any)
                        .select("*")
                        .eq("availability_id", initialData.id)
                        .order("sort_order");
                    setAssignments((assignData as any) || []);
                    setInitialAssignments((assignData as any) || []);
                } else {
                    setAssignments([]);
                    setInitialAssignments([]);
                }

            } catch (err) {
                console.error("Error loading reference data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [isOpen, initialData]);

    // Initialize form
    useEffect(() => {
        if (!isOpen) return;

        const defaultState = {
            experience_id: "", // Default required string
            start_date: selectedDate || "",
            is_repeating: false,
            duration_type: "all_day" as "all_day" | "time_range",
            max_capacity: 0,
            online_booking_status: "open" as "open" | "closed",
            repeat_days: [],
            booking_option_variation: "retail" as "retail" | "online" | "special" | "custom",
            staff_ids: [],
        };

        if (initialData) {
            const safeData = { ...initialData };
            Object.keys(safeData).forEach(key => {
                if (safeData[key] === null) safeData[key] = "";
            });
            reset({
                ...defaultState, // Apply defaults first
                ...safeData,     // Override with initialData (if present)
                experience_id: safeData.experience_id === "all" ? "" : (safeData.experience_id || ""), // Sanitize "all" to empty
                start_date: safeData.start_date || selectedDate || "",
                // Coerce numbers to strings for 'isDirty' compatibility with HTML inputs
                max_capacity: safeData.max_capacity !== undefined && safeData.max_capacity !== null ? String(safeData.max_capacity) : "0",
                hours_long: safeData.hours_long !== undefined && safeData.hours_long !== null ? String(safeData.hours_long) : "",
            });
        } else {
            reset(defaultState);
        }
    }, [isOpen, initialData, selectedDate, reset]);

    // Generate dates
    const generateRepeatDates = (start: string, end: string, days: string[]): string[] => {
        const dates: string[] = [];
        const currentDate = new Date(start + "T00:00:00");
        const endDate = new Date(end + "T00:00:00");
        // ... (standard logic)
        const dayMap: { [key: string]: number } = { "SUN": 0, "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5, "SAT": 6 };
        if (isNaN(currentDate.getTime()) || isNaN(endDate.getTime())) return [];
        while (currentDate <= endDate) {
            const dayIndex = currentDate.getDay();
            const dayKey = Object.keys(dayMap).find(key => dayMap[key] === dayIndex);
            if (dayKey && days.includes(dayKey)) {
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');
                dates.push(`${year}-${month}-${day}`);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };
    const onSubmit = async (data: AvailabilityFormData) => {
        if (!initialData?.id && !effectiveOrganizationId) {
            toast.error("Organization context missing. Cannot create availability.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Base Payload
            const basePayload = {
                organization_id: effectiveOrganizationId, // Ensure org ownership
                experience_id: data.experience_id,
                is_repeating: false,
                repeat_days: [],
                end_date: null,
                duration_type: data.duration_type,
                start_time: data.duration_type === "time_range" ? (data.start_time || null) : null,
                hours_long: data.duration_type === "time_range" ? (data.hours_long || null) : null,
                max_capacity: data.max_capacity,
                booking_option_schedule_id: data.booking_option_schedule_id || null,
                booking_option_variation: data.booking_option_variation,
                pricing_schedule_id: data.pricing_schedule_id || null,
                pricing_tier_id: data.pricing_tier_id || null,
                private_announcement: data.private_announcement || null,
                online_booking_status: data.online_booking_status,
                // Legacy fields (set to null or first assignment as fallback?)
                // Strategy: Just null or ignore. They are obsolete.
                vehicle_id: null,
                transportation_route_id: null,
                staff_ids: []
            };

            // 1. Calculate Dates
            let targetDates: string[] = [data.start_date];
            if (data.is_repeating && data.end_date && data.repeat_days.length > 0) {
                const rangeDates = generateRepeatDates(data.start_date, data.end_date, data.repeat_days);
                targetDates = Array.from(new Set([...targetDates, ...rangeDates])).sort();
            }

            // 2. Insert/Update Availabilities
            const availabilityIds: string[] = [];

            if (data.id) {
                // UPDATE single (Repeat updates not supported fully here yet, assuming ID points to one)
                const { error: updateError } = await supabase
                    .from("availabilities" as any)
                    .update({ ...basePayload, start_date: data.start_date })
                    .eq("id", data.id);
                if (updateError) throw updateError;
                availabilityIds.push(data.id);
            } else {
                // CREATE multiple
                const newRows = targetDates.map(date => ({ ...basePayload, start_date: date }));
                const { data: inserted, error: insertError } = await supabase
                    .from("availabilities" as any)
                    .insert(newRows)
                    .select("id");

                if (insertError) throw insertError;
                if (inserted) inserted.forEach((r: any) => availabilityIds.push(r.id));
            }

            // 3. Update Assignments for EACH Availability ID
            //    (For create multiple, we replicate the cluster to all dates)
            for (const availId of availabilityIds) {
                // Delete existing
                await supabase.from("availability_assignments" as any).delete().eq("availability_id", availId);

                // Insert new (if any)
                if (assignments.length > 0) {
                    const assignmentRows = assignments.map((a, index) => ({
                        availability_id: availId,
                        vehicle_id: a.vehicle_id,
                        transportation_route_id: a.transportation_route_id || null,
                        driver_id: a.driver_id || null,
                        guide_id: a.guide_id || null,
                        sort_order: index
                    }));
                    const { error: assignError } = await supabase
                        .from("availability_assignments" as any)
                        .insert(assignmentRows);
                    if (assignError) throw assignError;
                }
            }

            toast.success(`Successfully saved ${targetDates.length} availability slot(s)`);
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Error saving availability:", err);
            toast.error(err.message || "Failed to save");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isEditMode = !!initialData?.id;

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? "Edit Availability" : "New Availability"}
            description="Configure availability settings and scheduling."
            width="full-content"
            contentClassName="p-0"
        >
            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit, (err) => console.error(err))} className="h-full flex flex-col">
                    <div className="flex-1 overflow-hidden">
                        {isLoading ? (
                            <LoadingState className="h-64" />
                        ) : (
                            <div className="flex-1 grid grid-cols-[25fr_37.5fr_37.5fr] min-h-0 divide-x divide-border bg-transparent">
                                {/* COLUMN 1: Schedule */}
                                <div className="h-full overflow-hidden">
                                    <ColumnOne experiences={experiences} />
                                </div>

                                {/* COLUMN 2: Pricing & Resources */}
                                <div className="h-full overflow-hidden">
                                    <ColumnTwo
                                        pricingSchedules={pricingSchedules}
                                        pricingVariations={pricingVariations}
                                        transportationSchedules={transportationSchedules}
                                        vehicles={vehicles}
                                        staff={staff}
                                        assignments={assignments}
                                        onAssignmentsChange={setAssignments}
                                    />
                                </div>

                                {/* COLUMN 3: Options & Settings */}
                                <div className="h-full overflow-hidden">
                                    <ColumnThree
                                        bookingSchedules={bookingSchedules}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="shrink-0 flex justify-end items-center gap-4 px-6 py-4 border-t border-border bg-background/80 backdrop-blur-md">
                        {isEditMode && onDelete && (
                            <button
                                type="button"
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="mr-auto px-4 py-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                        )}

                        {/* Define hasChanges for button logic */}
                        {(() => {
                            const hasChanges = isDirty || isAssignmentsDirty;
                            return (
                                <button
                                    type="submit"
                                    disabled={isSubmitting || isLoading || !hasChanges}
                                    className={cn(
                                        "px-6 py-2 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors",
                                        (isSubmitting || isLoading) ? "bg-primary/50 text-primary-foreground cursor-not-allowed" :
                                            hasChanges ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow" :
                                                "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                                    )}
                                >
                                    {(isSubmitting || isLoading) ? <><Loader2 className="animate-spin" size={16} /> Saving...</> :
                                        hasChanges ? <><Save size={16} /> Save Availability</> :
                                            "No Changes"}
                                </button>
                            );
                        })()}
                    </div>
                </form>
            </FormProvider>

            <AlertDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={() => {
                    if (initialData?.id) {
                        onDelete?.(initialData.id);
                        setIsDeleteDialogOpen(false);
                    }
                }}
                title="Delete Availability?"
                description="Are you sure you want to delete this availability? This cannot be undone."
                confirmLabel="Delete"
                isDestructive={true}
            />
        </SidePanel>
    );
}
