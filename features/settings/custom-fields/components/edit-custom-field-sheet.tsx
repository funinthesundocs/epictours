"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Save, Plus, Trash2, Type, List, GripVertical, Eye, Settings, ListPlus, ChevronDown, Check, MapPin, Info, ExternalLink, Star, Search, Ban, ChevronsUpDown, Minus, Heading, Calendar as CalendarIcon, Hotel, Circle, AlignJustify, Columns, LayoutGrid, Square, LayoutList, CheckSquare, ToggleRight, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
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

// UI Components
import { Button } from "@/components/ui/button";
import { SidePanel } from "@/components/ui/side-panel";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/custom-select";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Supabase Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Schema ---
const optionSchema = z.object({
    label: z.string().min(1, "Label is required"),
    value: z.string().min(1, "Value is required"),
});

// Define nested settings schema
const settingsSchema = z.object({
    allow_multiselect: z.boolean().optional(),
    searchable: z.boolean().optional(),
    required: z.boolean().optional(),
    quantity_mode: z.enum(["infinite", "range"]).optional().nullable(),
    display_style: z.enum(["text", "counter", "currency"]).optional().nullable(),
    min: z.coerce.number().optional(),
    max: z.coerce.number().optional(),
    step: z.coerce.number().optional(),
    multi_select_style: z.enum(['vertical', 'horizontal', 'columns']).optional(),
    multi_select_columns: z.coerce.number().optional(),
    multi_select_visual: z.enum(['button', 'list']).optional(),
    binary_mode: z.boolean().optional(),
}).catchall(z.any());

const formSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(3, "Name must be at least 3 chars").regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
    label: z.string().min(1, "Label is required"),
    type: z.enum(['text', 'textarea', 'select', 'quantity', 'checkbox', 'transport', 'header', 'date', 'smart_pickup']),
    description: z.string().optional(),
    is_internal: z.boolean().default(false),
    default_value: z.string().optional(),
    options: z.array(optionSchema),
    settings: settingsSchema.default({}),
});

type FormValues = z.infer<typeof formSchema>;

interface EditCustomFieldSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    fieldToEdit?: any | null;
}

const FIELD_TYPES = [
    { value: 'text', label: 'Text Field', icon: Type },
    { value: 'select', label: 'Dropdown', icon: ChevronsUpDown },
    { value: 'checkbox', label: 'Multi Select', icon: List },
    { value: 'date', label: 'Date Picker', icon: CalendarIcon },
    { value: 'transport', label: 'Hotel & Transport', icon: Hotel },
    { value: 'smart_pickup', label: 'Smart Pickup', icon: MapPin },
    { value: 'header', label: 'Section Header', icon: Heading },
];

// --- Sortable Item Component ---
function SortableOptionItem({
    id,
    index,
    register,
    remove,
    insert,
    setValue,
    activeId,
    isDefault,
    onSetDefault,
    fieldValue,
    allowEmpty,
}: {
    id: string,
    index: number,
    register: any,
    remove: (index: number) => void,
    insert: (index: number, value: any) => void,
    setValue: any,
    activeId: string | null,
    isDefault: boolean,
    onSetDefault: () => void,
    fieldValue: string,
    allowEmpty: boolean
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative' as const,
    };

    const inputClasses = "w-full bg-muted/50 border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition-colors h-10";

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 group">
            {/* Field Container */}
            <div className={cn(
                "flex-1 flex items-center gap-2 pr-2 rounded-lg border transition-colors",
                isDefault ? "bg-primary/20 border-primary/30" : "bg-muted/30 border-border"
            )}>
                <div
                    {...attributes}
                    {...listeners}
                    className="text-zinc-600 cursor-grab hover:text-zinc-400 active:cursor-grabbing px-3 py-3 md:px-2 md:py-2 touch-none"
                >
                    <GripVertical size={20} className="md:w-4 md:h-4" />
                </div>

                <div className="flex-1">
                    <input
                        {...(() => {
                            const { onChange, ...rest } = register(`options.${index}.label`);
                            return {
                                ...rest,
                                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                    onChange(e);
                                    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
                                    setValue(`options.${index}.value`, slug, { shouldDirty: true });
                                    // If this was default, update default value too? Not necessary as value changes
                                    // Actually form state 'default_value' is a string. If we change the value here, we should update default_value?
                                    // Complex to sync. Let's assume user re-clicks default if needed or simple slug update works if bound by ref (it's not).
                                    // Simple approch: Just let value update. If slug changes, default_value might point to old slug.
                                    // Fixing:
                                    if (fieldValue === slug) { // Only update if the current default_value matches the old slug
                                        setValue('default_value', slug, { shouldDirty: true });
                                    }
                                }
                            };
                        })()}
                        className={inputClasses}
                        placeholder={`Option ${index + 1}`}
                    />
                    <input type="hidden" {...register(`options.${index}.value`)} />
                </div>

                {/* Default Toggle Button */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onSetDefault}
                                className={cn(
                                    "h-8 w-8 p-0 rounded-full transition-all",
                                    isDefault
                                        ? "text-primary bg-primary/10 hover:bg-primary/20"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                {isDefault ? <Circle size={14} fill="currentColor" strokeWidth={0} /> : <div className="w-3 h-3 rounded-full border-2 border-zinc-600" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{isDefault ? "Default Selection" : "Set as Default"}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 p-0"
                >
                    <Trash2 size={16} />
                </Button>
            </div>

            {/* Plus Button Outside */}
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insert(index + 1, { label: "", value: "" })}
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-10 w-10 p-0 shrink-0"
            >
                <Plus size={16} />
            </Button>
        </div>
    );
}


