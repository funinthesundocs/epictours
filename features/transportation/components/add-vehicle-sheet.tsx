"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Info, Truck, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Helper to handle empty inputs -> null
const emptyToNull = (val: unknown): number | null => {
    if (val === "" || val === null || val === undefined) return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
};

// Zod Schema
const VehicleSchema = z.object({
    name: z.string().min(2, "Name is required"),
    status: z.string().min(1, "Status is required"),
    vendor_id: z.string().optional().nullable(), // Link to vendor
    // Preprocess to handle string inputs from forms safely
    capacity: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z.number({ invalid_type_error: "Capacity is required" }).min(1, "Capacity must be at least 1")
    ),
    license_requirement: z.string().min(1, "License requirement is required"),
    miles_per_gallon: z.preprocess(
        (val) => (val === "" ? null : Number(val)),
        z.number().nullable().optional()
    ),
    plate_number: z.string().min(1, "Plate number is required"),
    vin_number: z.string().optional(),
    dot_number: z.string().optional(),
    rate_per_hour: z.preprocess(
        (val) => (val === "" ? null : Number(val)),
        z.number().nullable().optional()
    ),
    fixed_rate: z.preprocess(
        (val) => (val === "" ? null : Number(val)),
        z.number().nullable().optional()
    ),
    per_pax_rate: z.preprocess(
        (val) => (val === "" ? null : Number(val)),
        z.number().nullable().optional()
    ),
});

type VehicleFormData = z.infer<typeof VehicleSchema>;

interface AddVehicleSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'retired', label: 'Retired' }
];

