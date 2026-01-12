"use client";
// @read: docs/SOP_Form_Development.md
// @read: docs/ANTI_PATTERNS.md

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Info, ClipboardList, Clock, Users, FileText, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Experience } from "../types";
import { cn } from "@/lib/utils";

// LOOSE SCHEMA
const FormSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    slogan: z.string().optional().nullable(),
    event_type: z.string().optional().nullable(),
    start_time: z.string().optional().nullable(),
    end_time: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    min_age: z.any().optional(),
    max_age: z.any().optional(),
    min_group_size: z.any().optional(),
    max_group_size: z.any().optional(),
    what_to_bring: z.string().optional().nullable(),
    checkin_details: z.string().optional().nullable(),
    transport_details: z.string().optional().nullable(),
    cancellation_policy: z.string().optional().nullable(),
    restrictions: z.string().optional().nullable(),
    disclaimer: z.string().optional().nullable(),
    waiver_link: z.string().optional().nullable(),
    is_active: z.boolean()
});

type FormData = z.infer<typeof FormSchema>;

interface ExperienceSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Experience;
}

// Generate Time Options (05:00 AM to 11:45 PM)
const timeOptions = Array.from({ length: 76 }, (_, i) => {
    const totalMinutes = 300 + (i * 15);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
});

export function ExperienceSheet({ isOpen, onClose, onSuccess, initialData }: ExperienceSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Custom Time Picker State
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // Refs for click outside
    const startWrapperRef = useRef<HTMLDivElement>(null);
    const endWrapperRef = useRef<HTMLDivElement>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors }
    } = useForm<FormData>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            name: "",
            event_type: "Tour",
            start_time: "07:00 AM",
            end_time: "04:00 PM",
            is_active: true
        }
    });

    const startTimeValue = watch("start_time");
    const endTimeValue = watch("end_time");

    useEffect(() => {
        if (isOpen && initialData) {
            reset({
                ...initialData,
                what_to_bring: Array.isArray(initialData.what_to_bring)
                    ? initialData.what_to_bring.join("\n")
                    : "",
                slogan: initialData.slogan || "",
                description: initialData.description || "",
                start_time: initialData.start_time || "07:00 AM",
                end_time: initialData.end_time || "04:00 PM",
                checkin_details: initialData.checkin_details || "",
                transport_details: initialData.transport_details || "",
                cancellation_policy: initialData.cancellation_policy || "",
                restrictions: initialData.restrictions || "",
                disclaimer: initialData.disclaimer || "",
                waiver_link: initialData.waiver_link || "",
                min_age: initialData.min_age ?? "",
                max_age: initialData.max_age ?? "",
                min_group_size: initialData.min_group_size ?? "",
                max_group_size: initialData.max_group_size ?? "",
                is_active: initialData.is_active ?? true,
            });
        } else if (isOpen) {
            reset({
                name: "",
                slogan: "",
                event_type: "Tour",
                description: "",
                start_time: "07:00 AM",
                end_time: "04:00 PM",
                min_age: "",
                max_age: "",
                min_group_size: "",
                max_group_size: "",
                what_to_bring: "",
                checkin_details: "",
                transport_details: "",
                cancellation_policy: "",
                restrictions: "",
                disclaimer: "",
                waiver_link: "",
                is_active: true
            });
        }
    }, [isOpen, initialData, reset]);

    // Close pickers on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (startWrapperRef.current && !startWrapperRef.current.contains(event.target as Node)) {
                setShowStartPicker(false);
            }
            if (endWrapperRef.current && !endWrapperRef.current.contains(event.target as Node)) {
                setShowEndPicker(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const onSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            // Apply Title Case to Slogan
            const slogan = formData.slogan
                ? formData.slogan.replace(/\b\w/g, l => l.toUpperCase())
                : null;

            const dbData = {
                ...formData,
                slogan,
                min_age: formData.min_age === "" ? null : Number(formData.min_age),
                max_age: formData.max_age === "" ? null : Number(formData.max_age),
                min_group_size: formData.min_group_size === "" ? null : Number(formData.min_group_size),
                max_group_size: formData.max_group_size === "" ? null : Number(formData.max_group_size),
                what_to_bring: formData.what_to_bring
                    ? formData.what_to_bring.split("\n").map(s => s.trim()).filter(Boolean)
                    : [],
                description: formData.description || null,
                checkin_details: formData.checkin_details || null,
                transport_details: formData.transport_details || null,
                cancellation_policy: formData.cancellation_policy || null,
                restrictions: formData.restrictions || null,
                disclaimer: formData.disclaimer || null,
                waiver_link: formData.waiver_link || null
            };

            if (isNaN(dbData.min_age as number)) dbData.min_age = null;
            if (isNaN(dbData.max_age as number)) dbData.max_age = null;
            if (isNaN(dbData.min_group_size as number)) dbData.min_group_size = null;
            if (isNaN(dbData.max_group_size as number)) dbData.max_group_size = null;

            if (initialData?.id) {
                const { error } = await supabase.from("experiences").update(dbData).eq("id", initialData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("experiences").insert([dbData]);
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error saving experience:", err);
            alert(`Failed to save experience: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className="flex items-center gap-2 text-cyan-400 border-b border-white/10 pb-2 mb-6 mt-2">
            <Icon size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
        </div>
    );
    const inputClasses = "w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none transition-colors";
    const labelClasses = "text-xs font-medium text-zinc-400 uppercase tracking-wider ml-1";

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Experience" : "New Experience"}
            description="Manage your inventory details."
            width="w-[85vw] max-w-[85vw]"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="pb-12 pt-4">

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 mb-12">
                    {/* LEFT COLUMN */}
                    <div className="xl:col-span-4 space-y-10">
                        <div>
                            <SectionHeader icon={Info} title="Basic Information" />
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className={labelClasses}>Experience Name *</label>
                                    <input {...register("name")} className={cn(inputClasses, "text-lg font-semibold")} placeholder="e.g. Grand Circle Island Tour" />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClasses}>Slogan / Tagline</label>
                                    <input {...register("slogan")} className={cn(inputClasses, "capitalize")} placeholder="Short, catchy description..." />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClasses}>Event Type</label>
                                    <select {...register("event_type")} className={inputClasses}>
                                        <option value="Tour">Tour</option>
                                        <option value="Activity">Activity</option>
                                        <option value="Transport">Transport</option>
                                        <option value="Event">Event</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div>
                            <SectionHeader icon={Users} title="Capacity & Age" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><label className={labelClasses}>Min Age</label><input type="number" {...register("min_age")} className={inputClasses} placeholder="0" /></div>
                                <div className="space-y-2"><label className={labelClasses}>Max Age</label><input type="number" {...register("max_age")} className={inputClasses} placeholder="99" /></div>
                                <div className="space-y-2"><label className={labelClasses}>Min Group</label><input type="number" {...register("min_group_size")} className={inputClasses} placeholder="1" /></div>
                                <div className="space-y-2"><label className={labelClasses}>Max Group</label><input type="number" {...register("max_group_size")} className={inputClasses} placeholder="10" /></div>
                            </div>
                        </div>
                        <div>
                            <SectionHeader icon={ClipboardList} title="Requirements" />
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className={labelClasses}>What to Bring</label>
                                    <textarea {...register("what_to_bring")} className={cn(inputClasses, "font-mono text-sm")} placeholder={"Sunscreen\nWater\nCamera"} rows={6} />
                                </div>
                                <div className="space-y-2"><label className={labelClasses}>Waiver Link</label><input {...register("waiver_link")} className={inputClasses} placeholder="https://..." /></div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="xl:col-span-8 space-y-10">
                        <div>
                            <SectionHeader icon={Clock} title="Logistics & Timing" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Start Time with Custom Picker */}
                                <div className="space-y-2 relative" ref={startWrapperRef}>
                                    <label className={labelClasses}>Start Time</label>
                                    <div className="relative">
                                        <input
                                            {...register("start_time")}
                                            className={cn(inputClasses, "cursor-pointer")}
                                            placeholder="e.g. 07:00 AM"
                                            autoComplete="off"
                                            onClick={() => setShowStartPicker(true)}
                                            onFocus={() => setShowStartPicker(true)}
                                        />
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                                    </div>
                                    {showStartPicker && (
                                        <div className="absolute top-full left-0 w-full mt-1 bg-[#1a1f2e] border border-cyan-500/30 rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50 divide-y divide-white/5">
                                            {timeOptions.map(time => (
                                                <div
                                                    key={time}
                                                    className={cn(
                                                        "px-4 py-3 text-sm transition-colors cursor-pointer flex items-center justify-between",
                                                        startTimeValue === time ? "bg-cyan-500/10 text-cyan-400" : "text-zinc-300 hover:bg-white/5 hover:text-white"
                                                    )}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault(); // Prevent blur
                                                        setValue("start_time", time);
                                                        setShowStartPicker(false);
                                                    }}
                                                >
                                                    {time}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* End Time with Custom Picker */}
                                <div className="space-y-2 relative" ref={endWrapperRef}>
                                    <label className={labelClasses}>End Time</label>
                                    <div className="relative">
                                        <input
                                            {...register("end_time")}
                                            className={cn(inputClasses, "cursor-pointer")}
                                            placeholder="e.g. 04:00 PM"
                                            autoComplete="off"
                                            onClick={() => setShowEndPicker(true)}
                                            onFocus={() => setShowEndPicker(true)}
                                        />
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                                    </div>
                                    {showEndPicker && (
                                        <div className="absolute top-full left-0 w-full mt-1 bg-[#1a1f2e] border border-cyan-500/30 rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50 divide-y divide-white/5">
                                            {timeOptions.map(time => (
                                                <div
                                                    key={time}
                                                    className={cn(
                                                        "px-4 py-3 text-sm transition-colors cursor-pointer flex items-center justify-between",
                                                        endTimeValue === time ? "bg-cyan-500/10 text-cyan-400" : "text-zinc-300 hover:bg-white/5 hover:text-white"
                                                    )}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault(); // Prevent blur
                                                        setValue("end_time", time);
                                                        setShowEndPicker(false);
                                                    }}
                                                >
                                                    {time}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className={labelClasses}>Check-in Details</label>
                                    <input {...register("checkin_details")} className={inputClasses} placeholder="Meeting point instructions..." />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className={labelClasses}>Transport Details</label>
                                    <textarea {...register("transport_details")} rows={2} className={inputClasses} placeholder="Pickup locations and vehicle info..." />
                                </div>
                            </div>
                        </div>

                        <div>
                            <SectionHeader icon={FileText} title="Experience Details" />
                            <div className="space-y-8">
                                <div className="space-y-2"><label className={labelClasses}>Full Description</label><textarea {...register("description")} className={cn(inputClasses, "resize-y min-h-[200px] leading-relaxed")} placeholder="Detailed overview..." /></div>
                                <div className="space-y-2"><label className={labelClasses}>Cancellation Policy</label><textarea {...register("cancellation_policy")} rows={4} className={inputClasses} placeholder="Standard 24h policy..." /></div>
                                <div className="space-y-2"><label className={labelClasses}>Restrictions & Disclaimer</label><textarea {...register("restrictions")} rows={4} className={inputClasses} placeholder="Medical restrictions..." /></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 border-t border-white/10 pt-6 mt-8">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded flex items-center gap-2 transition">
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>
            </form>
        </SidePanel>
    );
}
