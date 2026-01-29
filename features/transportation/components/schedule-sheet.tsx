"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Plus, Trash2, Calendar, Route, GripVertical } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Combobox } from "@/components/ui/combobox";
import { TimePicker } from "@/components/ui/time-picker";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// DnD Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Master Schema
const StopSchema = z.object({
    id: z.string().optional(),
    pickup_point_id: z.string().min(1, "Location is required"),
    pickup_time: z.string().min(1, "Time is required"),
});

const ScheduleSchema = z.object({
    name: z.string().min(2, "Name is required"),
    start_time: z.string().optional(),
    stops: z.array(StopSchema)
});

type ScheduleFormData = z.infer<typeof ScheduleSchema>;

interface ScheduleSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

// Sortable Stop Row Component
interface SortableStopProps {
    id: string;
    index: number;
    control: any;
    remove: (index: number) => void;
    insert: (index: number, val: any) => void;
    pickupOptions: { value: string; label: string }[];
}

function SortableStop({ id, index, control, remove, insert, pickupOptions }: SortableStopProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-2 group animate-in slide-in-from-left-2 duration-300 select-none"
        >
            {/* Field Container */}
            <div className="flex-1 rounded-lg border bg-white/5 border-white/5 transition-colors focus-within:border-cyan-400/30 relative">
                {/* Mobile Delete Button - Top Right */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="md:hidden absolute top-1 right-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0 rounded-full z-10"
                >
                    <Trash2 size={14} />
                </Button>

                {/* Desktop: Single row / Mobile: Flex with grip on left */}
                <div className="flex gap-0 md:items-center">
                    {/* Grip Handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="text-zinc-600 cursor-grab hover:text-zinc-400 active:cursor-grabbing px-3 py-3 border-r border-white/5 touch-none flex items-center self-stretch"
                    >
                        <GripVertical size={16} />
                    </div>

                    {/* Content Area - Stacked on mobile */}
                    <div className="flex-1 flex flex-col md:flex-row md:items-center pr-8 md:pr-2">
                        {/* Time Input */}
                        <div className="w-32 md:w-32 md:border-r border-b md:border-b-0 border-white/5 relative p-2 md:p-0">
                            <Controller
                                control={control}
                                name={`stops.${index}.pickup_time`}
                                render={({ field }) => (
                                    <TimePicker
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="00:00 AM"
                                        className="w-full md:bg-transparent md:border-none text-white text-sm h-[42px] md:rounded-none px-3 md:hover:bg-white/5 md:shadow-none"
                                    />
                                )}
                            />
                        </div>

                        {/* Location Select */}
                        <div className="flex-1 min-w-0 relative">
                            <Controller
                                control={control}
                                name={`stops.${index}.pickup_point_id`}
                                render={({ field }) => (
                                    <Combobox
                                        options={pickupOptions}
                                        value={field.value}
                                        onChange={(val) => field.onChange(val)}
                                        placeholder="Select Location..."
                                        className="w-full bg-transparent border-none text-white text-sm h-[42px] px-3 shadow-none hover:bg-white/5"
                                    />
                                )}
                            />
                        </div>

                        {/* Desktop Delete Button */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="hidden md:flex text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0 rounded-full mr-1"
                        >
                            <Trash2 size={15} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Insert Button (External) */}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insert(index + 1, { pickup_point_id: "", pickup_time: "" })}
                className="text-zinc-500 hover:text-cyan-400 hover:bg-cyan-400/10 h-10 w-10 p-0 shrink-0"
            >
                <Plus size={16} />
            </Button>
        </div>
    );
}


