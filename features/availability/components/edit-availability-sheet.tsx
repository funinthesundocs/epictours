"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SidePanel } from "@/components/ui/side-panel";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { ColumnOne } from "./edit-availability/column-one";
import { ColumnTwo } from "./edit-availability/column-two";
import { ColumnThree } from "./edit-availability/column-three";
import { Assignment } from "./edit-availability/resource-cluster-list";

// Schema
const AvailabilitySchema = z.object({
    id: z.string().optional(),
    experience_id: z.string().optional().nullable(),
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Reference data
    const [bookingSchedules, setBookingSchedules] = useState<{ id: string, name: string }[]>([]);
    const [pricingSchedules, setPricingSchedules] = useState<{ id: string, name: string }[]>([]);
    const [pricingVariations, setPricingVariations] = useState<{ id: string, name: string }[]>([]);
    const [transportationSchedules, setTransportationSchedules] = useState<{ id: string, name: string }[]>([]);
    const [vehicles, setVehicles] = useState<{ id: string, name: string }[]>([]);
    const [staff, setStaff] = useState<{ id: string, name: string, role: { name: string } | null }[]>([]);

    // Resource Cluster State
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    const methods = useForm<AvailabilityFormData>({
        resolver: zodResolver(AvailabilitySchema),
        defaultValues: {
            is_repeating: false,
            duration_type: "time_range",
            max_capacity: 0,
            online_booking_status: "open",
            repeat_days: [],
            staff_ids: [],
            booking_option_variation: "retail",
        }
    });

    const { reset, handleSubmit } = methods;

    // Fetch reference data & assignments
    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch basic ref data
                const [
                    { data: bookings },
                    { data: pricing },
                    { data: variations },
                    { data: transSchedules },
                    { data: vehs },
                    { data: staffData }
                ] = await Promise.all([
                    supabase.from("booking_option_schedules" as any).select("id, name").order("name"),
                    supabase.from("pricing_schedules" as any).select("id, name").order("name"),
                    supabase.from("pricing_variations" as any).select("id, name").order("sort_order"),
                    supabase.from("schedules" as any).select("id, name").order("name"),
                    supabase.from("vehicles" as any).select("id, name, capacity").eq("status", "active").order("name"),
                    supabase.from("staff" as any).select("*, role:roles(name)").order("name")
                ]);

                setBookingSchedules((bookings as any) || []);
                setPricingSchedules((pricing as any) || []);
                setPricingVariations((variations as any) || []);
                setTransportationSchedules((transSchedules as any) || []);
                setVehicles((vehs as any) || []);

                // Filter Staff
                const filteredStaff = (staffData || []).filter((s: any) =>
                    s.role?.name && ['Driver', 'Guide'].includes(s.role.name)
                );
                setStaff(filteredStaff as any);

                // Fetch Existing Assignments if Edit Mode
                if (initialData?.id) {
                    const { data: assignData } = await supabase
                        .from("availability_assignments" as any)
                        .select("*")
                        .eq("availability_id", initialData.id)
                        .order("sort_order");
                    setAssignments((assignData as any) || []);
                } else {
                    setAssignments([]);
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

        if (initialData) {
            const safeData = { ...initialData };
            Object.keys(safeData).forEach(key => {
                if (safeData[key] === null) safeData[key] = "";
            });
            reset({
                ...safeData,
                start_date: safeData.start_date || selectedDate || "",
            });
        } else {
            reset({
                start_date: selectedDate || "",
                is_repeating: false,
                duration_type: "all_day",
                max_capacity: 0,
                online_booking_status: "open",
                repeat_days: [],
                booking_option_variation: "retail",
            });
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
        setIsSubmitting(true);
        try {
            // Base Payload
            const basePayload = {
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
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="animate-spin text-cyan-400" size={32} />
                            </div>
                        ) : (
                            <div className="h-full grid grid-cols-3 divide-x divide-white/5">
                                {/* COLUMN 1: Schedule */}
                                <div className="p-8">
                                    <ColumnOne />
                                </div>

                                {/* COLUMN 2: Pricing & Resources */}
                                <div className="p-8">
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
                                <div className="p-8">
                                    <ColumnThree
                                        bookingSchedules={bookingSchedules}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end items-center gap-4 pt-4 px-6 border-t border-white/10 mt-auto bg-[#0b1115] py-4">
                        {isEditMode && onDelete && (
                            <button
                                type="button"
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="mr-auto px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || isLoading}
                            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Save Availability
                        </button>
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
