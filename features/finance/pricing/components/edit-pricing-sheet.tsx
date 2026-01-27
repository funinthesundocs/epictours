"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Info, Users, Plus, Trash2, DollarSign, Percent, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Zod Schemas - tier is now dynamic string
const PricingRateSchema = z.object({
    id: z.string().optional(),
    tier: z.string().min(1, "Tier required"),
    customer_type_id: z.string().min(1, "Type required"),
    price: z.coerce.number().min(0),
    tax_percentage: z.coerce.number().min(0).max(100).default(0).optional(),
});

const PricingScheduleSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    notes: z.string().optional().nullable(),
    rates: z.array(PricingRateSchema)
});

type PricingScheduleFormData = z.infer<typeof PricingScheduleSchema>;

interface EditPricingSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: { id: string, name: string, notes: string | null };
}

export function EditPricingSheet({ isOpen, onClose, onSuccess, initialData }: EditPricingSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<string>(""); // Dynamic - will be set from first variation
    const [customerTypes, setCustomerTypes] = useState<{ id: string, name: string, description: string }[]>([]);
    const [pricingVariations, setPricingVariations] = useState<{ id: string, name: string }[]>([]);
    const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
    const [isLoadingVariations, setIsLoadingVariations] = useState(true);
    const [copyToAll, setCopyToAll] = useState(false); // Copy pricing to all variations

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        setValue,
        formState: { errors, isDirty }
    } = useForm<PricingScheduleFormData>({
        resolver: zodResolver(PricingScheduleSchema),
        defaultValues: {
            name: "",
            notes: "",
            rates: []
        }
    });

    const { fields, append, remove, insert } = useFieldArray({
        control,
        name: "rates"
    });

    // Fetch Pricing Variations and Customer Types on mount
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingVariations(true);
            try {
                // Fetch Pricing Variations
                const { data: variations } = await supabase
                    .from("pricing_variations" as any)
                    .select("id, name, sort_order")
                    .order("sort_order", { ascending: true });

                if (variations && variations.length > 0) {
                    setPricingVariations(variations as any);
                    // Set first variation as default active tab
                    setActiveTab((variations as any)[0].name);
                }

                // Fetch Customer Types
                const { data: types } = await supabase
                    .from("customer_types" as any)
                    .select("id, name, description")
                    .order("name");

                if (types) setCustomerTypes(types as any);
            } catch (err) {
                console.error("Error loading data:", err);
            } finally {
                setIsLoadingVariations(false);
            }
        };
        fetchData();
    }, []);

    // Load Data on Open
    useEffect(() => {
        const loadSchedule = async () => {
            if (isOpen && initialData) {
                // Fetch existing rates
                const { data: rates } = await supabase
                    .from("pricing_rates" as any)
                    .select("*")
                    .eq("schedule_id", initialData.id);

                reset({
                    id: initialData.id,
                    name: initialData.name,
                    notes: initialData.notes,
                    rates: (rates as any) || []
                });
            } else if (isOpen) {
                // New Mode
                reset({
                    name: "",
                    notes: "",
                    rates: []
                });
            }
        };
        loadSchedule();
    }, [isOpen, initialData, reset]);


    const onSubmit: any = async (data: PricingScheduleFormData) => {
        setIsSubmitting(true);
        try {
            let scheduleId = data.id;

            // 1. Save Header (Schedule)
            if (scheduleId) {
                const { error } = await supabase
                    .from("pricing_schedules" as any)
                    .update({ name: data.name, notes: data.notes })
                    .eq("id", scheduleId);
                if (error) throw error;
            } else {
                const { data: newSchedule, error } = await supabase
                    .from("pricing_schedules" as any)
                    .insert([{ name: data.name, notes: data.notes }])
                    .select()
                    .single();
                if (error) throw error;
                scheduleId = (newSchedule as any).id;
            }

            // 2. Save Rates (Delete All & Re-insert Strategy for Simplicity)
            if (scheduleId) {
                // Delete old
                await supabase.from("pricing_rates" as any).delete().eq("schedule_id", scheduleId);

                // Prepare rates to insert
                let ratesToInsert: any[] = [];

                if (copyToAll && pricingVariations.length > 0) {
                    // Copy current tab's rates to ALL variations
                    const currentTabRates = data.rates.filter(r => r.tier === activeTab);

                    for (const variation of pricingVariations) {
                        for (const rate of currentTabRates) {
                            ratesToInsert.push({
                                schedule_id: scheduleId,
                                customer_type_id: rate.customer_type_id,
                                tier: variation.name, // Set tier to each variation name
                                price: rate.price,
                                tax_percentage: rate.tax_percentage
                            });
                        }
                    }
                } else {
                    // Normal save - only save configured rates
                    ratesToInsert = data.rates.map(r => ({
                        schedule_id: scheduleId,
                        customer_type_id: r.customer_type_id,
                        tier: r.tier,
                        price: r.price,
                        tax_percentage: r.tax_percentage
                    }));
                }

                if (ratesToInsert.length > 0) {
                    const { error: ratesError } = await supabase.from("pricing_rates" as any).insert(ratesToInsert);
                    if (ratesError) throw ratesError;
                }
            }

            toast.success("Pricing Schedule Saved");
            onSuccess();
            onClose();

        } catch (err: any) {
            console.error("Error saving pricing:", err);
            toast.error(err.message || "Failed to save");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper to get fields for current tab
    const currentTabFields = fields.map((field, index) => ({ ...field, index })).filter(f => f.tier === activeTab);

    // Dynamic Tab Button Component
    const TabButton = ({ variationName }: { variationName: string }) => (
        <button
            type="button"
            onClick={() => setActiveTab(variationName)}
            className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors min-w-0",
                activeTab === variationName
                    ? "border-cyan-500 text-cyan-400 bg-cyan-500/5"
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5 active:bg-white/10"
            )}
        >
            <span className="truncate">{variationName} Rates</span>
        </button>
    );

    const inputClasses = "w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none transition-colors";

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Pricing Schedule" : "New Pricing Schedule"}
            description="Manage multi-tiered pricing rates."
            width="w-[85vw] max-w-4xl"
            contentClassName="p-0"
        >
            <form onSubmit={handleSubmit(onSubmit, (e) => console.error("Validation:", e))} className="pt-0 h-full flex flex-col">

                {/* Header Fields (Always Visible) */}
                <div className="px-6 pt-6 pb-4 space-y-4 border-b border-white/5 bg-[#0b1115]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Schedule Name *</Label>
                            <Input {...register("name")} placeholder="e.g. 2026 Standard Rates" className="text-lg font-semibold" />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Internal Notes</Label>
                            <Input {...register("notes")} placeholder="Reference info..." />
                        </div>
                    </div>
                </div>

                {/* Dynamic Tabs Header */}
                <div className="flex items-center border-b border-white/10 mb-0 sticky top-0 bg-[#0b1115] z-10 px-6 overflow-x-auto">
                    {isLoadingVariations ? (
                        <div className="flex items-center justify-center py-3 w-full">
                            <Loader2 className="animate-spin text-zinc-500" size={16} />
                            <span className="ml-2 text-zinc-500 text-sm">Loading variations...</span>
                        </div>
                    ) : pricingVariations.length === 0 ? (
                        <div className="py-3 text-zinc-500 text-sm w-full text-center">
                            No pricing variations configured. Add some in Settings → Pricing Variations.
                        </div>
                    ) : (
                        pricingVariations.map(v => (
                            <TabButton key={v.id} variationName={v.name} />
                        ))
                    )}
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24">
                    {pricingVariations.length > 0 && activeTab && (
                        <div className="space-y-4 animate-in fade-in duration-300">


                            {currentTabFields.length === 0 && (
                                <div className="text-center py-12 border border-dashed border-white/10 rounded-xl text-zinc-500">
                                    <p>No rates configured for {activeTab}.</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                {currentTabFields.map((item) => {
                                    const price = Number(watch(`rates.${item.index}.price`) || 0);
                                    const tax = Number(watch(`rates.${item.index}.tax_percentage`) || 0);
                                    const total = price + (price * (tax / 100));

                                    return (
                                        <div key={item.id} className="flex items-center gap-2 group animate-in slide-in-from-left-2 duration-300">
                                            {/* Field Container */}
                                            <div className="flex-1 grid grid-cols-12 gap-3 items-end bg-white/5 px-4 py-2 rounded-xl border border-white/5 relative">
                                                {/* Hidden Tier Field - uses activeTab dynamically */}
                                                <input type="hidden" {...register(`rates.${item.index}.tier`)} value={activeTab} />

                                                {/* Customer Type (Custom Dropdown) */}
                                                <div className="col-span-4 space-y-1 relative">
                                                    <Label className="text-xs text-zinc-400">Customer Type</Label>
                                                    <div
                                                        className={cn(inputClasses, "cursor-pointer flex items-center justify-between pr-3")}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenDropdownIndex(openDropdownIndex === item.index ? null : item.index);
                                                        }}
                                                    >
                                                        <span className={cn(!watch(`rates.${item.index}.customer_type_id`) && "text-zinc-600")}>
                                                            {customerTypes.find(t => t.id === watch(`rates.${item.index}.customer_type_id`))?.name || "Select Type..."}
                                                        </span>
                                                        <ChevronDown size={14} className="text-zinc-500" />
                                                    </div>

                                                    {/* Dropdown Options */}
                                                    {openDropdownIndex === item.index && (
                                                        <div className="absolute top-full left-0 w-full mt-1 bg-[#1a1f2e] border border-cyan-500/30 rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50 divide-y divide-white/5">
                                                            {customerTypes.map(type => (
                                                                <div
                                                                    key={type.id}
                                                                    className={cn(
                                                                        "px-4 py-3 text-sm transition-colors cursor-pointer flex items-center justify-between",
                                                                        watch(`rates.${item.index}.customer_type_id`) === type.id
                                                                            ? "bg-cyan-500/10 text-cyan-400"
                                                                            : "text-zinc-300 hover:bg-white/5 hover:text-white"
                                                                    )}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setValue(`rates.${item.index}.customer_type_id`, type.id);
                                                                        setOpenDropdownIndex(null);
                                                                    }}
                                                                >
                                                                    {type.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <input type="hidden" {...register(`rates.${item.index}.customer_type_id`)} />

                                                    {errors.rates?.[item.index]?.customer_type_id && (
                                                        <p className="text-xs text-red-500">Required</p>
                                                    )}
                                                </div>

                                                {/* Price */}
                                                <div className="col-span-2 space-y-1">
                                                    <Label className="text-xs text-zinc-400">Price ($)</Label>
                                                    <div className="relative">
                                                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                                        <input
                                                            type="number" step="0.01"
                                                            {...register(`rates.${item.index}.price`)}
                                                            onInput={(e) => {
                                                                const target = e.currentTarget;
                                                                const value = target.value;
                                                                if (value.includes(".")) {
                                                                    const [integer, decimal] = value.split(".");
                                                                    if (decimal && decimal.length > 2) {
                                                                        target.value = `${integer}.${decimal.substring(0, 2)}`;
                                                                    }
                                                                }
                                                            }}
                                                            className={cn(inputClasses, "pl-8 text-right")}
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Tax */}
                                                <div className="col-span-2 space-y-1">
                                                    <Label className="text-xs text-zinc-400">Tax (%)</Label>
                                                    <div className="relative">
                                                        <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                                        <input
                                                            type="number" step="0.01"
                                                            {...register(`rates.${item.index}.tax_percentage`)}
                                                            className={cn(inputClasses, "pr-8 text-right")}
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Total (Calculated) */}
                                                <div className="col-span-3 space-y-1">
                                                    <Label className="text-xs text-zinc-400">Total ($)</Label>
                                                    <div className="relative">
                                                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                                                        <div className={cn(inputClasses, "pl-8 text-right bg-white/5 text-zinc-300 cursor-not-allowed")}>
                                                            {total.toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Delete */}
                                                <div className="col-span-1 flex justify-end self-center pb-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => remove(item.index)}
                                                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Insert Button (External) */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => insert(item.index + 1, { tier: activeTab, customer_type_id: "", price: 0, tax_percentage: 0 })}
                                                className="text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 h-10 w-10 p-0 shrink-0"
                                            >
                                                <Plus size={16} />
                                            </Button>
                                        </div>
                                    );
                                })}

                                {/* Empty State / Add First Button */}
                                {currentTabFields.length === 0 && (
                                    <button
                                        type="button"
                                        onClick={() => append({ tier: activeTab, customer_type_id: "", price: 0, tax_percentage: 0 })}
                                        className="w-full py-4 border border-dashed border-white/10 rounded-lg text-zinc-500 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all flex flex-col items-center justify-center gap-2"
                                    >
                                        <Plus size={24} className="opacity-50" />
                                        <span className="text-sm font-medium">Add First Rate</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="shrink-0 flex justify-between items-center gap-4 py-4 px-6 border-t border-white/10 mt-auto bg-zinc-950/40 backdrop-blur-md">
                    {/* Copy to All Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={copyToAll}
                            onChange={(e) => setCopyToAll(e.target.checked)}
                            className="w-4 h-4 rounded border-white/20 bg-black/30 text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors">
                            Copy to all variations
                        </span>
                    </label>

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
                                isDirty ? <><Save size={16} /> Save Schedule</> :
                                    "No Changes"}
                        </Button>
                    </div>
                </div>
            </form>
        </SidePanel>
    );
}

