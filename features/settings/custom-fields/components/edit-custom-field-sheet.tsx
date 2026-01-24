"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Save, Plus, Trash2, Type, List, GripVertical, Eye, Settings, ListPlus, ChevronDown, Check, MapPin } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
}).catchall(z.any()); // Allow other future settings

const formSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(3, "Name must be at least 3 chars").regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
    label: z.string().min(1, "Label is required"),
    type: z.enum(['text', 'textarea', 'select', 'quantity', 'checkbox', 'transport', 'header', 'date', 'smart_pickup']),
    description: z.string().optional(),
    is_internal: z.boolean().default(false),
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
    { value: 'text', label: 'Single Line Text', icon: Type },
    { value: 'textarea', label: 'Multi-Line Text', icon: Type },
    { value: 'select', label: 'Dropdown List', icon: List },
    { value: 'quantity', label: 'Quantity Dropdown', icon: ListPlus },
    { value: 'checkbox', label: 'Checkbox', icon: List },
    { value: 'date', label: 'Date Picker', icon: List },
    { value: 'transport', label: 'Hotel & Transport', icon: Settings },
    { value: 'smart_pickup', label: 'Smart Pickup (Location & Time)', icon: MapPin },
    { value: 'header', label: 'Section Header', icon: Type },
];

