"use client";

import { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Info, Users, Plus, Trash2, DollarSign, Percent, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { LoadingState } from "@/components/ui/loading-state";
import { useAuth } from "@/features/auth/auth-context";

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
    const { effectiveOrganizationId } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<string>(""); // Dynamic - will be set from first variation
    const [customerTypes, setCustomerTypes] = useState<{ id: string, name: string, description: string }[]>([]);
    const [pricingVariations, setPricingVariations] = useState<{ id: string, name: string }[]>([]);
    const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
    const [isLoadingVariations, setIsLoadingVariations] = useState(true);
    const [copyToAll, setCopyToAll] = useState(false); // Copy pricing to all variations
    const tabsRef = useRef<HTMLDivElement>(null);

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
                    .eq("organization_id", effectiveOrganizationId)
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
                    .eq("organization_id", effectiveOrganizationId)
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
                    .insert([{ name: data.name, notes: data.notes, organization_id: effectiveOrganizationId }])
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
                                organization_id: effectiveOrganizationId, // Secure Rate
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
                        organization_id: effectiveOrganizationId, // Secure Rate
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
                "flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",
                activeTab === variationName
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80"
            )}
        >
            <span>{variationName} Rates</span>
        </button>
    );

    // Scroll tabs left/right
    const scrollTabs = (direction: 'left' | 'right') => {
        if (tabsRef.current) {
            const scrollAmount = 150;
            tabsRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const inputClasses = "w-full bg-muted/50 border border-border rounded-lg px-4 py-2.5 text-foreground focus:border-primary/50 focus:outline-none transition-colors";

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
                <div className="px-6 pt-6 pb-4 space-y-4 border-b border-border bg-card">
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
                <div className="flex items-center border-b border-border mb-0 sticky top-0 bg-card z-10">
                    {isLoadingVariations ? (
                        <div className="flex items-center justify-center py-3 w-full px-6">
                            <LoadingState size="sm" message="Loading variations..." />
                        </div>
                    ) : pricingVariations.length === 0 ? (
                        <div className="py-3 text-muted-foreground text-sm w-full text-center px-6">
                            No pricing variations configured. Add some in Settings → Pricing Variations.
                        </div>
                    ) : (
                        <>
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
                                {pricingVariations.map(v => (
                                    <TabButton key={v.id} variationName={v.name} />
                                ))}
                            </div>

                            {/* Right Arrow */}
                            <button
                                type="button"
                                onClick={() => scrollTabs('right')}
                                className="shrink-0 p-3 text-muted-foreground hover:text-primary hover:bg-muted transition-colors border-l border-border"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </>
                    )}
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24">
                    {pricingVariations.length > 0 && activeTab && (
                        <div className="space-y-4 animate-in fade-in duration-300">


                            {currentTabFields.length === 0 && (
                                <div className="text-center py-12 border border-dashed border-border rounded-xl text-muted-foreground">
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
                                            <div className="flex-1 bg-card/40 px-4 py-3 rounded-xl border border-border relative">
                                                {/* Hidden Tier Field - uses activeTab dynamically */}
                                                <input type="hidden" {...register(`rates.${item.index}.tier`)} value={activeTab} />

                                                {/* Mobile Delete Button - Top Right */}
                                                <button
                                                    type="button"
                                                    onClick={() => remove(item.index)}
                                                    className="md:hidden absolute top-2 right-2 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>

                                                {/* Mobile: Two rows, Desktop: Single row grid */}
                                                <div className="flex flex-col md:grid md:grid-cols-12 gap-3">
                                                    {/* Row 1 (Mobile) / Col 1-4 (Desktop): Customer Type */}
                                                    <div className="md:col-span-4 space-y-1 relative pr-10 md:pr-0">
                                                        <Label className="text-xs text-muted-foreground">Customer Type</Label>
                                                        <div
                                                            className={cn(inputClasses, "cursor-pointer flex items-center justify-between pr-3")}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenDropdownIndex(openDropdownIndex === item.index ? null : item.index);
                                                            }}
                                                        >
                                                            <span className={cn(!watch(`rates.${item.index}.customer_type_id`) && "text-muted-foreground")}>
                                                                {customerTypes.find(t => t.id === watch(`rates.${item.index}.customer_type_id`))?.name || "Select Type..."}
                                                            </span>
                                                            <ChevronDown size={14} className="text-muted-foreground" />
                                                        </div>

                                                        {/* Dropdown Options */}
                                                        {openDropdownIndex === item.index && (
                                                            <div className="absolute top-full left-0 w-full mt-1 bg-popover border border-primary/30 rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50 divide-y divide-border">
                                                                {customerTypes.map(type => (
                                                                    <div
                                                                        key={type.id}
                                                                        className={cn(
                                                                            "px-4 py-3 text-sm transition-colors cursor-pointer flex items-center justify-between",
                                                                            watch(`rates.${item.index}.customer_type_id`) === type.id
                                                                                ? "bg-primary/10 text-primary"
                                                                                : "text-foreground hover:bg-muted"
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
                                                            <p className="text-xs text-destructive">Required</p>
                                                        )}
                                                    </div>

                                                    {/* Row 2 (Mobile) / Col 5-8 (Desktop): Price, Tax */}
                                                    <div className="grid grid-cols-2 md:contents gap-2">
                                                        {/* Price */}
                                                        <div className="col-span-1 md:col-span-2 space-y-1">
                                                            <Label className="text-xs text-muted-foreground">Price ($)</Label>
                                                            <div className="relative">
                                                                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
                                                        <div className="col-span-1 md:col-span-2 space-y-1">
                                                            <Label className="text-xs text-muted-foreground">Tax (%)</Label>
                                                            <div className="relative">
                                                                <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                                <input
                                                                    type="number" step="0.01"
                                                                    {...register(`rates.${item.index}.tax_percentage`)}
                                                                    className={cn(inputClasses, "pr-8 text-right")}
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Row 3 (Mobile) / Col 9-12 (Desktop): Total + Delete (desktop only) */}
                                                    <div className="md:col-span-4 flex items-center justify-between gap-2 pt-2 md:pt-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground">Total:</span>
                                                            <span className="text-lg font-semibold text-primary">${total.toFixed(2)}</span>
                                                        </div>
                                                        {/* Desktop Delete Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => remove(item.index)}
                                                            className="hidden md:block p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Insert Button (External) */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => insert(item.index + 1, { tier: activeTab, customer_type_id: "", price: 0, tax_percentage: 0 })}
                                                className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-10 w-10 p-0 shrink-0"
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
                                        className="w-full py-4 border border-dashed border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2"
                                    >
                                        <Plus size={24} className="opacity-50" />
                                        <span className="text-sm font-medium">Add First Rate</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="shrink-0 flex justify-between items-center gap-4 py-4 px-6 border-t border-border mt-auto bg-background/80 backdrop-blur-md">
                    {/* Copy to All Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={copyToAll}
                            onChange={(e) => setCopyToAll(e.target.checked)}
                            className="w-4 h-4 rounded border-border bg-muted/50 text-primary focus:ring-primary/50 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                            Apply to all variations
                        </span>
                    </label>

                    <div className="flex items-center gap-3">
                        <Button
                            type="submit"
                            disabled={isSubmitting || !isDirty}
                            className={cn(
                                "px-6 py-2 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors",
                                isSubmitting ? "bg-primary/50 text-primary-foreground cursor-not-allowed" :
                                    isDirty ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(var(--color-primary),0.4)]" :
                                        "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                            )}
                        >
                            {isSubmitting ? <><Loader2 className="animate-spin" size={16} /> Saving...</> :
                                isDirty ? <><Save size={16} /> Save Schedule</> :
                                    "No Changes"}
                        </Button>
                    </div>
                </div>
            </form>
        </SidePanel >
    );
}

