"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Plus, Trash2, GripVertical, Check, Search, ChevronDown, Copy, List, Eye, EyeOff, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// DnD Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
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

// --- Zod Schemas ---

const ConfigItemSchema = z.object({
    id: z.string(), // Helper for dnd-kit key (usually field_id)
    field_id: z.string().min(1, "Field required"),
    required: z.boolean().default(false),
    is_public: z.boolean().default(true), // NEW: Visibility toggle
    label: z.string().optional(), // For display only
    type: z.string().optional()   // For display/icon only
});

const BookingOptionScheduleSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional().nullable(),
    config_retail: z.array(ConfigItemSchema),
    config_online: z.array(ConfigItemSchema),
    config_special: z.array(ConfigItemSchema),
    config_custom: z.array(ConfigItemSchema)
});

type BookingOptionScheduleFormData = z.infer<typeof BookingOptionScheduleSchema>;

// --- Components ---

interface SortableItemProps {
    id: string;
    item: any;
    fieldDef?: any; // Full field definition with options
    index: number;
    onRemove: () => void;
    onToggleRequired: (val: boolean) => void;
    onTogglePublic: (val: boolean) => void;
}

// --- Field Preview Component ---
function FieldPreview({ type, fieldDef }: { type: string; fieldDef?: any }) {
    const inputClasses = "w-full bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-zinc-600 flex items-center";

    if (type === 'text' || type === 'textarea') {
        return (
            <div className={cn(inputClasses, type === 'textarea' ? 'h-12 items-start' : '')}>
                <span className="opacity-40 italic text-xs">{type === 'textarea' ? 'Multi-line text...' : 'Text input...'}</span>
            </div>
        );
    }

    if (type === 'select' || type === 'quantity') {
        const options = fieldDef?.options || [];
        return (
            <div className="relative group/preview">
                <div className={cn(inputClasses, "justify-between cursor-default group-hover/preview:border-cyan-500/30 transition-colors")}>
                    <span className="text-zinc-500 text-xs">Select option...</span>
                    <ChevronDown size={14} className="text-zinc-600" />
                </div>
                {options.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-[#1a1f2e] border border-cyan-500/30 rounded-lg shadow-2xl z-30 hidden group-hover/preview:block py-1">
                        {options.slice(0, 3).map((o: any) => (
                            <div key={o.value} className="px-3 py-1.5 text-xs text-zinc-300 hover:bg-cyan-500/10 hover:text-cyan-400">
                                {o.label}
                            </div>
                        ))}
                        {options.length > 3 && (
                            <div className="px-3 py-1.5 text-xs text-zinc-500 italic border-t border-white/5">
                                +{options.length - 3} more
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    if (type === 'checkbox') {
        const options = fieldDef?.options || [{ label: 'Option A' }, { label: 'Option B' }];
        const isMulti = fieldDef?.options?.settings?.allow_multiselect;
        return (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
                {options.slice(0, 3).map((opt: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className={cn(
                            "w-3 h-3 border border-white/30 flex-shrink-0",
                            isMulti ? "rounded" : "rounded-full"
                        )} />
                        <span className="text-xs text-zinc-500">{opt.label}</span>
                    </div>
                ))}
                {options.length > 3 && <span className="text-xs text-zinc-600">+{options.length - 3}</span>}
            </div>
        );
    }

    if (type === 'date') {
        return (
            <div className={cn(inputClasses, "justify-between")}>
                <span className="text-zinc-500 text-xs">Pick a date...</span>
                <CalendarIcon size={14} className="text-zinc-600" />
            </div>
        );
    }

    if (type === 'header') {
        return (
            <div className="border-b border-cyan-500/30 pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">{fieldDef?.label || 'Section'}</span>
            </div>
        );
    }

    if (type === 'transport') {
        return (
            <div className={cn(inputClasses, "justify-between")}>
                <span className="text-zinc-500 text-xs">Select Hotel...</span>
                <ChevronDown size={14} className="text-zinc-600" />
            </div>
        );
    }

    if (type === 'smart_pickup') {
        return (
            <div className={cn(inputClasses, "justify-between")}>
                <select className="w-full bg-transparent appearance-none text-xs text-zinc-500 cursor-not-allowed outline-none" disabled>
                    <option>Pickup Hotel (Smart)...</option>
                </select>
                <ChevronDown size={14} className="text-zinc-600 absolute right-3 pointer-events-none" />
            </div>
        );
    }

    // Default fallback
    return (
        <div className={inputClasses}>
            <span className="opacity-40 italic text-xs">Field preview</span>
        </div>
    );
}

function SortableItem({ id, item, fieldDef, index, onRemove, onToggleRequired, onTogglePublic }: SortableItemProps) {
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
            className="bg-white/5 p-4 rounded-lg border border-white/5 group hover:border-white/10 transition-colors"
        >
            {/* Top Row: Label + Controls */}
            <div className="flex items-center gap-3 mb-3">
                {/* Drag Handle */}
                <div {...attributes} {...listeners} className="cursor-grab text-zinc-600 hover:text-zinc-400 p-1">
                    <GripVertical size={16} />
                </div>

                {/* Field Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-200">{item.label || "Unknown Field"}</span>
                        <span className="text-[10px] uppercase bg-black/40 text-zinc-500 px-1.5 py-0.5 rounded border border-white/5">{item.type || "field"}</span>
                    </div>
                </div>

                {/* Visibility Toggle */}
                <div className="flex items-center gap-2 pr-4 border-r border-white/5 mr-2">
                    <span
                        onClick={() => onTogglePublic(!item.is_public)}
                        className={cn("text-xs font-medium transition-colors cursor-pointer select-none", !item.is_public ? "text-cyan-400" : "text-zinc-500")}
                    >
                        {!item.is_public ? "Private" : "Public"}
                    </span>
                    <Switch
                        checked={!item.is_public}
                        onCheckedChange={(val) => onTogglePublic(!val)}
                        className="data-[state=checked]:bg-cyan-500"
                    />
                </div>

                {/* Required Toggle */}
                <div className="flex items-center gap-2 pr-4 border-r border-white/5 mr-2">
                    <span className={cn("text-xs font-medium", item.required ? "text-cyan-400" : "text-zinc-500")}>
                        {item.required ? "Required" : "Optional"}
                    </span>
                    <Switch
                        checked={item.required}
                        onCheckedChange={onToggleRequired}
                        className="data-[state=checked]:bg-cyan-500"
                    />
                </div>

                {/* Remove */}
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Bottom Row: Visual Preview */}
            <div className="ml-9 mr-2">
                <FieldPreview type={item.type} fieldDef={fieldDef} />
            </div>
        </div>
    );
}

// --- Main Sheet Component ---

interface EditBookingOptionSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export function EditBookingOptionSheet({ isOpen, onClose, onSuccess, initialData }: EditBookingOptionSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<"Retail" | "Online" | "Special" | "Custom">("Retail");
    const [availableFields, setAvailableFields] = useState<any[]>([]);
    const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
    const [fieldSearch, setFieldSearch] = useState("");
    const [saveToAll, setSaveToAll] = useState(false);

    // Sensors for DnD
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const formKeyMap: Record<string, "config_retail" | "config_online" | "config_special" | "config_custom"> = {
        "Retail": "config_retail",
        "Online": "config_online",
        "Special": "config_special",
        "Custom": "config_custom"
    };

    const currentFormKey = formKeyMap[activeTab];

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        setValue,
        formState: { errors, isDirty }
    } = useForm<BookingOptionScheduleFormData>({
        resolver: zodResolver(BookingOptionScheduleSchema) as any,
        defaultValues: {
            name: "",
            description: "",
            config_retail: [],
            config_online: [],
            config_special: [],
            config_custom: []
        }
    });

    // We can't use simple useFieldArray because we have 4 independent arrays.
    // Instead we will rely on watch/setValue pattern for simplicity OR use 4 field arrays. 
    // Given the dynamic nature, watching the array and manual manipulation is often cleaner for drag/drop than useFieldArray, 
    // but useFieldArray is "React Hook Form way".
    // Let's use useFieldArray for all 4 to be safe.

    const retailFields = useFieldArray({ control, name: "config_retail", keyName: "key" });
    const onlineFields = useFieldArray({ control, name: "config_online", keyName: "key" });
    const specialFields = useFieldArray({ control, name: "config_special", keyName: "key" });
    const customFields = useFieldArray({ control, name: "config_custom", keyName: "key" });

    const fieldArrays = {
        "Retail": retailFields,
        "Online": onlineFields,
        "Special": specialFields,
        "Custom": customFields
    };

    const currentArray = fieldArrays[activeTab];

    // Fetch Custom Fields
    useEffect(() => {
        const fetchFields = async () => {
            const { data } = await supabase.from("custom_field_definitions" as any).select("*").order("label");
            if (data) setAvailableFields(data);
        };
        fetchFields();
    }, []);

    // Load Data
    useEffect(() => {
        if (isOpen && initialData) {
            // Need to merge with latest field defs to get labels/types
            const hydrateConfig = (config: any[]) => {
                return (config || []).map(item => {
                    const fieldDef = availableFields.find(f => f.id === item.field_id);
                    return {
                        id: item.field_id, // Use field_id as unique key for dnd
                        field_id: item.field_id,
                        required: item.required,
                        is_public: item.is_public ?? true,
                        label: fieldDef?.label || "Unknown",
                        type: fieldDef?.type || "unknown"
                    };
                });
            };

            // Wait for available fields to load before hydrating fully? 
            // Actually availableFields might lag.
            // For now, load raw data, labels update when availableFields loads.

            reset({
                id: initialData.id,
                name: initialData.name,
                description: initialData.description,
                config_retail: hydrateConfig(initialData.config_retail || []),
                config_online: hydrateConfig(initialData.config_online || []),
                config_special: hydrateConfig(initialData.config_special || []),
                config_custom: hydrateConfig(initialData.config_custom || [])
            });
        } else if (isOpen) {
            reset({
                name: "",
                description: "",
                config_retail: [],
                config_online: [],
                config_special: [],
                config_custom: []
            });
            setSaveToAll(false);
        }
    }, [isOpen, initialData, reset]);

    // Hydrate labels when availableFields updates
    // This is tricky with RHF. We'll just look up labels during render time (in the SortableItem or parent).

    const onSubmit: any = async (data: BookingOptionScheduleFormData) => {
        console.log("onSubmit started", data);
        setIsSubmitting(true);
        try {
            // Strip UI-only fields (label, type, id-helper) before saving
            const cleanConfig = (arr: any[]) => arr.map(i => ({
                field_id: i.field_id,
                required: i.required,
                is_public: i.is_public ?? true
            }));

            let payload: any = {
                name: data.name,
                description: data.description,
                config_retail: cleanConfig(data.config_retail),
                config_online: cleanConfig(data.config_online),
                config_special: cleanConfig(data.config_special),
                config_custom: cleanConfig(data.config_custom)
            };

            console.log("Payload prepared:", payload);

            // Save to All Logic
            if (saveToAll) {
                const sourceConfigKey = formKeyMap[activeTab];
                // @ts-ignore
                const sourceConfigClean = cleanConfig(data[sourceConfigKey]);

                payload.config_retail = sourceConfigClean;
                payload.config_online = sourceConfigClean;
                payload.config_special = sourceConfigClean;
                payload.config_custom = sourceConfigClean;
            }

            if (data.id) {
                console.log("Updating existing schedule:", data.id);
                const { error } = await supabase
                    .from("booking_option_schedules" as any)
                    .update(payload)
                    .eq("id", data.id);
                if (error) {
                    console.error("Supabase Update Error:", error);
                    throw error;
                }
            } else {
                console.log("Inserting new schedule");
                const { error } = await supabase
                    .from("booking_option_schedules" as any)
                    .insert([payload]);
                if (error) {
                    console.error("Supabase Insert Error:", error);
                    throw error;
                }
            }

            console.log("Save successful");
            toast.success("Schedule Saved");
            onSuccess();
            onClose();

        } catch (err: any) {
            console.error("Catch Block Error:", err);
            toast.error("Failed to save schedule: " + (err.message || "Unknown error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Actions ---

    const handleAddField = (fieldId: string) => {
        const fieldDef = availableFields.find(f => f.id === fieldId);
        if (!fieldDef) return;

        // Check if exists
        const exists = currentArray.fields.some((f: any) => f.field_id === fieldId);
        if (exists) {
            toast.error("Field already added");
            return;
        }

        currentArray.append({
            id: fieldId, // Important: use fieldId as id for dnd-kit context
            field_id: fieldId,
            required: false,
            is_public: true,
            label: fieldDef.label,
            type: fieldDef.type
        });
        setIsFieldDropdownOpen(false);
        setFieldSearch("");
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = currentArray.fields.findIndex((i: any) => i.id === active.id);
            const newIndex = currentArray.fields.findIndex((i: any) => i.id === over?.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                currentArray.move(oldIndex, newIndex);
            }
        }
    };

    const handleCopyFromRetail = () => {
        if (activeTab === "Retail") return;
        const retailConfig = watch("config_retail");
        // Deep copy
        const copy = JSON.parse(JSON.stringify(retailConfig));
        currentArray.replace(copy); // fieldArray replace method
        toast.success("Copied from Retail");
    };

    const TabButton = ({ id, label }: { id: typeof activeTab, label: string }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === id
                    ? "border-cyan-500 text-cyan-400 bg-cyan-500/5"
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5 active:bg-white/10"
            )}
        >
            {label}
        </button>
    );

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Booking Options" : "New Booking Options"}
            description="Configure custom field schedules for booking flows."
            width="w-[85vw] max-w-4xl"
            contentClassName="p-0"
        >
            <form onSubmit={handleSubmit(onSubmit, (errors) => console.error("Form Validation Errors:", errors))} className="pb-12 pt-0 h-full flex flex-col">
                {/* Header Config */}
                <div className="px-6 pt-6 pb-4 space-y-4 border-b border-white/5 bg-[#0b1115]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Schedule Name *</Label>
                            <Input {...register("name")} placeholder="e.g. 2026 Adventure Form" className="text-lg font-semibold" />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input {...register("description")} placeholder="Internal context..." />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center border-b border-white/10 mb-0 sticky top-0 bg-[#0b1115] z-10 px-6">
                    <TabButton id="Retail" label="Retail Options" />
                    <TabButton id="Online" label="Online Options" />
                    <TabButton id="Special" label="Special Options" />
                    <TabButton id="Custom" label="Custom Options" />
                </div>

                {/* Builder Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/20">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">{activeTab} Schedule</h3>

                        {activeTab !== "Retail" && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleCopyFromRetail}
                                className="h-8 text-xs bg-black/40 border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white"
                            >
                                <Copy className="mr-2 h-3 w-3" /> Copy Retail
                            </Button>
                        )}
                    </div>

                    {/* Add Field Dropdown */}
                    <div className="relative mb-6 z-20">
                        <div
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white flex items-center justify-between cursor-pointer hover:border-cyan-500/50 transition-colors"
                            onClick={() => setIsFieldDropdownOpen(!isFieldDropdownOpen)}
                        >
                            <span className="text-zinc-400 flex items-center gap-2">
                                <Plus size={16} className="text-cyan-500" />
                                Add Object to Schedule...
                            </span>
                            <ChevronDown size={16} className="text-zinc-500" />
                        </div>

                        {isFieldDropdownOpen && (
                            <div className="absolute top-full left-0 w-full mt-2 bg-[#1a1f2e] border border-cyan-500/30 rounded-lg shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150">
                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <Input
                                        autoFocus
                                        placeholder="Search fields..."
                                        value={fieldSearch}
                                        onChange={(e) => setFieldSearch(e.target.value)}
                                        className="bg-black/20 border-white/10 pl-9 h-9 text-sm"
                                    />
                                </div>
                                <div className="max-h-[240px] overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
                                    {availableFields
                                        .filter(f => f.label.toLowerCase().includes(fieldSearch.toLowerCase()))
                                        .map(field => {
                                            const isAdded = currentArray.fields.some((f: any) => f.field_id === field.id);
                                            return (
                                                <button
                                                    key={field.id}
                                                    type="button"
                                                    disabled={isAdded}
                                                    onClick={() => handleAddField(field.id)}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between group transition-colors",
                                                        isAdded ? "opacity-50 cursor-not-allowed bg-black/20 text-zinc-500" : "hover:bg-cyan-500/10 text-zinc-300 hover:text-cyan-400"
                                                    )}
                                                >
                                                    <span>{field.label}</span>
                                                    {isAdded && <Check size={14} />}
                                                </button>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Drag and Drop List */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={currentArray.fields.map((f: any) => f.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-2">
                                {currentArray.fields.map((field: any, index: number) => {
                                    // Lookup actual label/type for rendering (since field array needs hydration)
                                    const fieldDef = availableFields.find(f => f.id === field.field_id);
                                    const displayItem = {
                                        ...field,
                                        label: fieldDef?.label || field.label,
                                        type: fieldDef?.type || field.type
                                    };

                                    return (
                                        <SortableItem
                                            key={field.id}
                                            id={field.id}
                                            item={displayItem}
                                            fieldDef={fieldDef}
                                            index={index}
                                            onRemove={() => currentArray.remove(index)}
                                            onToggleRequired={(val) => {
                                                currentArray.update(index, { ...field, required: val });
                                            }}
                                            onTogglePublic={(val) => {
                                                currentArray.update(index, { ...field, is_public: val });
                                            }}
                                        />
                                    );
                                })}

                                {currentArray.fields.length === 0 && (
                                    <div className="text-center py-12 border border-dashed border-white/10 rounded-xl text-zinc-600">
                                        <div className="w-12 h-12 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-3">
                                            <List className="text-zinc-700" />
                                        </div>
                                        <p>No option fields in this schedule.</p>
                                        <p className="text-xs mt-1">Add items using the dropdown above.</p>
                                    </div>
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>

                {/* Footer */}
                <div className="shrink-0 flex justify-between items-center gap-4 pt-4 px-6 border-t border-white/10 mt-auto bg-zinc-950/40 backdrop-blur-md">

                    {/* Save to All Option */}
                    <div className="flex items-center gap-2">
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => setSaveToAll(!saveToAll)}
                        >
                            <div className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                saveToAll ? "bg-cyan-500 border-cyan-500 text-black" : "border-zinc-600 bg-transparent group-hover:border-zinc-500"
                            )}>
                                {saveToAll && <Check size={12} strokeWidth={3} />}
                            </div>
                            <Label className="cursor-pointer text-zinc-400 group-hover:text-zinc-300">Save settings to all variations</Label>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            type="submit"
                            disabled={isSubmitting || !isDirty}
                            className={cn(
                                "px-6 py-2 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors",
                                isSubmitting ? "bg-cyan-500/50 text-white cursor-not-allowed" :
                                    isDirty ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]" :
                                        "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                            )}
                        >
                            {isSubmitting ? <><Loader2 className="animate-spin" size={16} /> Saving...</> :
                                isDirty ? <><Save size={16} /> Save Booking Options</> :
                                    "No Changes"}
                        </Button>
                    </div>
                </div>
            </form>
        </SidePanel>
    );
}