export function EditCustomFieldSheet({ isOpen, onClose, onSuccess, fieldToEdit }: EditCustomFieldSheetProps) {
    const [activeTab, setActiveTab] = useState<'config' | 'options' | 'preview'>('config');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Preview State for Dropdown/Checkbox
    const [showPreviewDropdown, setShowPreviewDropdown] = useState(false);
    const [previewValue, setPreviewValue] = useState<any>("");

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            label: "",
            type: "text",
            description: "",
            is_internal: false,
            options: [],
            settings: {},
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "options",
    });

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            if (fieldToEdit) {
                // Ensure fieldToEdit has options array if missing
                const resetData = {
                    ...fieldToEdit,
                    options: fieldToEdit.options || [],
                    settings: fieldToEdit.settings || {}
                };
                form.reset(resetData);
            } else {
                form.reset({
                    name: "",
                    label: "",
                    type: "text",
                    description: "",
                    is_internal: false,
                    options: [],
                    settings: {},
                });
            }
            setActiveTab('config');
            setPreviewValue("");
            setShowPreviewDropdown(false);
        }
    }, [isOpen, fieldToEdit, form]);

    // Auto-generate name from label if creating new
    const watchedLabel = form.watch("label");
    useEffect(() => {
        if (!fieldToEdit && watchedLabel) {
            const slug = watchedLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
            form.setValue("name", slug);
        }
    }, [watchedLabel, fieldToEdit, form]);

    if (!isOpen) return null;

    const currentType = form.watch("type");
    const showOptionsTab = ['select', 'quantity', 'checkbox'].includes(currentType);
    const inputClasses = "w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:outline-none transition-colors";

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
                    }]);
                if (error) throw error;
            }
            onSuccess();
            onClose();
            toast.success("Field saved successfully");
        } catch (error: any) {
            console.error("Error saving custom field:", error);
            // Check for common schema errors (missing column)
            if (error?.code === "42703") { // Undefined column
                toast.error("Database schema missing 'settings' column. Please run the SQL migration script.");
            } else {
                const msg = error.message || JSON.stringify(error);
                toast.error(`Failed to save: ${msg}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />

            {/* Side Panel */}
            <div className="fixed inset-y-0 right-0 w-[85vw] max-w-4xl bg-[#0b1115] border-l border-white/10 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0b1115]">
                    <div>
                        <h2 className="text-xl font-semibold text-white">
                            {fieldToEdit ? "Edit Custom Field" : "Create Custom Field"}
                        </h2>
                        <p className="text-sm text-zinc-400">Define data types for booking forms</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-white/5 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('config')}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                activeTab === 'config' ? "bg-cyan-500 text-black shadow-lg" : "text-zinc-400 hover:text-white"
                            )}
                        >
                            <Settings size={14} /> Configuration
                        </button>
                        {showOptionsTab && (
                            <button
                                onClick={() => setActiveTab('options')}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                    activeTab === 'options' ? "bg-cyan-500 text-black shadow-lg" : "text-zinc-400 hover:text-white"
                                )}
                            >
                                <List size={14} /> Options
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={cn(
                                "px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                                activeTab === 'preview' ? "bg-cyan-500 text-black shadow-lg" : "text-zinc-400 hover:text-white"
                            )}
                        >
                            <Eye size={14} /> Preview
                        </button>
                    </div>

                    <Button variant="ghost" size="icon" onClick={onClose} className="text-zinc-400 hover:text-white">
                        <X size={20} />
                    </Button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form id="custom-field-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto">

                        {/* CONFIG TAB */}
                        {activeTab === 'config' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Label - takes full width now */}
                                    <div className="col-span-2 space-y-2">
                                        <Label className="text-zinc-300">Display Label</Label>
                                        <input
                                            {...form.register("label")}
                                            className={inputClasses}
                                            placeholder="e.g. Dietary Restrictions"
                                        />
                                        {form.formState.errors.label && (
                                            <p className="text-red-400 text-xs">{form.formState.errors.label.message}</p>
                                        )}
                                        {/* Hidden Internal Name Input */}
                                        <input type="hidden" {...form.register("name")} />
                                    </div>
                                </div>

                                {/* Type Selection */}
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Field Type</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {FIELD_TYPES.map((t) => {
                                            const Icon = t.icon;
                                            const isSelected = currentType === t.value;
                                            return (
                                                <div
                                                    key={t.value}
                                                    onClick={() => form.setValue("type", t.value as any)}
                                                    className={cn(
                                                        "cursor-pointer rounded-lg border p-4 flex flex-col items-center gap-2 transition-all hover:bg-white/5",
                                                        isSelected
                                                            ? "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                                                            : "bg-[#0b1115] border-white/10 text-zinc-400"
                                                    )}
                                                >
                                                    <Icon size={24} />
                                                    <span className="text-xs font-medium text-center">{t.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Helper / Description</Label>
                                    <textarea
                                        {...form.register("description")}
                                        className={cn(inputClasses, "min-h-[100px]")}
                                        placeholder="Instructions shown to the user filling out this field..."
                                    />
                                </div>

                                {/* Options and Settings Section */}
                                <div className="flex flex-col gap-4">
                                    {/* Privacy */}
                                    <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5">
                                        <div className="space-y-0.5">
                                            <Label className="text-base text-zinc-200">Internal Field Only</Label>
                                            <p className="text-xs text-zinc-500">
                                                If enabled, this field will be hidden from public booking forms.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={form.watch("is_internal")}
                                            onCheckedChange={(c) => form.setValue("is_internal", c)}
                                        />
                                    </div>

                                    {/* Checkbox Specific Settings */}
                                    {currentType === 'checkbox' && (
                                        <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5">
                                            <div className="space-y-0.5">
                                                <Label className="text-base text-zinc-200">Allow Multiple Selections</Label>
                                                <p className="text-xs text-zinc-500">
                                                    Enable to use checkboxes (select multiple). Disable for radio buttons (select one).
                                                </p>
                                            </div>
                                            <Switch
                                                checked={form.watch("settings.allow_multiselect") || false}
                                                onCheckedChange={(c) => form.setValue("settings.allow_multiselect", c)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* OPTIONS TAB */}
                        {activeTab === 'options' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium text-white">Dropdown Options</h3>
                                    <Button
                                        type="button"
                                        onClick={() => append({ label: "", value: "" })}
                                        className="bg-cyan-500 hover:bg-cyan-400 text-black"
                                        size="sm"
                                    >
                                        <Plus size={16} className="mr-2" /> Add Option
                                    </Button>
                                </div>

                                {fields.length === 0 && (
                                    <div className="text-center py-12 text-zinc-500 border border-dashed border-white/10 rounded-lg">
                                        No options defined. Add one to get started.
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5 group">
                                            <div className="mt-3 text-zinc-600">
                                                <GripVertical size={16} />
                                            </div>

                                            <div className="flex-1 grid grid-cols-1 gap-4">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-zinc-500">Label (Display)</Label>
                                                    <input
                                                        {...form.register(`options.${index}.label`)}
                                                        className={cn(inputClasses, "h-10 py-2")}
                                                        placeholder="Option Label"
                                                        onChange={(e) => {
                                                            form.setValue(`options.${index}.label`, e.target.value);
                                                            // Auto-generate value
                                                            const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
                                                            form.setValue(`options.${index}.value`, slug);
                                                        }}
                                                    />
                                                </div>
                                                {/* Hidden Value Input */}
                                                <input type="hidden" {...form.register(`options.${index}.value`)} />
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => remove(index)}
                                                className="mt-8 text-zinc-500 hover:text-red-400"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* PREVIEW TAB */}
                        {activeTab === 'preview' && (
                            <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="w-full max-w-md p-6 rounded-xl border border-white/10 bg-[#0b1115] shadow-2xl">
                                    <h4 className="text-xs uppercase text-cyan-500 font-bold mb-6 tracking-widest">Live Preview</h4>

                                    <div className="space-y-2">
                                        {currentType !== 'header' && (
                                            <Label className="text-white text-xs uppercase tracking-wider ml-1 mb-2 block">
                                                {form.watch("label") || "Field Label"}
                                                {form.watch("is_internal") && <span className="ml-2 text-xs text-amber-500 bg-amber-500/10 px-1 rounded">Internal</span>}
                                            </Label>
                                        )}

                                        {currentType === 'text' && (
                                            <input placeholder="User input..." className={inputClasses} />
                                        )}

                                        {currentType === 'textarea' && (
                                            <textarea placeholder="User input..." className={inputClasses} rows={4} />
                                        )}

                                        {(currentType === 'select' || currentType === 'quantity') && (
                                            <div className="relative">
                                                <div
                                                    onClick={() => setShowPreviewDropdown(!showPreviewDropdown)}
                                                    className={cn(inputClasses, "cursor-pointer flex items-center justify-between hover:border-cyan-500/50")}
                                                >
                                                    <span className={previewValue ? "text-white" : "text-zinc-500"}>
                                                        {previewValue ? form.watch("options").find((o: any) => o.value === previewValue)?.label : "Select an option..."}
                                                    </span>
                                                    <ChevronDown size={16} className="text-zinc-500" />
                                                </div>

                                                {showPreviewDropdown && (
                                                    <div className="absolute top-full left-0 w-full mt-1 bg-[#1a1f2e] border border-cyan-500/30 rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50 divide-y divide-white/5">
                                                        {form.watch("options").map((opt: any) => (
                                                            <div
                                                                key={opt.value}
                                                                onClick={() => {
                                                                    setPreviewValue(opt.value);
                                                                    setShowPreviewDropdown(false);
                                                                }}
                                                                className="px-4 py-3 text-sm text-zinc-300 hover:bg-cyan-500/10 hover:text-cyan-400 cursor-pointer flex items-center justify-between"
                                                            >
                                                                {opt.label}
                                                                {previewValue === opt.value && <Check size={14} className="text-cyan-500" />}
                                                            </div>
                                                        ))}
                                                        {form.watch("options").length === 0 && (
                                                            <div className="px-4 py-3 text-sm text-zinc-500 italic">No options added yet.</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {currentType === 'checkbox' && (
                                            <div className="space-y-3 pt-2">
                                                {form.watch("options").length === 0 && (
                                                    <div className="text-sm text-zinc-500 italic px-2">No options added. Go to "Options" tab.</div>
                                                )}
                                                {form.watch("options").map((opt: any) => {
                                                    const isMulti = form.watch("settings.allow_multiselect");
                                                    const isSelected = isMulti
                                                        ? Array.isArray(previewValue) && previewValue.includes(opt.value)
                                                        : previewValue === opt.value;

                                                    return (
                                                        <div
                                                            key={opt.value}
                                                            className={cn(
                                                                "flex items-center space-x-3 px-3 py-3 rounded-lg border transition-all cursor-pointer group",
                                                                isSelected
                                                                    ? "bg-cyan-500/10 border-cyan-500/50"
                                                                    : "bg-black/20 border-white/10 hover:border-white/20"
                                                            )}
                                                            onClick={() => {
                                                                if (isMulti) {
                                                                    const current = Array.isArray(previewValue) ? previewValue : [];
                                                                    if (current.includes(opt.value)) {
                                                                        setPreviewValue(current.filter((v: any) => v !== opt.value));
                                                                    } else {
                                                                        setPreviewValue([...current, opt.value]);
                                                                    }
                                                                } else {
                                                                    setPreviewValue(opt.value);
                                                                }
                                                            }}
                                                        >
                                                            {/* Box/Radio Indicator */}
                                                            <div className={cn(
                                                                "w-5 h-5 flex items-center justify-center border transition-colors",
                                                                isMulti ? "rounded" : "rounded-full",
                                                                isSelected ? "bg-cyan-500 border-cyan-500 text-black" : "bg-white/5 border-white/20 group-hover:border-cyan-500/50"
                                                            )}>
                                                                {isSelected && <Check size={14} className="stroke-[3]" />}
                                                            </div>
                                                            <span className={cn("text-sm", isSelected ? "text-white" : "text-zinc-400")}>
                                                                {opt.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {currentType === 'header' && (
                                            <div className="py-2 border-b border-white/10 mt-4">
                                                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">{form.watch("label")}</h3>
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
                                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                                                </div>
                                                <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-lg flex items-start gap-3">
                                                    <div className="mt-0.5 text-cyan-500">
                                                        <MapPin size={16} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Pickup Location</div>
                                                        <div className="text-sm text-zinc-200 font-medium">Sheraton Waikiki (Aloha Landing)</div>
                                                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                                                            <span className="bg-white/5 px-1.5 py-0.5 rounded text-white">7:15 AM</span>
                                                            <div className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                                                                Map <ExternalLink size={10} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {form.watch("description") && (
                                            <p className="text-xs text-zinc-500 mt-1 ml-1">{form.watch("description")}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-[#0b1115] flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form="custom-field-form"
                        disabled={isSubmitting}
                        className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold min-w-[120px]"
                    >
                        {isSubmitting ? (
                            <span className="animate-pulse">Saving...</span>
                        ) : (
                            <>
                                <Save size={16} className="mr-2" /> Save Field
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </>
    );
}
