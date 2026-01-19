"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SidePanel } from "@/components/ui/side-panel";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Calendar,
    Clock,
    Users,
    Truck,
    DollarSign,
    MessageSquare,
    Loader2,
    Save,
    X,
    Repeat,
    CalendarDays,
    Smile
} from "lucide-react";

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
    customer_type_ids: z.array(z.string()).default([]),

    // Schedules
    booking_option_schedule_id: z.string().optional().nullable(),
    pricing_schedule_id: z.string().optional().nullable(),
    transportation_route_id: z.string().optional().nullable(),
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
}

const DAYS_OF_WEEK = [
    { key: "SUN", label: "S" },
    { key: "MON", label: "M" },
    { key: "TUE", label: "T" },
    { key: "WED", label: "W" },
    { key: "THU", label: "T" },
    { key: "FRI", label: "F" },
    { key: "SAT", label: "S" },
];

export function EditAvailabilitySheet({
    isOpen,
    onClose,
    onSuccess,
    initialData,
    selectedDate
}: EditAvailabilitySheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reference data
    const [customerTypes, setCustomerTypes] = useState<{ id: string, name: string }[]>([]);
    const [bookingSchedules, setBookingSchedules] = useState<{ id: string, name: string }[]>([]);
    const [pricingSchedules, setPricingSchedules] = useState<{ id: string, name: string }[]>([]);
    const [transportationSchedules, setTransportationSchedules] = useState<{ id: string, name: string }[]>([]);
    const [staff, setStaff] = useState<{ id: string, name: string, role: { name: string } | null }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors }
    } = useForm<AvailabilityFormData>({
        resolver: zodResolver(AvailabilitySchema),
        defaultValues: {
            is_repeating: false,
            duration_type: "time_range",
            max_capacity: 0,
            online_booking_status: "open",
            repeat_days: [],
            customer_type_ids: [],
            staff_ids: [],
        }
    });

    const isRepeating = watch("is_repeating");
    const durationType = watch("duration_type");
    const repeatDays = watch("repeat_days");
    const customerTypeIds = watch("customer_type_ids");
    const staffIds = watch("staff_ids");

    // Fetch reference data
    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch Customer Types
                const { data: types } = await supabase
                    .from("customer_types" as any)
                    .select("id, name")
                    .order("name");
                setCustomerTypes((types as any) || []);

                // Fetch Booking Option Schedules
                const { data: bookings } = await supabase
                    .from("booking_option_schedules" as any)
                    .select("id, name")
                    .order("name");
                setBookingSchedules((bookings as any) || []);

                // Fetch Pricing Schedules
                const { data: pricing } = await supabase
                    .from("pricing_schedules" as any)
                    .select("id, name")
                    .order("name");
                setPricingSchedules((pricing as any) || []);

                // Fetch Transportation Schedules (Route Schedules)
                const { data: transSchedules } = await supabase
                    .from("schedules" as any)
                    .select("id, name")
                    .order("name");
                setTransportationSchedules((transSchedules as any) || []);

                // Fetch Staff (Drivers and Guides only)
                const { data: staffData, error: staffError } = await supabase
                    .from("staff" as any)
                    .select("*, role:roles(name)")
                    .order("name");

                if (staffError) {
                    console.error("Staff query error:", staffError);
                } else {
                    // Filter to only Drivers and Guides
                    const filteredStaff = (staffData || []).filter((s: any) =>
                        s.role?.name && ['Driver', 'Guide'].includes(s.role.name)
                    );
                    setStaff(filteredStaff as any);
                }

            } catch (err) {
                console.error("Error loading reference data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [isOpen]);

    // Initialize form when opened
    useEffect(() => {
        if (!isOpen) return;

        if (initialData) {
            // Sanitize nulls to empty strings for inputs
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
                customer_type_ids: [],
                staff_ids: [],
            });
        }
    }, [isOpen, initialData, selectedDate, reset]);

    // Toggle day in repeat_days array
    const toggleDay = (day: string) => {
        const current = repeatDays || [];
        if (current.includes(day)) {
            setValue("repeat_days", current.filter(d => d !== day));
        } else {
            setValue("repeat_days", [...current, day]);
        }
    };

    // Toggle customer type
    const toggleCustomerType = (id: string) => {
        const current = customerTypeIds || [];
        if (current.includes(id)) {
            setValue("customer_type_ids", current.filter(t => t !== id));
        } else {
            setValue("customer_type_ids", [...current, id]);
        }
    };

    // Toggle staff
    const toggleStaff = (id: string) => {
        const current = staffIds || [];
        if (current.includes(id)) {
            setValue("staff_ids", current.filter(s => s !== id));
        } else {
            setValue("staff_ids", [...current, id]);
        }
    };

    const onSubmit = async (data: AvailabilityFormData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                experience_id: data.experience_id,
                start_date: data.start_date,
                is_repeating: data.is_repeating,
                repeat_days: data.is_repeating ? data.repeat_days : [],
                end_date: data.is_repeating ? (data.end_date || null) : null,
                duration_type: data.duration_type,
                start_time: data.duration_type === "time_range" ? (data.start_time || null) : null,
                hours_long: data.duration_type === "time_range" ? (data.hours_long || null) : null,
                max_capacity: data.max_capacity,
                customer_type_ids: data.customer_type_ids,
                booking_option_schedule_id: data.booking_option_schedule_id || null,
                pricing_schedule_id: data.pricing_schedule_id || null,
                transportation_route_id: data.transportation_route_id || null,
                staff_ids: data.staff_ids,
                private_announcement: data.private_announcement || null,
                online_booking_status: data.online_booking_status,
            };

            if (data.id) {
                const { error } = await supabase
                    .from("availabilities" as any)
                    .update(payload)
                    .eq("id", data.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("availabilities" as any)
                    .insert([payload]);
                if (error) throw error;
            }

            toast.success("Availability saved");
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
            title="Edit Availability"
            description="Configure availability settings and scheduling."
            width="w-[85vw] max-w-[85vw]"
            contentClassName="p-0"
        >
            <form onSubmit={handleSubmit(onSubmit, (err) => console.error(err))} className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">

                    {isLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="animate-spin text-cyan-400" size={24} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 animate-in fade-in duration-300">
                            {/* LEFT COLUMN (33%) - Scheduling */}
                            <div className="xl:col-span-4 space-y-10">
                                {/* Schedule Section */}
                                <div>
                                    <SectionHeader icon={CalendarDays} title="Schedule" />
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Start Date</label>
                                            <input
                                                type="date"
                                                {...register("start_date")}
                                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
                                                style={{ colorScheme: 'dark' }}
                                            />
                                            {errors.start_date && <p className="text-red-400 text-xs mt-1">{errors.start_date.message}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Repeat?</label>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setValue("is_repeating", false)}
                                                    className={cn(
                                                        "flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all",
                                                        !isRepeating
                                                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                                                            : "bg-black/30 border-white/10 text-zinc-400 hover:border-white/20"
                                                    )}
                                                >
                                                    Don't Repeat
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setValue("is_repeating", true);
                                                        // Default all days selected
                                                        setValue("repeat_days", DAYS_OF_WEEK.map(d => d.key));
                                                    }}
                                                    className={cn(
                                                        "flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2",
                                                        isRepeating
                                                            ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                                                            : "bg-black/30 border-white/10 text-zinc-400 hover:border-white/20"
                                                    )}
                                                >
                                                    <Repeat size={16} />
                                                    Repeat
                                                </button>
                                            </div>
                                        </div>

                                        {isRepeating && (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Repeat On</label>
                                                    <div className="flex gap-2">
                                                        {DAYS_OF_WEEK.map(day => (
                                                            <button
                                                                key={day.key}
                                                                type="button"
                                                                onClick={() => toggleDay(day.key)}
                                                                className={cn(
                                                                    "w-10 h-10 rounded-lg border text-sm font-bold transition-all",
                                                                    repeatDays?.includes(day.key)
                                                                        ? "bg-cyan-500 border-cyan-400 text-black"
                                                                        : "bg-black/30 border-white/10 text-zinc-400 hover:border-white/20"
                                                                )}
                                                            >
                                                                {day.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-400 mb-2">End Date</label>
                                                    <input
                                                        type="date"
                                                        {...register("end_date")}
                                                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
                                                        style={{ colorScheme: 'dark' }}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Duration Section */}
                                <div>
                                    <SectionHeader icon={Clock} title="Duration" />
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Duration Type</label>
                                            <select
                                                {...register("duration_type")}
                                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none [&>option]:bg-black [&>option]:text-white [&>option:checked]:bg-cyan-600"
                                            >
                                                <option value="all_day">All Day</option>
                                                <option value="time_range">Time Range</option>
                                            </select>
                                        </div>

                                        {durationType === "time_range" && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Start Time</label>
                                                    <input
                                                        type="time"
                                                        {...register("start_time")}
                                                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
                                                        style={{ colorScheme: 'dark' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Hours Long</label>
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        {...register("hours_long")}
                                                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
                                                        placeholder="e.g., 2.5"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Capacity Section */}
                                <div>
                                    <SectionHeader icon={Users} title="Capacity & Types" />
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Max Capacity</label>
                                            <input
                                                type="number"
                                                {...register("max_capacity")}
                                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
                                                placeholder="0"
                                            />
                                        </div>

                                        {/* Customer Types Section */}
                                        <div>
                                            <SectionHeader icon={Smile} title="Customer Types" />
                                            <div className="flex flex-wrap gap-2">
                                                {customerTypes.map(type => (
                                                    <button
                                                        key={type.id}
                                                        type="button"
                                                        onClick={() => toggleCustomerType(type.id)}
                                                        className={cn(
                                                            "px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
                                                            customerTypeIds?.includes(type.id)
                                                                ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                                                                : "bg-black/30 border-white/10 text-zinc-400 hover:border-white/20"
                                                        )}
                                                    >
                                                        {type.name}
                                                    </button>
                                                ))}
                                                {customerTypes.length === 0 && (
                                                    <span className="text-zinc-500 text-sm">No customer types configured</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN (67%) - Configuration */}
                            <div className="xl:col-span-8 space-y-10">
                                {/* Booking & Pricing Section */}
                                <div>
                                    <SectionHeader icon={DollarSign} title="Booking & Pricing" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Booking Options Schedule</label>
                                            <select
                                                {...register("booking_option_schedule_id")}
                                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none [&>option]:bg-black [&>option]:text-white [&>option:checked]:bg-cyan-600"
                                            >
                                                <option value="">Select Schedule...</option>
                                                {bookingSchedules.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Price Schedule</label>
                                            <select
                                                {...register("pricing_schedule_id")}
                                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none [&>option]:bg-black [&>option]:text-white [&>option:checked]:bg-cyan-600"
                                            >
                                                <option value="">Select Schedule...</option>
                                                {pricingSchedules.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Online Booking Status</label>
                                            <select
                                                {...register("online_booking_status")}
                                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none [&>option]:bg-black [&>option]:text-white [&>option:checked]:bg-cyan-600"
                                            >
                                                <option value="open">Open</option>
                                                <option value="closed">Closed</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-2">Route Schedule</label>
                                            <select
                                                {...register("transportation_route_id")}
                                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none [&>option]:bg-black [&>option]:text-white [&>option:checked]:bg-cyan-600"
                                            >
                                                <option value="">Select Route Schedule...</option>
                                                {transportationSchedules.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Staff Section */}
                                <div>
                                    <SectionHeader icon={Truck} title="Assigned Staff" />
                                    <div className="flex flex-wrap gap-2">
                                        {staff.map(member => (
                                            <button
                                                key={member.id}
                                                type="button"
                                                onClick={() => toggleStaff(member.id)}
                                                className={cn(
                                                    "px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
                                                    staffIds?.includes(member.id)
                                                        ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                                                        : "bg-black/30 border-white/10 text-zinc-400 hover:border-white/20"
                                                )}
                                            >
                                                {member.name} ({member.role?.name || 'Staff'})
                                            </button>
                                        ))}
                                        {staff.length === 0 && (
                                            <span className="text-zinc-500 text-sm">No staff configured</span>
                                        )}
                                    </div>
                                </div>

                                {/* Notes Section */}
                                <div>
                                    <SectionHeader icon={MessageSquare} title="Internal Notes" />
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2">Private Announcement</label>
                                        <textarea
                                            {...register("private_announcement")}
                                            rows={4}
                                            className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none resize-none"
                                            placeholder="Internal notes for this availability..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center gap-4 pt-4 px-6 border-t border-white/10 mt-auto bg-[#0b1115]">
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
        </SidePanel>
    );
}

// Section Header Helper
function SectionHeader({ icon: Icon, title }: { icon: any, title: string }) {
    return (
        <div className="flex items-center gap-2 pt-4 pb-4 border-t border-white/5 first:border-0 first:pt-0">
            <Icon size={16} className="text-cyan-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">{title}</span>
        </div>
    );
}