export function EditCustomFieldSheet({ isOpen, onClose, onSuccess, fieldToEdit }: EditCustomFieldSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Preview State
    const [showPreviewDropdown, setShowPreviewDropdown] = useState(false);
    const [previewValue, setPreviewValue] = useState<any>("");

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: "",
            label: "",
            type: "text",
            description: "",
            is_internal: false,
            default_value: "",
            options: [],
            settings: {
                searchable: true,
                required: false,
            },
        },
    });

    const { fields, append, remove, move, replace, insert } = useFieldArray({
        control: form.control,
        name: "options",
    });

    // DnD Sensors - includes TouchSensor for mobile support
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
    const [activeId, setActiveId] = useState<string | null>(null);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = fields.findIndex((f) => f.id === active.id);
            const newIndex = fields.findIndex((f) => f.id === over.id);
            move(oldIndex, newIndex);
        }
    };

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            if (fieldToEdit) {
                const resetData = {
                    ...fieldToEdit,
                    options: fieldToEdit.options || [],
                    settings: fieldToEdit.settings || { searchable: true, required: false },
                    default_value: fieldToEdit.default_value || "" // Ensure default_value is loaded
                };
                form.reset(resetData);
            } else {
                form.reset({
                    name: "",
                    label: "",
                    type: "text",
                    description: "",
                    is_internal: false,
                    default_value: "",
                    options: [],
                    settings: { searchable: true, required: false },
                });
            }
            setPreviewValue("");
            setShowPreviewDropdown(false);
        }
    }, [isOpen, fieldToEdit, form]);

    // Auto-generate name from label
    const watchedLabel = form.watch("label");
    useEffect(() => {
        if (!fieldToEdit && watchedLabel) {
            const slug = watchedLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
            form.setValue("name", slug);
        }
    }, [watchedLabel, fieldToEdit, form]);

    // Default Options Logic
    const currentType = form.watch("type");


    // const quantityMode = form.watch("settings.quantity_mode"); // Removed
    const showOptionsSection = ['select', 'checkbox'].includes(currentType) || (currentType === 'quantity' && form.watch("settings.display_style") === 'text' && fields.length > 0);
    const prevTypeRef = useRef(currentType);
    const preservedOptionsRef = useRef<any[]>([]);

    // Track last known valid options
    const watchedOptions = form.watch("options");
    useEffect(() => {
        if (watchedOptions && watchedOptions.length > 0) {
            preservedOptionsRef.current = watchedOptions;
        }
    }, [watchedOptions]);

    useEffect(() => {
        if (showOptionsSection) {
            // Switched TO a list type from a non-list type
            // Check if options are empty
            const currentOptions = form.getValues("options");
            if (currentOptions.length === 0) {
                if (preservedOptionsRef.current.length > 0) {
                    // Restore previous options
                    replace(preservedOptionsRef.current);
                } else {
                    // Default fallback
                    replace([
                        { label: "Option 1", value: "option_1" },
                        { label: "Option 2", value: "option_2" },
                        { label: "Option 3", value: "option_3" },
                    ]);
                }
            }
        }
        prevTypeRef.current = currentType;
    }, [currentType, showOptionsSection, form, replace]);

    // Sync Preview with Default Value changes
    const watchedDefault = form.watch("default_value");
    useEffect(() => {
        // When default value changes, update preview to match it
        // This ensures the star click immediately reflects in UI
        if (typeof watchedDefault !== 'undefined') {
            setPreviewValue(watchedDefault);
        }
    }, [watchedDefault]);


    if (!isOpen) return null;

    const inputClasses = "w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none transition-colors";

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        try {
            if (fieldToEdit?.id) {
                const { error } = await supabase
                    .from("custom_field_definitions")
                    .update({
                        name: values.name,
                        label: values.label,
                        type: values.type,
                        description: values.description,
                        is_internal: values.is_internal,
                        options: values.options,
                        settings: values.settings,
                        default_value: values.default_value, // Save default value
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", fieldToEdit.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("custom_field_definitions")
                    .insert([{
                        name: values.name,
                        label: values.label,
                        type: values.type,
                        description: values.description,
                        is_internal: values.is_internal,
                        options: values.options,
                        settings: values.settings,
                        default_value: values.default_value // Save default value
                    }]);
                if (error) throw error;
            }
            onSuccess();
            onClose();
            toast.success("Field saved successfully");
        } catch (error: any) {
            console.error("Error saving custom field:", error);
            if (error?.code === "42703") {
                toast.error("Database schema missing 'settings' or 'default_value' column. Please run migrations.");
            } else {
                const msg = error.message || JSON.stringify(error);
                toast.error(`Failed to save: ${msg}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleDefault = (value: string) => {
        const current = form.getValues("default_value");
        if (current === value) {
            form.setValue("default_value", "", { shouldDirty: true });
        } else {
            form.setValue("default_value", value, { shouldDirty: true });
        }
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={fieldToEdit ? "Edit Custom Field" : "Create Custom Field"}
            description="Define data types for booking forms"
            width="w-full md:w-[85vw] max-w-5xl"
            contentClassName="p-0 flex flex-col h-full overflow-hidden"
        >
            <div className="flex-1 w-full flex flex-col min-h-0 overflow-y-auto bg-transparent">
                <form id="custom-field-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col w-full">

                    {/* Top Section: Label, Internal, and Field Type - Fixed Header */}
                    <div className="shrink-0 pt-6 px-6 md:pt-8 md:px-8 pb-0 border-b border-border space-y-6">

                        {/* Label and Internal Toggle Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Label */}
                            <div className="col-span-2 md:col-span-1 space-y-2">
                                <Label className="text-sm text-muted-foreground">Display Label</Label>
                                <input
                                    {...form.register("label")}
                                    className={inputClasses}
                                    placeholder="e.g. Dietary Restrictions"
                                />
                                {form.formState.errors.label && (
                                    <p className="text-red-400 text-xs">{form.formState.errors.label.message}</p>
                                )}
                                <input type="hidden" {...form.register("name")} />
                            </div>

                            {/* Internal Field Toggle */}
                            <div className="col-span-2 md:col-span-1 flex items-end pb-3 justify-start md:justify-end">
                                {/* Mobile: Field Type + Internal in same row */}
                                <div className="md:hidden flex items-start gap-4 w-full">
                                    {/* Field Type Dropdown */}
                                    <div className="flex-1 flex flex-col gap-2">
                                        <Label className="text-sm text-muted-foreground">Field Type</Label>
                                        <CustomSelect
                                            value={currentType === 'textarea' || currentType === 'quantity' ? 'text' : currentType}
                                            onChange={(val) => form.setValue("type", val as any, { shouldDirty: true })}
                                            options={FIELD_TYPES.map(t => ({
                                                value: t.value,
                                                label: t.label,
                                                icon: <t.icon size={16} className="text-muted-foreground" />
                                            }))}
                                            placeholder="Select field type..."
                                        />
                                    </div>
                                    {/* Internal Toggle */}
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <Label className="text-sm text-muted-foreground">INTERNAL</Label>
                                        <Switch
                                            checked={form.watch("is_internal")}
                                            onCheckedChange={(c) => form.setValue("is_internal", c)}
                                        />
                                    </div>
                                </div>

                                {/* Desktop: Original styled layout with tooltip */}
                                <div className="hidden md:flex items-center gap-4 p-3 rounded-lg border border-border bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-sm text-foreground font-medium cursor-help translate-y-[1px] mb-0">
                                            Internal
                                        </Label>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info size={14} className="text-muted-foreground hover:text-primary transition-colors" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>When enabled, this field will be hidden from<br />public booking forms and only visible to staff.</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <Switch
                                        checked={form.watch("is_internal")}
                                        onCheckedChange={(c) => form.setValue("is_internal", c)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Field Type Selection - Desktop Only */}
                        <div className="hidden md:block space-y-4 pb-6">
                            <Label className="text-sm text-muted-foreground">Field Type</Label>

                            {/* Desktop: Buttons */}
                            <div className="hidden md:flex flex-wrap gap-2">
                                {FIELD_TYPES.map((t) => {
                                    const Icon = t.icon;
                                    // Highlight "Text Field" for text, textarea, or quantity
                                    const isSelected = t.value === currentType || (t.value === 'text' && ['textarea', 'quantity'].includes(currentType));

                                    return (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => {
                                                // If selecting "Text Field" group, default to 'text' if not already in group
                                                if (t.value === 'text') {
                                                    form.setValue("type", "text", { shouldDirty: true });
                                                } else {
                                                    form.setValue("type", t.value as any, { shouldDirty: true });
                                                }
                                            }}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium",
                                                isSelected
                                                    ? "bg-primary/20 border-primary text-primary shadow-sm"
                                                    : "bg-muted border-border text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                            )}
                                        >
                                            <Icon size={16} />
                                            <span>{t.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                        </div>
                    </div>

                    {/* Split Layout: Config vs Preview - Stacked on mobile, side-by-side on desktop */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-border">
                        {/* LEFT COLUMN: Configuration & Options */}
                        <div className="flex flex-col">
                            {/* Configuration Header */}
                            <div className="shrink-0 px-6 py-4 bg-muted/30 backdrop-blur-md border-b border-border sticky top-0 z-10 flex items-center gap-2">
                                <Settings size={16} className="text-primary" />
                                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Configuration</h3>
                            </div>
                            <div className="flex-1 p-6 md:p-8 space-y-6 md:space-y-8">
                                <div className="space-y-6">

                                    {/* Text Field Specific Options (Text/Textarea/Quantity) */}
                                    {['text', 'textarea', 'quantity'].includes(currentType) && (
                                        <div className="pt-0 space-y-4">
                                            <div className="flex justify-between items-center mb-6">
                                                <h4 className="text-xs uppercase text-primary font-bold tracking-widest">Text Field Options</h4>
                                            </div>
                                            <div className="p-1 bg-muted/50 rounded-lg border border-border flex">
                                                {[
                                                    { id: 'text', label: 'Single Line' },
                                                    { id: 'textarea', label: 'Multi-Line' },
                                                    { id: 'quantity', label: 'Number' }
                                                ].map((sub) => (
                                                    <button
                                                        key={sub.id}
                                                        type="button"
                                                        onClick={() => form.setValue("type", sub.id as any, { shouldDirty: true })}
                                                        className={cn(
                                                            "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                                                            currentType === sub.id
                                                                ? "bg-primary/20 text-primary shadow-sm"
                                                                : "text-muted-foreground hover:text-foreground"
                                                        )}
                                                    >
                                                        {sub.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}



                                    {/* Quantity Specific Configuration */}
                                    {currentType === 'quantity' && (
                                        <div className="space-y-6">
                                            {/* Display Style Selector */}
                                            <div className="space-y-4">
                                                <Label className="text-sm text-muted-foreground">Display Style</Label>
                                                <div className="flex bg-muted/50 rounded-lg border border-border p-1">
                                                    {[{ id: 'text', label: 'Text Input' }, { id: 'currency', label: 'Currency' }, { id: 'counter', label: 'Counter' }].map((style) => (
                                                        <button
                                                            key={style.id}
                                                            type="button"
                                                            onClick={() => form.setValue("settings.display_style", style.id as any, { shouldDirty: true })}
                                                            className={cn(
                                                                "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                                                                (form.watch("settings.display_style") || 'text') === style.id
                                                                    ? "bg-primary/20 text-primary shadow-sm"
                                                                    : "text-muted-foreground hover:text-foreground"
                                                            )}
                                                        >
                                                            {style.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Mode Selector */}
                                            <div className="space-y-4">
                                                {/* Unified Range Config (Always Visible for Quantity) */}

                                                {/* Section 1: Range Limits (Hidden for Currency) */}
                                                {form.watch("settings.display_style") !== 'currency' && (
                                                    <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-4">
                                                        <h4 className="text-xs uppercase text-primary font-bold tracking-widest mb-2">Range Limits</h4>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div className="space-y-2">
                                                                <Label className="text-sm text-muted-foreground">Start</Label>
                                                                <input
                                                                    type="number"
                                                                    {...form.register("settings.min")}
                                                                    className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm focus:border-primary/50 focus:outline-none transition-colors"
                                                                />
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label className="text-sm text-muted-foreground">End</Label>
                                                                <input
                                                                    type="number"
                                                                    {...form.register("settings.max")}
                                                                    className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm focus:border-primary/50 focus:outline-none transition-colors"
                                                                />
                                                            </div>

                                                            <div className="space-y-2">
                                                                <Label className="text-sm text-muted-foreground">Increment</Label>
                                                                <input
                                                                    type="number"
                                                                    defaultValue={1}
                                                                    placeholder="1"
                                                                    {...form.register("settings.step")}
                                                                    className="w-full bg-background border border-border rounded px-3 py-2 text-foreground text-sm focus:border-primary/50 focus:outline-none transition-colors"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}


                                            </div>
                                        </div>
                                    )}


                                    {/* Dynamic Options Section (Sorted + Reordered) */}
                                    {showOptionsSection && (
                                        <div className="pt-0 border-t-0 space-y-4">
                                            {/* Layout Style Toolbar (Checkbox Only) */}
                                            {/* Layout Style Toolbar (Checkbox Only) */}
                                            {currentType === 'checkbox' && (
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    {/* Layout Style Toolbar */}
                                                    <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg border border-border w-fit animate-in fade-in slide-in-from-left-2 duration-300">
                                                        {[
                                                            { value: 'vertical', icon: AlignJustify, label: 'Vertical' },
                                                            { value: 'horizontal', icon: Columns, label: 'Horizontal' },
                                                            { value: 'columns', icon: LayoutGrid, label: 'Columns' }
                                                        ].map((layout) => {
                                                            const Icon = layout.icon;
                                                            // Logic: If binary mode is ON, layout styles are inactive.
                                                            const isBinary = form.watch("settings.binary_mode");
                                                            const currentStyle = form.watch("settings.multi_select_style") || 'vertical';
                                                            const isActive = !isBinary && currentStyle === layout.value;
                                                            return (
                                                                <div key={layout.value} className="flex items-center">
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        // Selecting a layout style turns OFF binary mode
                                                                                        form.setValue("settings.binary_mode", false, { shouldDirty: true });
                                                                                        form.setValue("settings.multi_select_style", layout.value as any, { shouldDirty: true });
                                                                                    }}
                                                                                    className={cn(
                                                                                        "p-1.5 rounded-md transition-all",
                                                                                        isActive
                                                                                            ? "bg-cyan-400/20 text-cyan-400 shadow-sm shadow-cyan-400/10"
                                                                                            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                                                                                    )}
                                                                                >
                                                                                    <Icon size={16} />
                                                                                </button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>{layout.label}</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>

                                                                    {/* Form integrated Column Selector */}
                                                                    {layout.value === 'columns' && currentStyle === 'columns' && (
                                                                        <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-white/10 animate-in fade-in zoom-in-50 duration-200">
                                                                            {[2, 3, 4].map((cols) => {
                                                                                const currentCols = Number(form.watch("settings.multi_select_columns")) || 2;
                                                                                return (
                                                                                    <button
                                                                                        key={cols}
                                                                                        type="button"
                                                                                        onClick={() => form.setValue("settings.multi_select_columns", cols, { shouldDirty: true })}
                                                                                        className={cn(
                                                                                            "w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold transition-all",
                                                                                            currentCols === cols
                                                                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                                        )}
                                                                                    >
                                                                                        {cols}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}

                                                        {/* Binary Mode Toggle */}
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const current = form.getValues("settings.binary_mode");
                                                                            const next = !current;
                                                                            form.setValue("settings.binary_mode", next, { shouldDirty: true });
                                                                            if (next) {
                                                                                form.setValue("settings.multi_select_style", null as any, { shouldDirty: true });
                                                                            }
                                                                        }}
                                                                        className={cn(
                                                                            "p-1.5 rounded-md transition-all",
                                                                            form.watch("settings.binary_mode")
                                                                                ? "bg-primary/20 text-primary shadow-sm"
                                                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                        )}
                                                                    >
                                                                        <ToggleRight size={16} />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Binary Mode (Yes/No only)</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>

                                                    {/* Visual Style + Binary Toggle Toolbar */}
                                                    <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg border border-border w-fit animate-in fade-in slide-in-from-left-3 duration-300">
                                                        {[
                                                            { value: 'button', icon: Square, label: 'Button Style (Default)' },
                                                            { value: 'list', icon: LayoutList, label: 'List Style (Compact)' }
                                                        ].map((style) => {
                                                            const Icon = style.icon;
                                                            const currentVisual = form.watch("settings.multi_select_visual") || 'button';
                                                            const isActive = currentVisual === style.value;
                                                            return (
                                                                <TooltipProvider key={style.value}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => form.setValue("settings.multi_select_visual", style.value as any, { shouldDirty: true })}
                                                                                className={cn(
                                                                                    "p-1.5 rounded-md transition-all",
                                                                                    isActive
                                                                                        ? "bg-primary/20 text-primary shadow-sm shadow-primary/10"
                                                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                                                )}
                                                                            >
                                                                                <Icon size={16} />
                                                                            </button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>{style.label}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            );
                                                        })}

                                                    </div>
                                                    {form.watch("settings.binary_mode") && (
                                                        <p className="text-xs text-zinc-500 italic mt-2 animate-in fade-in duration-300">
                                                            No editing available for this layout, it provided a simple yes/no output
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {!form.watch("settings.binary_mode") && (
                                                <div className="flex justify-between items-center mb-6 pt-4">
                                                    <h4 className="text-xs uppercase text-primary font-bold tracking-widest">Options List</h4>
                                                </div>
                                            )}

                                            {/* DnD List (Hidden in Binary Mode) */}
                                            {!form.watch("settings.binary_mode") && (
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={handleDragEnd}
                                                    onDragStart={({ active }) => setActiveId(active.id as string)}
                                                >
                                                    <SortableContext
                                                        items={fields.map(f => f.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <div className="space-y-2">
                                                            {/* Allow Multiple Selections Toggle - First item */}
                                                            {currentType === 'checkbox' && (
                                                                <div className="flex items-center justify-between pr-2 rounded-lg border border-border bg-muted/30">
                                                                    <div className="flex items-center gap-2 px-4 py-2">
                                                                        <Label className="text-sm text-foreground cursor-help translate-y-[1px] mb-0">
                                                                            Allow Multiple Selections
                                                                        </Label>
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Info size={14} className="text-muted-foreground hover:text-primary transition-colors" />
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <p>Enable to use checkboxes (select multiple). Disable for radio buttons (select one).</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    </div>
                                                                    <Switch
                                                                        checked={form.watch("settings.allow_multiselect") || false}
                                                                        onCheckedChange={(c) => form.setValue("settings.allow_multiselect", c)}
                                                                    />
                                                                </div>
                                                            )}

                                                            {/* Allow Empty Toggle - For Select/Dropdowns */}
                                                            {currentType === 'select' && (
                                                                <div className="flex items-center justify-between pr-2 rounded-lg border border-border bg-muted/30">
                                                                    <div className="flex items-center gap-2 px-4 py-2">
                                                                        <Label className="text-sm text-foreground cursor-help translate-y-[1px] mb-0">
                                                                            Allow Empty Option
                                                                        </Label>
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Info size={14} className="text-muted-foreground hover:text-primary transition-colors" />
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <p>Adds a "None" option to the beginning of the list, allowing the user to select nothing.</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    </div>
                                                                    <Switch
                                                                        checked={form.watch("settings.allow_empty") || false}
                                                                        onCheckedChange={(c) => form.setValue("settings.allow_empty", c)}
                                                                    />
                                                                </div>
                                                            )}

                                                            {/* Regular Options */}
                                                            {fields.map((field, index) => {
                                                                const optValue = form.watch(`options.${index}.value`);
                                                                const allowEmpty = form.watch("settings.allow_empty") || false;
                                                                const isDefault = form.watch("default_value") === optValue && optValue !== "";
                                                                return (
                                                                    <SortableOptionItem
                                                                        key={field.id}
                                                                        id={field.id}
                                                                        index={index}
                                                                        register={form.register}
                                                                        remove={remove}
                                                                        insert={insert}
                                                                        setValue={form.setValue}
                                                                        activeId={activeId}
                                                                        isDefault={isDefault}
                                                                        onSetDefault={() => toggleDefault(optValue)}
                                                                        fieldValue={optValue}
                                                                        allowEmpty={allowEmpty}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </SortableContext>
                                                </DndContext>
                                            )}


                                        </div>
                                    )}

                                    {/* Description (Formerly Above Options) */}
                                    <div className="space-y-2 pt-6 border-t border-border">
                                        <Label className="text-sm text-foreground">Helper / Description</Label>
                                        <textarea
                                            {...form.register("description")}
                                            className={cn(inputClasses, "min-h-[100px]")}
                                            placeholder="Instructions shown to the user filling out this field..."
                                        />
                                    </div>

                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: Live Preview */}
                        <div className="flex flex-col">
                            {/* Preview Header */}
                            <div className="shrink-0 px-6 py-4 bg-muted/30 backdrop-blur-md border-b border-border sticky top-0 z-10 flex items-center gap-2">
                                <Eye size={16} className="text-primary" />
                                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Live Preview</h3>
                            </div>
                            <div className="flex-1 p-8 space-y-8">
                                <div className="h-full relative">
                                    <div className="w-full relative">
                                        {/* Header Removed - replaced by sticky header */}

                                        <div className="space-y-2">
                                            {currentType !== 'header' && !(currentType === 'checkbox' && form.watch("settings.binary_mode")) && (
                                                <Label className="text-foreground text-sm uppercase tracking-wider ml-1 mb-2 block flex items-center gap-1">
                                                    {form.watch("label") || "Field Label"}
                                                    {form.watch("settings.required") && <span className="text-red-500 text-lg leading-none">•</span>}
                                                    {form.watch("is_internal") && <span className="ml-2 text-xs text-muted-foreground bg-muted px-1 rounded">Internal</span>}
                                                </Label>
                                            )}

                                            {currentType === 'text' && (
                                                <input placeholder="User input..." className={inputClasses} />
                                            )}

                                            {currentType === 'textarea' && (
                                                <textarea placeholder="User input..." className={inputClasses} rows={4} />
                                            )}

                                            {currentType === 'quantity' && form.watch("settings.display_style") === 'currency' && (
                                                <div className="relative">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium select-none">
                                                        $
                                                    </div>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        className={cn(inputClasses, "pl-7")}
                                                    />
                                                </div>
                                            )}

                                            {currentType === 'quantity' && form.watch("settings.display_style") === 'counter' && (
                                                <div className="flex items-center w-full bg-muted/30 border border-border rounded-lg overflow-hidden transition-colors focus-within:border-primary/50">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            const min = Number(form.watch("settings.min")) || 0;
                                                            const step = Number(form.watch("settings.step")) || 1;
                                                            const current = typeof previewValue === 'number' ? previewValue : min;
                                                            // Logic: If infinite (no Min defined), allow going below 0? Usually "Quantity" implies >= 0 or >= Min. 
                                                            // Adhering to Min limit.
                                                            const newValue = Math.max(min, current - step);
                                                            setPreviewValue(newValue);
                                                        }}
                                                        className="h-10 w-12 flex items-center justify-center bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border-r border-border active:bg-primary/10 active:text-primary"
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        placeholder={String(Number(form.watch("settings.min")) || 0)}
                                                        value={typeof previewValue === 'number' ? previewValue : (Number(form.watch("settings.min")) || 0)}
                                                        onChange={(e) => setPreviewValue(e.target.value === "" ? (Number(form.watch("settings.min")) || 0) : parseInt(e.target.value))}
                                                        className="flex-1 bg-transparent border-none text-center text-foreground h-10 focus:outline-none placeholder:text-muted-foreground appearance-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            const max = form.watch("settings.max") ? Number(form.watch("settings.max")) : Infinity;
                                                            const min = Number(form.watch("settings.min")) || 0;
                                                            const step = Number(form.watch("settings.step")) || 1;
                                                            const current = typeof previewValue === 'number' ? previewValue : min;
                                                            if (current + step <= max) {
                                                                setPreviewValue(current + step);
                                                            }
                                                        }}
                                                        className="h-10 w-12 flex items-center justify-center bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border-l border-border active:bg-primary/10 active:text-primary"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Logic for Quantity Text/Select Hybrid */}
                                            {currentType === 'quantity' && (form.watch("settings.display_style") === 'text' || !form.watch("settings.display_style")) && (
                                                <>
                                                    {form.watch("settings.max") ? (
                                                        // MAX IS SET -> RENDER CUSTOM SELECT (Dropdown)
                                                        <CustomSelect
                                                            value={String(previewValue || "")}
                                                            onChange={(val) => setPreviewValue(val)}
                                                            options={(() => {
                                                                const min = Number(form.watch("settings.min")) || 0;
                                                                const max = Number(form.watch("settings.max"));
                                                                const step = Number(form.watch("settings.step")) || 1;
                                                                const opts = [];
                                                                for (let i = min; i <= max; i += step) {
                                                                    opts.push(String(i));
                                                                }
                                                                return opts;
                                                            })()}
                                                            placeholder="Select quantity..."
                                                            className="py-2.5"
                                                        />
                                                    ) : (
                                                        // MAX IS NOT SET -> RENDER TEXT INPUT (Infinite)
                                                        <input
                                                            type="number"
                                                            placeholder={String(Number(form.watch("settings.min")) || 0)}
                                                            className={inputClasses}
                                                        />
                                                    )}
                                                </>
                                            )}

                                            {/* Preview for Standard Dropdown (Select) */}
                                            {/* Preview for Standard Dropdown (Select) */}
                                            {(currentType === 'select') && (
                                                <div className="space-y-1">
                                                    {(() => {
                                                        const options = form.watch("options") || [];
                                                        const allowEmpty = form.watch("settings.allow_empty");
                                                        // Filter out any options with empty values to prevent duplicate keys
                                                        // Show placeholder for empty options to allow previewing layout, ensuring unique keys
                                                        const validOptions = options.map((opt, idx) => {
                                                            if (!opt.value || opt.value.trim() === '') {
                                                                return { label: '...', value: `__placeholder_${idx}` };
                                                            }
                                                            return opt;
                                                        });
                                                        // Prepend None option if allow_empty is true
                                                        const effectiveOptions = allowEmpty
                                                            ? [{ label: 'None / Empty', value: '' }, ...validOptions]
                                                            : validOptions;

                                                        const defaultValue = form.watch("default_value");
                                                        // If allow_empty and no explicit default, use "" (None)
                                                        // Otherwise use the defaultValue or empty string
                                                        const current = (previewValue !== undefined && previewValue !== null)
                                                            ? previewValue
                                                            : (defaultValue !== undefined ? defaultValue : (allowEmpty ? "" : ""));

                                                        return (
                                                            <Combobox
                                                                value={String(current)}
                                                                onChange={(val) => setPreviewValue(val)}
                                                                options={effectiveOptions}
                                                                placeholder="Search or select..."
                                                                forceOpen={true}
                                                            />
                                                        );
                                                    })()}
                                                </div>
                                            )}

                                            {currentType === 'checkbox' && (
                                                <div className={cn(
                                                    "pt-2",
                                                    (form.watch("settings.multi_select_visual") === 'list' && !form.watch("settings.binary_mode")) ? "border border-border rounded-lg p-3 bg-muted/30" : "", // Outer border for List style, excluded for Binary Mode
                                                    (form.watch("settings.multi_select_style") === 'horizontal') ? "flex flex-wrap gap-3" :
                                                        (form.watch("settings.multi_select_style") === 'columns') ?
                                                            ((Number(form.watch("settings.multi_select_columns") || 2) === 3) ? "grid grid-cols-3 gap-3" :
                                                                (Number(form.watch("settings.multi_select_columns") || 2) === 4) ? "grid grid-cols-4 gap-3" :
                                                                    "grid grid-cols-2 gap-3") :
                                                            "space-y-3" // Default Vertical
                                                )}>
                                                    {/* Binary Mode Handling */}
                                                    {form.watch("settings.binary_mode") ? (
                                                        // Binary Mode: Always a Switch, styling depends on 'Visual Style'
                                                        (form.watch("settings.multi_select_visual") || 'button') === 'button' ? (
                                                            // Button Style -> Boxed Switch (Duplicate of old List style)
                                                            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50 hover:border-muted-foreground/50 transition-colors">
                                                                <span className="text-sm text-foreground font-medium">
                                                                    {form.watch("label") || "Field Label"}
                                                                </span>
                                                                <Switch
                                                                    checked={previewValue === 'yes'}
                                                                    onCheckedChange={(c) => setPreviewValue(c ? 'yes' : 'no')}
                                                                />
                                                            </div>
                                                        ) : (
                                                            // List Style -> derived from Button Style but stripped of box styling
                                                            <div className="flex items-center justify-between p-0 rounded-lg hover:bg-muted/50 transition-colors">
                                                                <span className="text-sm text-foreground font-medium">
                                                                    {form.watch("label") || "Field Label"}
                                                                </span>
                                                                <Switch
                                                                    checked={previewValue === 'yes'}
                                                                    onCheckedChange={(c) => setPreviewValue(c ? 'yes' : 'no')}
                                                                />
                                                            </div>
                                                        )
                                                    ) : (
                                                        // Standard Options List Logic (Non-Binary)
                                                        (form.watch("settings.binary_mode")
                                                            ? [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]
                                                            : (fields.length > 0 ? fields.map(f => ({ label: f.label, value: f.value })) : [{ label: 'Option 1', value: '1' }, { label: 'Option 2', value: '2' }])
                                                        ).map((opt, idx) => {
                                                            const isMulti = form.watch("settings.binary_mode") ? false : (form.getValues().settings?.allow_multiselect);
                                                            const safeOpt = (!opt.value || opt.value.trim() === '')
                                                                ? { ...opt, value: `__placeholder_${idx}`, label: opt.label || '...' }
                                                                : opt;

                                                            const isSelected = isMulti
                                                                ? (Array.isArray(previewValue) && previewValue.includes(safeOpt.value)) || (form.watch("default_value") === safeOpt.value)
                                                                : (previewValue === safeOpt.value) || (form.watch("default_value") === safeOpt.value);

                                                            const isVisualList = form.watch("settings.multi_select_visual") === 'list';

                                                            return (
                                                                <div
                                                                    key={safeOpt.value}
                                                                    className={cn(
                                                                        "flex items-center space-x-3 transition-all cursor-pointer group",
                                                                        isVisualList
                                                                            ? "px-1 py-1 border-none hover:bg-muted/50 rounded"
                                                                            : "px-3 py-3 rounded-lg border",
                                                                        !isVisualList && isSelected
                                                                            ? "bg-primary/10 border-primary/50"
                                                                            : !isVisualList
                                                                                ? "bg-muted/30 border-border hover:border-muted-foreground"
                                                                                : ""
                                                                    )}
                                                                    onClick={() => {
                                                                        if (isMulti) {
                                                                            const current = Array.isArray(previewValue) ? previewValue : (previewValue ? [previewValue] : []);
                                                                            if (current.includes(safeOpt.value)) {
                                                                                setPreviewValue(current.filter((v: any) => v !== safeOpt.value));
                                                                            } else {
                                                                                setPreviewValue([...current, safeOpt.value]);
                                                                            }
                                                                        } else {
                                                                            setPreviewValue(safeOpt.value === previewValue ? '' : safeOpt.value);
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className={cn(
                                                                        "w-5 h-5 flex items-center justify-center border transition-colors",
                                                                        isMulti ? "rounded" : "rounded-full",
                                                                        isSelected ? "bg-primary border-primary text-primary-foreground" : "bg-muted border-muted-foreground/30 group-hover:border-primary/50"
                                                                    )}>
                                                                        {isSelected && <Check size={14} className="stroke-[3]" />}
                                                                    </div>
                                                                    <span className={cn("text-sm", isSelected ? "text-foreground" : "text-muted-foreground")}>
                                                                        {safeOpt.label}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            )}

                                            {currentType === 'header' && (
                                                <div className="py-3 border-b border-border mt-4">
                                                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                                                        {form.watch("label") || "Section Header"}
                                                    </h3>
                                                </div>
                                            )}

                                            {currentType === 'date' && (
                                                <div className="pt-1">
                                                    <DatePicker
                                                        value={previewValue as Date || undefined}
                                                        onChange={(date) => setPreviewValue(date)}
                                                        className="bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                                                        defaultOpen={true}
                                                    />
                                                </div>
                                            )}

                                            {currentType === 'transport' && (
                                                <div className="space-y-3">
                                                    {/* Hotel Selection */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Hotel</label>
                                                        <div className="relative">
                                                            <select className={cn(inputClasses, "appearance-none w-full cursor-not-allowed opacity-100")} disabled defaultValue="">
                                                                <option value="" disabled>-- Select Hotel --</option>
                                                                <option>Sheraton Waikiki</option>
                                                                <option>Hilton Hawaiian Village</option>
                                                                <option>Hyatt Regency</option>
                                                                <option>Royal Hawaiian</option>
                                                            </select>
                                                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                                        </div>
                                                    </div>

                                                    {/* Transport Options */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Transportation</label>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center space-x-3 px-3 py-3 rounded-lg border bg-primary/10 border-primary/50">
                                                                <div className="w-5 h-5 flex items-center justify-center border rounded-full bg-primary border-primary text-primary-foreground">
                                                                    <Check size={14} className="stroke-[3]" />
                                                                </div>
                                                                <span className="text-sm text-foreground">Pick-up / Drop-off</span>
                                                            </div>
                                                            <div className="flex items-center space-x-3 px-3 py-3 rounded-lg border bg-muted/30 border-border">
                                                                <div className="w-5 h-5 flex items-center justify-center border rounded-full bg-muted/50 border-muted-foreground/30"></div>
                                                                <span className="text-sm text-muted-foreground">Self Drive</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {currentType === 'smart_pickup' && (
                                                <div className="space-y-3">
                                                    <div className="relative">
                                                        <select className={cn(inputClasses, "appearance-none w-full cursor-not-allowed opacity-100")} disabled defaultValue="">
                                                            <option value="" disabled>-- Select Pickup Hotel --</option>
                                                            <option>Sheraton Waikiki</option>
                                                            <option>Hilton Hawaiian Village</option>
                                                            <option>Hyatt Regency</option>
                                                        </select>
                                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                                    </div>
                                                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3">
                                                        <div className="mt-0.5 text-primary">
                                                            <MapPin size={16} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="text-[10px] font-bold text-primary uppercase tracking-wider">Pickup Location</div>
                                                            <div className="text-sm text-foreground font-medium">Sheraton Waikiki (Aloha Landing)</div>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                <span className="bg-muted px-1.5 py-0.5 rounded text-foreground">7:15 AM</span>
                                                                <div className="flex items-center gap-1 hover:text-primary transition-colors">
                                                                    Map <ExternalLink size={10} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {form.watch("description") && (
                                                <p className="text-sm text-muted-foreground mt-1 ml-1">{form.watch("description")}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center gap-4 py-4 px-6 border-t border-border mt-auto bg-background/95 backdrop-blur-md">
                <Button
                    type="submit"
                    form="custom-field-form"
                    disabled={isSubmitting || !form.formState.isDirty}
                    className={cn(
                        "bg-primary hover:bg-primary/90 text-primary-foreground font-bold min-w-[120px]",
                        isSubmitting
                            ? "bg-primary/50 text-white cursor-not-allowed"
                            : form.formState.isDirty
                                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(var(--primary)_/_0.4)]"
                                : "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                    )}
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Saving...</span>
                    ) : form.formState.isDirty ? (
                        <span className="flex items-center gap-2"><Save size={16} /> Save Field</span>
                    ) : (
                        "No Changes"
                    )}
                </Button>
            </div>
        </SidePanel>
    );
}