export function AddVehicleSheet({ isOpen, onClose, onSuccess, initialData }: AddVehicleSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [vendors, setVendors] = useState<{ value: string; label: string }[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isDirty }
    } = useForm<VehicleFormData>({
        resolver: zodResolver(VehicleSchema),
        defaultValues: {
            name: "",
            status: "",
            vendor_id: null,
            capacity: undefined,
            license_requirement: "",
            miles_per_gallon: undefined,
            plate_number: "",
            vin_number: "",
            dot_number: "",
            rate_per_hour: undefined,
            fixed_rate: undefined,
            per_pax_rate: undefined
        }
    });

    // Fetch vendors on mount
    useEffect(() => {
        const fetchVendors = async () => {
            const { data } = await supabase.from('vendors' as any).select('id, name').order('name');
            if (data) {
                setVendors(data.map(v => ({ value: v.id, label: v.name })));
            }
        };
        fetchVendors();
    }, []);

    // Reset when opening/changing mode
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Edit Mode
                reset({
                    name: initialData.name,
                    status: initialData.status,
                    vendor_id: initialData.vendor_id || null, // Load existing
                    capacity: initialData.capacity,
                    license_requirement: initialData.license_requirement || "",
                    miles_per_gallon: initialData.miles_per_gallon,
                    plate_number: initialData.plate_number || "",
                    vin_number: initialData.vin_number || "",
                    dot_number: initialData.dot_number || "",
                    rate_per_hour: initialData.rate_per_hour,
                    fixed_rate: initialData.fixed_rate,
                    per_pax_rate: initialData.per_pax_rate,
                });
            } else {
                // New Mode
                reset({
                    name: "",
                    status: "",
                    vendor_id: null,
                    capacity: undefined,
                    license_requirement: "",
                    miles_per_gallon: undefined,
                    plate_number: "",
                    vin_number: "",
                    dot_number: "",
                    rate_per_hour: undefined,
                    fixed_rate: undefined,
                    per_pax_rate: undefined
                });
            }
        }
    }, [isOpen, initialData, reset]);

    const onSubmit = async (data: VehicleFormData) => {
        setIsSubmitting(true);
        try {
            if (initialData?.id) {
                // Update
                const { error } = await supabase
                    .from("vehicles")
                    .update(data)
                    .eq("id", initialData.id);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from("vehicles")
                    .insert([data]);
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error saving vehicle:", err);
            alert("Failed to save vehicle.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const SectionHeader = ({ icon: Icon, title, className }: { icon: any, title: string, className?: string }) => (
        <div className={cn("flex items-center gap-2 bg-muted/30 -mx-6 px-6 py-3 mb-6 border-y border-border", className)}>
            <Icon size={16} className="text-primary" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</h3>
        </div>
    );

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Vehicle" : "Add Vehicle"}
            description="Manage vehicle details, rates, and compliance."
            width="max-w-2xl"
            contentClassName="p-0 overflow-hidden flex flex-col"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-6 space-y-8">
                    {/* 1. Basic Info */}
                    <div>
                        <SectionHeader icon={Info} title="Vehicle Information" className="-mt-6 border-t-0" />
                        <div className="grid grid-cols-3 gap-6">
                            {/* Row 1: Name (2/3) + Status (1/3) */}
                            <div className="space-y-2 col-span-2">
                                <Label>Vehicle Name</Label>
                                <Input {...register("name")} placeholder="e.g. Mercedes Sprinter" />
                                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Combobox
                                    options={statusOptions}
                                    value={watch('status')}
                                    onChange={(val) => setValue('status', val)}
                                />
                                {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
                            </div>

                            {/* Row 2: Vendor (2/3) + Capacity (1/3) */}
                            <div className="space-y-2 col-span-2">
                                <Label>Vendor (Optional)</Label>
                                <Combobox
                                    options={vendors}
                                    value={watch('vendor_id') || ""}
                                    onChange={(val) => setValue('vendor_id', val || null)}
                                    placeholder="Select Vendor..."
                                />
                                <p className="text-[10px] text-muted-foreground">Leave empty for internal fleet.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Capacity</Label>
                                <Input type="number" {...register("capacity")} placeholder="e.g. 14" />
                                {errors.capacity && <p className="text-xs text-destructive">{errors.capacity.message}</p>}
                            </div>
                        </div>
                    </div>

                    {/* 2. Technical & Compliance */}
                    <div>
                        <SectionHeader icon={Truck} title="Compliance & Specs" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>License Requirement</Label>
                                <Input {...register("license_requirement")} placeholder="e.g. CDL Class B" />
                                {errors.license_requirement && <p className="text-xs text-destructive">{errors.license_requirement.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>License Plate</Label>
                                <Input {...register("plate_number")} className="uppercase" placeholder="ABC-1234" />
                                {errors.plate_number && <p className="text-xs text-destructive">{errors.plate_number.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>VIN Number</Label>
                                <Input {...register("vin_number")} className="uppercase" placeholder="VIN..." />
                            </div>
                            <div className="space-y-2">
                                <Label>DOT Number</Label>
                                <Input {...register("dot_number")} placeholder="USDOT..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Fuel Efficiency (MPG)</Label>
                                <Input type="number" step="0.1" {...register("miles_per_gallon")} placeholder="e.g. 18.5" />
                            </div>
                        </div>
                    </div>

                    {/* 3. Financials */}
                    <div>
                        <SectionHeader icon={Wallet} title="Financial Rates" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label>Rate Per Hour ($)</Label>
                                <Input type="number" step="0.01" {...register("rate_per_hour")} placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <Label>Fixed Rate ($)</Label>
                                <Input type="number" step="0.01" {...register("fixed_rate")} placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <Label>Per PAX Rate ($)</Label>
                                <Input type="number" step="0.01" {...register("per_pax_rate")} placeholder="0.00" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end items-center gap-4 py-4 px-6 border-t border-border mt-auto bg-card">
                    <Button
                        type="submit"
                        disabled={isSubmitting || !isDirty}
                        className={cn(
                            "px-6 py-2 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors",
                            isSubmitting ? "bg-primary/50 text-primary-foreground cursor-not-allowed" :
                                isDirty ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" :
                                    "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                        )}
                    >
                        {isSubmitting ? <><Loader2 className="animate-spin" size={16} /> Saving...</> :
                            isDirty ? <><Save size={16} /> {initialData ? "Update" : "Create"}</> :
                                "No Changes"}
                    </Button>
                </div>
            </form>
        </SidePanel>
    );
}
