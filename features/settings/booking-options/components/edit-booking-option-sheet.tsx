"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Plus, Trash2, GripVertical, Check, Search, ChevronDown, ChevronLeft, ChevronRight, Copy, List, Eye, EyeOff, Calendar as CalendarIcon, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Combobox } from "@/components/ui/combobox";

// ...

interface FieldSelectorProps {
    availableFields: any[];
    currentFields: any[];
    onSelect: (fieldId: string) => void;
    onCancel: () => void;
}

function FieldSelector({ availableFields, currentFields, onSelect, onCancel }: FieldSelectorProps) {
    // Filter available options
    const options = availableFields
        .filter(f => !currentFields.some((cf: any) => cf.field_id === f.id))
        .map(f => ({ value: f.id, label: f.label }));

    return (
        <div className="w-full flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150 my-2">
            <div className="flex-1">
                <Combobox
                    value=""
                    onChange={onSelect}
                    options={options}
                    placeholder="Search fields to add..."
                    inputClassName="bg-card border-primary/30 text-foreground placeholder:text-muted-foreground h-11"
                />
            </div>
            <button
                type="button"
                onClick={onCancel}
                className="h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg"
            >
                <X size={18} />
            </button>
        </div>
    );
}

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
    onInsert?: () => void;
}

// --- Field Preview Component ---
function FieldPreview({ type, fieldDef }: { type: string; fieldDef?: any }) {
    const inputClasses = "w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground flex items-center";

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
                <div className={cn(inputClasses, "justify-between cursor-default group-hover/preview:border-primary/30 transition-colors")}>
                    <span className="text-muted-foreground text-xs">Select option...</span>
                    <ChevronDown size={14} className="text-muted-foreground" />
                </div>
                {options.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-card border border-primary/30 rounded-lg shadow-2xl z-30 hidden group-hover/preview:block py-1">
                        {options.slice(0, 3).map((o: any) => (
                            <div key={o.value} className="px-3 py-1.5 text-xs text-foreground hover:bg-primary/10 hover:text-primary">
                                {o.label}
                            </div>
                        ))}
                        {options.length > 3 && (
                            <div className="px-3 py-1.5 text-xs text-muted-foreground italic border-t border-border">
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
                            "w-3 h-3 border border-border flex-shrink-0",
                            isMulti ? "rounded" : "rounded-full"
                        )} />
                        <span className="text-xs text-muted-foreground">{opt.label}</span>
                    </div>
                ))}
                {options.length > 3 && <span className="text-xs text-muted-foreground">+{options.length - 3}</span>}
            </div>
        );
    }

    if (type === 'date') {
        return (
            <div className={cn(inputClasses, "justify-between")}>
                <span className="text-muted-foreground text-xs">Pick a date...</span>
                <CalendarIcon size={14} className="text-muted-foreground" />
            </div>
        );
    }

    if (type === 'header') {
        return (
            <div className="border-b border-primary/30 pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">{fieldDef?.label || 'Section'}</span>
            </div>
        );
    }

    if (type === 'transport') {
        return (
            <div className={cn(inputClasses, "justify-between")}>
                <span className="text-muted-foreground text-xs">Select Hotel...</span>
                <ChevronDown size={14} className="text-muted-foreground" />
            </div>
        );
    }

    if (type === 'smart_pickup') {
        return (
            <div className={cn(inputClasses, "justify-between")}>
                <select className="w-full bg-transparent appearance-none text-xs text-muted-foreground cursor-not-allowed outline-none" disabled>
                    <option>Pickup Hotel (Smart)...</option>
                </select>
                <ChevronDown size={14} className="text-muted-foreground absolute right-3 pointer-events-none" />
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

function SortableItem({ id, item, fieldDef, index, onRemove, onToggleRequired, onTogglePublic, onInsert }: SortableItemProps) {
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
            <div className="flex-1 bg-card px-4 py-3 rounded-xl border border-border relative">
                {/* Mobile Delete Button - Top Right */}
                <button
                    type="button"
                    onClick={onRemove}
                    className="md:hidden absolute top-2 right-2 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                    <Trash2 size={16} />
                </button>

                {/* Desktop: Single row grid / Mobile: Flex with grip on left */}
                <div className="flex gap-3 md:grid md:grid-cols-12 md:items-center">
                    {/* Grip Handle - Spans full height on mobile */}
                    <div {...attributes} {...listeners} className="text-zinc-600 cursor-grab hover:text-zinc-400 active:cursor-grabbing flex items-center border-r border-white/10 pr-3 md:hidden touch-none">
                        <GripVertical size={16} />
                    </div>

                    {/* Content area */}
                    <div className="flex-1 flex flex-col md:contents gap-2">
                        {/* Row 1 (Mobile) / Col 1-4 (Desktop): Grip (desktop) & Label */}
                        <div className="md:col-span-4 flex items-center gap-3 pr-10 md:pr-0">
                            {/* Desktop grip */}
                            <div {...attributes} {...listeners} className="hidden md:block text-muted-foreground cursor-grab hover:text-foreground active:cursor-grabbing border-r border-border pr-3 py-1">
                                <GripVertical size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground truncate" title={item.label}>
                                    {(item.label || "Unknown Field").length > 25
                                        ? (item.label || "Unknown Field").substring(0, 25) + "..."
                                        : (item.label || "Unknown Field")}
                                </span>
                                <span className="text-[10px] uppercase text-muted-foreground">{item.type || "field"}</span>
                            </div>
                        </div>

                        {/* Field Preview - Desktop Only */}
                        <div className="hidden md:block md:col-span-4">
                            <FieldPreview type={item.type} fieldDef={fieldDef} />
                        </div>

                        {/* Row 2 (Mobile) / Col 9-11 (Desktop): Toggles */}
                        <div className="md:col-span-3 flex items-center justify-start md:justify-end gap-4">
                            {/* Public Toggle */}
                            <div className="flex items-center gap-1.5">
                                <span
                                    onClick={() => onTogglePublic(!item.is_public)}
                                    className={cn("text-[10px] font-medium transition-colors cursor-pointer select-none uppercase tracking-wider", !item.is_public ? "text-primary" : "text-muted-foreground")}
                                >
                                    {!item.is_public ? "Private" : "Public"}
                                </span>
                                <Switch
                                    checked={!item.is_public}
                                    onCheckedChange={(val) => onTogglePublic(!val)}
                                    className="scale-90 origin-right data-[state=checked]:bg-primary"
                                />
                            </div>

                            {/* Required Toggle */}
                            <div className="flex items-center gap-1.5">
                                <span className={cn("text-[10px] font-medium uppercase tracking-wider", item.required ? "text-primary" : "text-muted-foreground")}>
                                    {item.required ? "Req" : "Opt"}
                                </span>
                                <Switch
                                    checked={item.required}
                                    onCheckedChange={onToggleRequired}
                                    className="scale-90 origin-right data-[state=checked]:bg-primary"
                                />
                            </div>
                        </div>

                        {/* Desktop Delete Button */}
                        <div className="hidden md:flex md:col-span-1 justify-end">
                            <button
                                type="button"
                                onClick={onRemove}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contextual Insert Button */}
            {onInsert && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onInsert}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-10 w-10 p-0 shrink-0"
                >
                    <Plus size={16} />
                </Button>
            )}
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
    const [isLoadingFields, setIsLoadingFields] = useState(true);
    const [insertIndex, setInsertIndex] = useState<number | null>(null); // null = none, -1 = empty/start, 0+ = after index
    const [saveToAll, setSaveToAll] = useState(false);

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

    const tabsRef = useRef<HTMLDivElement>(null);

    const formKeyMap: Record<string, "config_retail" | "config_online" | "config_special" | "config_custom"> = {
        "Retail": "config_retail",
        "Online": "config_online",
        "Special": "config_special",
        "Custom": "config_custom"
    };

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
        if (isOpen) {
            setIsLoadingFields(true);
            const fetchFields = async () => {
                const { data, error } = await supabase.from("custom_field_definitions" as any).select("*").order("label");
                if (data) setAvailableFields(data);
                if (error) console.error("Error fetching fields:", error);
                setIsLoadingFields(false);
            };
            fetchFields();
        }
    }, [isOpen]);

    // Load Data
    useEffect(() => {
        // Only run if the sheet is open
        if (!isOpen) return;

        // Wait for fields to load before hydrating to ensure we can properly validate/filter
        if (isLoadingFields) return;

        if (initialData) {
            // Need to merge with latest field defs to get labels/types
            const hydrateConfig = (config: any[]) => {
                return (config || [])
                    .filter(item => {
                        // Filter out fields that no longer exist in the system
                        return availableFields.some(f => f.id === item.field_id);
                    })
                    .map(item => {
                        const fieldDef = availableFields.find(f => f.id === item.field_id);
                        return {
                            id: item.field_id, // Use field_id as unique key for dnd
                            field_id: item.field_id,
                            required: item.required,
                            is_public: item.is_public ?? true,
                            label: fieldDef?.label || "Unknown Field",
                            type: fieldDef?.type || "unknown"
                        };
                    });
            };

            reset({
                id: initialData.id,
                name: initialData.name,
                description: initialData.description,
                config_retail: hydrateConfig(initialData.config_retail || []),
                config_online: hydrateConfig(initialData.config_online || []),
                config_special: hydrateConfig(initialData.config_special || []),
                config_custom: hydrateConfig(initialData.config_custom || [])
            });
        } else {
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
    }, [isOpen, initialData, reset, availableFields, isLoadingFields]);

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

    const handleAddField = (fieldId: string, index: number = -1) => {
        const fieldDef = availableFields.find(f => f.id === fieldId);
        if (!fieldDef) return;

        // Check if exists
        const exists = currentArray.fields.some((f: any) => f.field_id === fieldId);
        if (exists) {
            toast.error("Field already added");
            return;
        }

        const newField = {
            id: fieldId, // Important: use fieldId as id for dnd-kit context
            field_id: fieldId,
            required: false,
            is_public: true,
            label: fieldDef.label,
            type: fieldDef.type
        };

        if (index === -1) {
            currentArray.append(newField);
        } else {
            currentArray.insert(index + 1, newField);
        }

        setInsertIndex(null);
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

    const scrollTabs = (direction: 'left' | 'right') => {
        if (tabsRef.current) {
            const scrollAmount = 150;
            tabsRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const TabButton = ({ id, label }: { id: typeof activeTab, label: string }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
                "shrink-0 px-6 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80"
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
            <form onSubmit={handleSubmit(onSubmit, (errors) => console.error("Form Validation Errors:", errors))} className="pt-0 h-full flex flex-col">
                {/* Header Config */}
                <div className="px-6 pt-6 pb-4 space-y-4 border-b border-border">
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
                <div className="flex items-center border-b border-border mb-0 sticky top-0 bg-background z-10">
                    {/* Left Arrow */}
                    <button
                        type="button"
                        onClick={() => scrollTabs('left')}
                        className="shrink-0 p-3 text-muted-foreground hover:text-primary hover:bg-muted transition-colors border-r border-border"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    {/* Scrollable Tabs Container */}
                    <div
                        ref={tabsRef}
                        className="flex-1 flex overflow-x-auto scrollbar-hide"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <TabButton id="Retail" label="Retail Options" />
                        <TabButton id="Online" label="Online Options" />
                        <TabButton id="Special" label="Special Options" />
                        <TabButton id="Custom" label="Custom Options" />
                    </div>

                    {/* Right Arrow */}
                    <button
                        type="button"
                        onClick={() => scrollTabs('right')}
                        className="shrink-0 p-3 text-muted-foreground hover:text-primary hover:bg-muted transition-colors border-l border-border"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Builder Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
                    <div className="flex items-center justify-end mb-6">
                        {activeTab !== "Retail" && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleCopyFromRetail}
                                className="h-8 text-xs bg-black/40 border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                                <Copy className="mr-2 h-3 w-3" /> Copy Retail
                            </Button>
                        )}
                    </div>

                    {/* Empty State Add Button */}
                    {currentArray.fields.length === 0 && (
                        <div className="mb-6">
                            {insertIndex !== -1 ? (
                                <button
                                    type="button"
                                    onClick={() => setInsertIndex(-1)}
                                    className="w-full py-8 border border-dashed border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group"
                                >
                                    <div className="p-3 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                                        <Plus size={24} className="opacity-50 group-hover:opacity-100" />
                                    </div>
                                    <span className="text-sm font-medium">Add First Option</span>
                                </button>
                            ) : (
                                <FieldSelector
                                    availableFields={availableFields}
                                    currentFields={currentArray.fields}
                                    onSelect={(id) => handleAddField(id, -1)}
                                    onCancel={() => setInsertIndex(null)}
                                />
                            )}
                        </div>
                    )}

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
                                        <div key={field.id}>
                                            <SortableItem
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
                                                onInsert={() => setInsertIndex(insertIndex === index ? null : index)}
                                            />
                                            {insertIndex === index && (
                                                <div className="pl-4 mt-2 mb-2 animate-in slide-in-from-top-2 duration-200">
                                                    <FieldSelector
                                                        availableFields={availableFields}
                                                        currentFields={currentArray.fields}
                                                        onSelect={(id) => handleAddField(id, index)}
                                                        onCancel={() => setInsertIndex(null)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>

                {/* Footer */}
                <div className="shrink-0 flex justify-between items-center gap-4 py-4 px-6 border-t border-border mt-auto bg-background/80 backdrop-blur-md">
                    {/* Save to All Option */}
                    <div className="flex items-center gap-2">
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => setSaveToAll(!saveToAll)}
                        >
                            <div className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                saveToAll ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground bg-transparent group-hover:border-foreground"
                            )}>
                                {saveToAll && <Check size={12} strokeWidth={3} />}
                            </div>
                            <Label className="cursor-pointer text-muted-foreground group-hover:text-foreground normal-case text-sm mb-0">Apply to all variations</Label>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            type="submit"
                            disabled={isSubmitting || !isDirty}
                            className={cn(
                                "px-6 py-2 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors",
                                isSubmitting ? "bg-cyan-400/50 text-white cursor-not-allowed" :
                                    isDirty ? "bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]" :
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
