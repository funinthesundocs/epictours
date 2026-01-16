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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Experience, ExperienceFormData, ExperienceSchema, NewExperience } from "../types";
import { cn } from "@/lib/utils";

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
    const [showEventTypePicker, setShowEventTypePicker] = useState(false);

    // Refs for click outside
    const startWrapperRef = useRef<HTMLDivElement>(null);
    const endWrapperRef = useRef<HTMLDivElement>(null);
    const eventTypeWrapperRef = useRef<HTMLDivElement>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(ExperienceSchema),
        defaultValues: {
            name: "",
            short_code: "",
            event_type: "Tour",
            start_time: "07:00 AM",
            end_time: "04:00 PM",
            is_active: false
        }
    });

    const startTimeValue = watch("start_time");
    const endTimeValue = watch("end_time");
    const eventTypeValue = watch("event_type");

    useEffect(() => {
        if (isOpen && initialData) {
            reset({
                id: initialData.id,
                name: initialData.name || "",
                short_code: initialData.short_code || "",
                event_type: initialData.event_type || "Tour",
                slogan: initialData.slogan || null,

                // Text Fields
                description: initialData.description || null,
                what_to_bring: Array.isArray(initialData.what_to_bring)
                    ? initialData.what_to_bring.join("\n")
                    : "",
                checkin_details: initialData.checkin_details || null,
                transport_details: initialData.transport_details || null,
                cancellation_policy: initialData.cancellation_policy || null,
                restrictions: initialData.restrictions || null,
                disclaimer: initialData.disclaimer || null,
                waiver_link: initialData.waiver_link || null,

                // Numbers (Coerced)
                min_age: initialData.min_age ?? null,
                max_age: initialData.max_age ?? null,
                min_group_size: initialData.min_group_size ?? null,
                max_group_size: initialData.max_group_size ?? null,

                start_time: initialData.start_time || "07:00 AM",
                end_time: initialData.end_time || "04:00 PM",
                is_active: initialData.is_active ?? true,
            });
        } else if (isOpen) {
            reset({
                name: "",
                short_code: "",
                event_type: "Tour",
                slogan: null,
                description: null,
                what_to_bring: "",
                checkin_details: null,
                transport_details: null,
                cancellation_policy: null,
                restrictions: null,
                disclaimer: null,
                waiver_link: null,

                min_age: null,
                max_age: null,
                min_group_size: null,
                max_group_size: null,

                start_time: "07:00 AM",
                end_time: "04:00 PM",
                is_active: false
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
            if (eventTypeWrapperRef.current && !eventTypeWrapperRef.current.contains(event.target as Node)) {
                setShowEventTypePicker(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const onSubmit = async (formData: ExperienceFormData) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                // Transform Form Data to DB Payload (Strict Type: NewExperience)
                const dbData: NewExperience = {
                    name: formData.name,
                    short_code: formData.short_code ? formData.short_code.toUpperCase() : null,
                    event_type: formData.event_type || "Tour",
                    slogan: formData.slogan ? formData.slogan.replace(/\b\w/g, l => l.toUpperCase()) : null,
                    min_age: formData.min_age ?? null, // Coercion happened in Zod
                    max_age: formData.max_age ?? null,
                    min_group_size: formData.min_group_size ?? null,
                    max_group_size: formData.max_group_size ?? null,
                    what_to_bring: formData.what_to_bring
                        ? formData.what_to_bring.split("\n").map(s => s.trim()).filter(Boolean)
                        : [],
                    description: formData.description || null,
                    checkin_details: formData.checkin_details || null,
                    transport_details: formData.transport_details || null,
                    cancellation_policy: formData.cancellation_policy || null,
                    restrictions: formData.restrictions || null,
                    disclaimer: formData.disclaimer || null,
                    waiver_link: formData.waiver_link || null,
                    start_time: formData.start_time || null,
                    end_time: formData.end_time || null,
                    is_active: formData.is_active
                };

                // No more isNaN checks needed because Zod coerces to Number or Null

                if (initialData?.id) {
                    const { error } = await supabase.from("experiences").update(dbData).eq("id", initialData.id);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from("experiences").insert([dbData]);
                    if (error) throw error;
                }

                resolve(true);
                onSuccess();
                onClose();
            } catch (err) {
                console.error("Error saving experience:", err);
                reject(err);
            }
        });

        toast.promise(promise, {
            loading: 'Saving experience...',
            success: 'Experience saved successfully.',
            error: (err) => `Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`
        });
    };

    const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className="flex items-center gap-2 text-cyan-400 border-b border-white/10 pb-2 mb-6 mt-2">
            <Icon size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
        </div>
    );
    const inputClasses = "w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none transition-colors";
    const labelClasses = "text-xs font-medium text-zinc-400 uppercase tracking-wider ml-1";

    const eventTypeOptions = ["Tour", "Activity", "Transport", "Event"];

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
                                    <Label>Experience Name *</Label>
                                    <Input {...register("name")} className="text-lg font-semibold" placeholder="e.g. Grand Circle Island Tour" />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Experience Code</Label>
                                        <Input {...register("short_code")} className="font-mono uppercase" placeholder="e.g. ACI" maxLength={4} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Slogan / Tagline</Label>
                                        <Input {...register("slogan")} className="capitalize" placeholder="Short, catchy description..." />
                                    </div>
                                </div>
                                <div className="space-y-2 relative" ref={eventTypeWrapperRef}>
                                    <label className={labelClasses}>Event Type</label>
                                    <div className="relative">
                                        <input
                                            {...register("event_type")}
                                            className={cn(inputClasses, "cursor-pointer")}
                                            readOnly
                                            autoComplete="off"
                                            onClick={() => setShowEventTypePicker(true)}
                                            onFocus={() => setShowEventTypePicker(true)}
                                        />
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
                                    </div>
                                    {showEventTypePicker && (
                                        <div className="absolute top-full left-0 w-full mt-1 bg-[#1a1f2e] border border-cyan-500/30 rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50 divide-y divide-white/5">
                                            {eventTypeOptions.map(type => (
                                                <div
                                                    key={type}
                                                    className={cn(
                                                        "px-4 py-3 text-sm transition-colors cursor-pointer flex items-center justify-between",
                                                        eventTypeValue === type ? "bg-cyan-500/10 text-cyan-400" : "text-zinc-300 hover:bg-white/5 hover:text-white"
                                                    )}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault(); // Prevent blur
                                                        setValue("event_type", type);
                                                        setShowEventTypePicker(false);
                                                    }}
                                                >
                                                    {type}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div>
                            <SectionHeader icon={Users} title="Capacity & Age" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Min Age</Label><Input type="number" {...register("min_age")} placeholder="0" /></div>
                                <div className="space-y-2"><Label>Max Age</Label><Input type="number" {...register("max_age")} placeholder="99" /></div>
                                <div className="space-y-2"><Label>Min Group</Label><Input type="number" {...register("min_group_size")} placeholder="1" /></div>
                                <div className="space-y-2"><Label>Max Group</Label><Input type="number" {...register("max_group_size")} placeholder="10" /></div>
                            </div>
                        </div>
                        <div>
                            <SectionHeader icon={ClipboardList} title="Requirements" />
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label>What to Bring</Label>
                                    <textarea {...register("what_to_bring")} className={cn(inputClasses, "font-mono text-sm")} placeholder={"Sunscreen\nWater\nCamera"} rows={6} />
                                </div>
                                <div className="space-y-2"><Label>Waiver Link</Label><Input {...register("waiver_link")} placeholder="https://..." /></div>
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
                                    <Label>Check-in Details</Label>
                                    <Input {...register("checkin_details")} placeholder="Meeting point instructions..." />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>Transport Details</Label>
                                    <textarea {...register("transport_details")} rows={2} className={inputClasses} placeholder="Pickup locations and vehicle info..." />
                                </div>
                            </div>
                        </div>

                        <div>
                            <SectionHeader icon={FileText} title="Experience Details" />
                            <div className="space-y-8">
                                <div className="space-y-2"><Label>Full Description</Label><textarea {...register("description")} className={cn(inputClasses, "resize-y min-h-[200px] leading-relaxed")} placeholder="Detailed overview..." /></div>
                                <div className="space-y-2"><Label>Cancellation Policy</Label><textarea {...register("cancellation_policy")} rows={4} className={inputClasses} placeholder="Standard 24h policy..." /></div>
                                <div className="space-y-2"><Label>Restrictions & Disclaimer</Label><textarea {...register("restrictions")} rows={4} className={inputClasses} placeholder="Medical restrictions..." /></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end items-center gap-4 pt-4 border-t border-white/10 mt-8">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {initialData ? "Update" : "Create"}
                    </button>
                    {/* Cancel button removed per user request */}
                </div>
            </form>
        </SidePanel>
    );
}
