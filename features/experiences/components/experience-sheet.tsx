"use client";
// @read: docs/SOP_Form_Development.md
// @read: docs/ANTI_PATTERNS.md

import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Info, ClipboardList, Clock, Users, FileText, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimePicker } from "@/components/ui/time-picker";
import { toast } from "sonner";
import { Experience, ExperienceFormData, ExperienceSchema, NewExperience } from "../types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";

interface ExperienceSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Experience;
}

// Generate Time Options (05:00 AM to 11:45 PM)
// const timeOptions = ... (Removed in favor of TimePicker)

export function ExperienceSheet({ isOpen, onClose, onSuccess, initialData }: ExperienceSheetProps) {
    const { effectiveOrganizationId } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Custom Time Picker State
    // const [showStartPicker, setShowStartPicker] = useState(false);
    // const [showEndPicker, setShowEndPicker] = useState(false);
    const [showEventTypePicker, setShowEventTypePicker] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState<"basics" | "pricing" | "booking" | "legal">("basics");

    // Refs for click outside
    // const startWrapperRef = useRef<HTMLDivElement>(null);
    // const endWrapperRef = useRef<HTMLDivElement>(null);
    const eventTypeWrapperRef = useRef<HTMLDivElement>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        control, // Added control
        formState, // Destructure full formState to access isDirty
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
            setActiveTab("basics"); // Reset tab on new
        }
    }, [isOpen, initialData, reset]);

    // ... (keep logic same) ...

    // Close pickers on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            // if (startWrapperRef.current && !startWrapperRef.current.contains(event.target as Node)) {
            //     setShowStartPicker(false);
            // }
            // if (endWrapperRef.current && !endWrapperRef.current.contains(event.target as Node)) {
            //     setShowEndPicker(false);
            // }
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
                    const { error } = await supabase.from("experiences").insert([{ ...dbData, organization_id: effectiveOrganizationId }]);
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
        <div className="flex items-center gap-2 bg-muted/50 -mx-6 px-6 py-3 mb-6 border-y border-border">
            <Icon size={16} className="text-primary" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</h3>
        </div>
    );
    // Updated to match Input component (bg-muted/50)
    const inputClasses = "w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition-colors text-sm shadow-sm";
    const labelClasses = "text-xs font-medium text-muted-foreground uppercase tracking-wider ml-1";

    const eventTypeOptions = ["Tour", "Activity", "Transport", "Event"];

    // Tab Button Component
    const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon?: any }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted"
            )}
        >
            {Icon && <Icon size={16} />}
            {label}
        </button>
    );

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Experience" : "New Experience"}
            description="Manage your inventory details."
            width="full-content"
            contentClassName="p-0 h-full flex flex-col"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
                {/* Tabs Header */}
                <div className="shrink-0 flex items-center border-b border-border bg-background px-6 z-10">
                    <TabButton id="basics" label="The Basics" icon={Info} />
                    <TabButton id="legal" label="Legal & Waivers" icon={FileText} />
                    <TabButton id="pricing" label="Pricing" icon={Users} />
                    <TabButton id="booking" label="Booking Options" icon={ClipboardList} />
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* TAB: THE BASICS */}
                    {activeTab === "basics" && (
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-y-6 xl:gap-0 xl:divide-x xl:divide-border animate-in fade-in duration-300 slide-in-from-left-4 pt-8 pb-6">
                            {/* COLUMN 1: BASICS & CAPACITY */}
                            <div className="xl:col-span-4 space-y-10 px-6">
                                <div>
                                    <SectionHeader icon={Info} title="Basic Information" />
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label>Experience Name *</Label>
                                            <Input {...register("name")} className="text-lg font-semibold" placeholder="e.g. Grand Circle Island Tour" />
                                            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
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
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
                                            </div>
                                            {showEventTypePicker && (
                                                <div className="absolute top-full left-0 w-full mt-1 bg-popover border border-border rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50 divide-y divide-border">
                                                    {eventTypeOptions.map(type => (
                                                        <div
                                                            key={type}
                                                            className={cn(
                                                                "px-4 py-3 text-sm transition-colors cursor-pointer flex items-center justify-between",
                                                                eventTypeValue === type ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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
                                    </div>
                                </div>
                            </div>

                            {/* COLUMN 2: LOGISTICS */}
                            <div className="xl:col-span-4 space-y-10 px-6">
                                <div>
                                    <SectionHeader icon={Clock} title="Logistics & Timing" />
                                    <div className="space-y-6">

                                        {/* Start Time with Standard Picker */}
                                        <div className="space-y-2">
                                            <Label>Start Time</Label>
                                            <Controller
                                                control={control}
                                                name="start_time"
                                                render={({ field }) => (
                                                    <TimePicker
                                                        value={field.value || undefined}
                                                        onChange={field.onChange}
                                                        placeholder="Select Start Time"
                                                    />
                                                )}
                                            />
                                        </div>

                                        {/* End Time with Standard Picker */}
                                        <div className="space-y-2">
                                            <Label>End Time</Label>
                                            <Controller
                                                control={control}
                                                name="end_time"
                                                render={({ field }) => (
                                                    <TimePicker
                                                        value={field.value || undefined}
                                                        onChange={field.onChange}
                                                        placeholder="Select End Time"
                                                    />
                                                )}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Check-in Details</Label>
                                            <Input {...register("checkin_details")} placeholder="Meeting point instructions..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Transport Details</Label>
                                            <textarea {...register("transport_details")} rows={2} className={inputClasses} placeholder="Pickup locations and vehicle info..." />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMN 3: DETAILS */}
                            <div className="xl:col-span-4 space-y-10 px-6">
                                <div>
                                    <SectionHeader icon={FileText} title="Experience Details" />
                                    <div className="space-y-8">
                                        <div className="space-y-2">
                                            <Label>Full Description</Label>
                                            <textarea
                                                {...register("description")}
                                                className={cn(inputClasses, "resize-y min-h-[400px] leading-relaxed")}
                                                placeholder="Detailed overview..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: LEGAL & WAIVERS */}
                    {activeTab === "legal" && (
                        <div className="animate-in fade-in duration-300 slide-in-from-right-4 space-y-10 px-6 pt-8">
                            <div>
                                <SectionHeader icon={FileText} title="Legal Policies" />
                                <div className="grid grid-cols-1 gap-8">
                                    <div className="space-y-2">
                                        <Label>Cancellation Policy</Label>
                                        <textarea {...register("cancellation_policy")} rows={6} className={inputClasses} placeholder="Enter your cancellation policy here..." />
                                        <p className="text-xs text-muted-foreground">Visible to customers during checkout and in their booking confirmation.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Restrictions & Disclaimer</Label>
                                        <textarea {...register("restrictions")} rows={6} className={inputClasses} placeholder="Medical restrictions, accessibility info, liability disclaimers..." />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <SectionHeader icon={ClipboardList} title="Waiver Configuration" />
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Digital Waiver Link</Label>
                                        <Input {...register("waiver_link")} placeholder="https://smartwaiver.com/v/..." />
                                        <p className="text-xs text-muted-foreground">Provide a link to your external digital waiver service (e.g. SmartWaiver).</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: PRICING */}
                    {activeTab === "pricing" && (
                        <div className="min-h-[400px] flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-300 slide-in-from-right-4 px-6 pt-8">
                            <Users size={48} className="mb-4 text-muted-foreground/50" />
                            <h3 className="text-lg font-medium text-foreground">Pricing Configuration</h3>
                            <p className="text-sm">Manage ticket types, seasonal rates, and adjustments.</p>
                            <p className="text-xs text-muted-foreground mt-2">Coming soon to the Deep Core.</p>
                        </div>
                    )}

                    {/* TAB: BOOKING OPTIONS */}
                    {activeTab === "booking" && (
                        <div className="min-h-[400px] flex flex-col items-center justify-center text-muted-foreground animate-in fade-in duration-300 slide-in-from-right-4 px-6 pt-8">
                            <ClipboardList size={48} className="mb-4 text-muted-foreground/50" />
                            <h3 className="text-lg font-medium text-foreground">Booking Options</h3>
                            <p className="text-sm">Configure cut-off times, availability rules, and instant confirmation.</p>
                            <p className="text-xs text-muted-foreground mt-2">Coming soon to the Deep Core.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 flex justify-end items-center gap-4 py-4 px-6 border-t border-border mt-auto bg-background/95 backdrop-blur-md">
                    <Button
                        type="submit"
                        disabled={isSubmitting || !formState.isDirty}
                        className={cn(
                            "px-6 py-2 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors",
                            isSubmitting ? "bg-primary/50 text-primary-foreground cursor-not-allowed" :
                                formState.isDirty ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow" :
                                    "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                        )}
                    >
                        {isSubmitting ? <><Loader2 className="animate-spin" size={16} /> Saving...</> :
                            formState.isDirty ? <><Save size={16} /> {initialData ? "Update" : "Create"}</> :
                                "No Changes"}
                    </Button>
                </div>
            </form>
        </SidePanel>
    );
}