export function ScheduleSheet({ isOpen, onClose, onSuccess, initialData }: ScheduleSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pickupOptions, setPickupOptions] = useState<{ value: string; label: string }[]>([]);

    // Current Schedule ID
    const [currentScheduleId, setCurrentScheduleId] = useState<string | null>(null);

    const form = useForm<ScheduleFormData>({
        resolver: zodResolver(ScheduleSchema),
        defaultValues: { name: "", start_time: "", stops: [] }
    });

    const { fields, append, remove, insert, replace, move } = useFieldArray({
        control: form.control,
        name: "stops"
    });

    // Sensors for DnD
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = fields.findIndex((f) => f.id === active.id);
            const newIndex = fields.findIndex((f) => f.id === over?.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                move(oldIndex, newIndex);
            }
        }
    };

    // Load Pickup Options
    useEffect(() => {
        const fetchPickups = async () => {
            const { data } = await supabase.from("pickup_points").select("id, name").order("name");
            if (data) {
                setPickupOptions(data.map(p => ({ value: p.id, label: p.name })));
            }
        };
        fetchPickups();
    }, []);

    // Load Data
    useEffect(() => {
        if (isOpen && initialData) {
            setCurrentScheduleId(initialData.id);
            // Fetch stops and then reset form
            const loadWithStops = async () => {
                const { data: stopsData } = await supabase
                    .from("schedule_stops")
                    .select("*")
                    .eq("schedule_id", initialData.id)
                    .order("order_index", { ascending: true })
                    .order("pickup_time", { ascending: true }); // Fallback

                form.reset({
                    name: initialData.name,
                    start_time: initialData.start_time || "",
                    stops: stopsData ? stopsData.map(s => ({
                        id: s.id,
                        pickup_point_id: s.pickup_point_id || "",
                        pickup_time: s.pickup_time || ""
                    })) : []
                });
            };
            loadWithStops();
        } else if (isOpen) {
            // New Mode
            setCurrentScheduleId(null);
            form.reset({ name: "", start_time: "", stops: [] });
            // Add one empty stop by default? Optional.
        }
    }, [isOpen, initialData, form]);

    const handleMasterSubmit = async (data: ScheduleFormData) => {
        setIsSubmitting(true);
        try {
            let scheduleId = currentScheduleId;
            let scheduleError;

            if (scheduleId) {
                const { error } = await supabase
                    .from("schedules")
                    .update({ name: data.name, start_time: data.start_time })
                    .eq("id", scheduleId);
                scheduleError = error;
            } else {
                const { data: newData, error } = await supabase
                    .from("schedules")
                    .insert([{ name: data.name, start_time: data.start_time }])
                    .select()
                    .single();
                scheduleError = error;
                if (newData) scheduleId = newData.id;
            }

            if (scheduleError) throw scheduleError;
            if (!scheduleId) throw new Error("No schedule ID");

            // Sync Stops
            // 1. Get existing IDs in DB
            const { data: existingStops } = await supabase
                .from("schedule_stops")
                .select("id")
                .eq("schedule_id", scheduleId);

            const existingIds = existingStops?.map(s => s.id) || [];
            const formIds = data.stops.map(s => s.id).filter(Boolean);

            // 2. Delete removed
            const toDelete = existingIds.filter(id => !formIds.includes(id));
            if (toDelete.length > 0) {
                await supabase.from("schedule_stops").delete().in("id", toDelete);
            }

            // 3. Upsert (Insert or Update)
            const upsertData = data.stops.map((stop, index) => ({
                id: stop.id, // If undefined, Supabase will generate (if not present in DB, strictly upsert requires id for update, but insert handles new)
                // Actually supabase upsert needs ID to match for update. If `id` is undefined, it skips? No, we shouldn't pass undefined ID for insert mixed with updates usually if we want strict control.
                // But passing `id` if present allows update. If `id` is missing, it inserts.
                schedule_id: scheduleId,
                pickup_point_id: stop.pickup_point_id,
                pickup_time: stop.pickup_time,
                order_index: index
            }));

            // We can't strictly upsert mixed new/old easily if 'id' is key.
            // But we can iterate or use upsert with ignoreDuplicates? 
            // Better: loop upsert is slow but safe. 
            // Or: separate inserts and updates.
            // Supabase `.upsert` works if we map the data correctly. 
            // If `id` is present, it updates. If not, we should NOT send `id` or send `undefined`?
            // Supabase client filters `undefined` usually? 
            // Let's split.
            const toUpdate = upsertData.filter(s => s.id);
            const toInsert = upsertData.filter(s => !s.id).map(({ id, ...rest }) => rest);

            if (toUpdate.length > 0) {
                const { error: upErr } = await supabase.from("schedule_stops").upsert(toUpdate);
                if (upErr) throw upErr;
            }
            if (toInsert.length > 0) {
                const { error: inErr } = await supabase.from("schedule_stops").insert(toInsert);
                if (inErr) throw inErr;
            }

            setCurrentScheduleId(scheduleId);
            toast.success("Schedule saved successfully");
            onSuccess();
            onClose();

        } catch (err: any) {
            console.error("Error saving schedule:", err);
            toast.error(err.message || "Failed to save schedule");
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

    const inputClasses = "w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:border-cyan-400/50 focus:outline-none transition-colors";

    // Custom Fields "Input" style equivalent
    const rowInputClasses = "w-full bg-transparent border-none text-white text-sm focus:ring-0 placeholder:text-zinc-600 h-full py-2 px-3";

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={currentScheduleId ? "Edit Schedule" : "New Schedule"}
            description="Manage schedule details and pickup stops."
            width="max-w-2xl"
            contentClassName="p-0 overflow-hidden flex flex-col"
        >
            <div className="h-full flex flex-col bg-transparent">
                <form id="schedule-form" onSubmit={form.handleSubmit(handleMasterSubmit)} className="h-full flex flex-col">
                    {/* Top Section: Schedule Details (Fixed) */}
                    <div className="shrink-0 p-6 border-b border-white/5 space-y-4">
                        <div className="flex flex-row gap-4 items-end">
                            <div className="flex-1 space-y-2">
                                <Label>Schedule Name</Label>
                                <Input
                                    {...form.register("name")}
                                    placeholder="e.g. Circle Island"
                                />
                                {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
                            </div>
                            <div className="w-32 md:w-40 space-y-2 shrink-0">
                                <Label>
                                    <span className="md:hidden">Start</span>
                                    <span className="hidden md:inline">Default Start Time</span>
                                </Label>
                                <Controller
                                    control={form.control}
                                    name="start_time"
                                    render={({ field }) => (
                                        <TimePicker
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Select Time"
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Route Stops (Scrollable) */}
                    <div className="flex-1 flex flex-col min-h-0 bg-transparent">
                        {/* Sticky Header */}
                        <div className="shrink-0 bg-white/5 backdrop-blur-md border-b border-white/5 sticky top-0 z-10 w-full animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 px-6 py-4">
                                <Route size={16} className="text-cyan-400" />
                                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Route Stops</span>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="p-6 space-y-2">
                                {/* Header Row? Custom fields doesn't usually have a header row for the list itself, but maybe useful here? No, stick to design. */}

                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={fields.map(f => f.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {fields.map((field, index) => (
                                            <SortableStop
                                                key={field.id}
                                                id={field.id}
                                                index={index}
                                                control={form.control}
                                                remove={remove}
                                                insert={insert}
                                                pickupOptions={pickupOptions}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>

                                {/* Empty State / Add First Button */}
                                {fields.length === 0 && (
                                    <button
                                        type="button"
                                        onClick={() => append({ pickup_point_id: "", pickup_time: "" })}
                                        className="w-full py-4 border border-dashed border-white/10 rounded-lg text-zinc-500 hover:text-cyan-400 hover:border-cyan-400/30 hover:bg-cyan-400/5 transition-all flex flex-col items-center justify-center gap-2"
                                    >
                                        <Plus size={24} className="opacity-50" />
                                        <span className="text-sm font-medium">Add First Stop</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex justify-end items-center gap-4 py-4 px-6 border-t border-white/10 mt-auto bg-zinc-950/40 backdrop-blur-md">
                    <Button
                        type="submit"
                        form="schedule-form"
                        disabled={isSubmitting || !form.formState.isDirty}
                        className={cn(
                            "bg-cyan-400 hover:bg-cyan-400 text-white font-bold min-w-[120px]",
                            isSubmitting
                                ? "bg-cyan-400/50 text-white cursor-not-allowed"
                                : form.formState.isDirty
                                    ? "bg-cyan-400 hover:bg-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                        )}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Saving...</span>
                        ) : form.formState.isDirty ? (
                            <span className="flex items-center gap-2"><Save size={16} /> Save Changes</span>
                        ) : (
                            "No Changes"
                        )}
                    </Button>
                </div>
            </div>
        </SidePanel>
    );
}
