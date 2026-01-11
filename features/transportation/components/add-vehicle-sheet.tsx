"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Combobox } from "@/components/ui/combobox";

// Zod Schema
const VehicleSchema = z.object({
    name: z.string().min(2, "Name is required"),
    status: z.string(),
    capacity: z.number().min(1, "Capacity must be at least 1"),
    license_requirement: z.string().min(1, "License requirement is required"),
    miles_per_gallon: z.number().min(0),
    plate_number: z.string().min(1, "Plate number is required"),
    vin_number: z.string().optional(),
    dot_number: z.string().optional(),
    rate_per_hour: z.number().min(0),
    fixed_rate: z.number().min(0),
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

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors }
    } = useForm<VehicleFormData>({
        resolver: zodResolver(VehicleSchema),
        defaultValues: {
            name: "",
            status: "active",
            capacity: 0,
            license_requirement: "",
            miles_per_gallon: 0,
            plate_number: "",
            vin_number: "",
            dot_number: "",
            rate_per_hour: 0,
            fixed_rate: 0
        }
    });

    // Reset when opening/changing mode
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Edit Mode
                reset({
                    name: initialData.name,
                    status: initialData.status,
                    capacity: initialData.capacity,
                    license_requirement: initialData.license_requirement || "",
                    miles_per_gallon: initialData.miles_per_gallon || 0,
                    plate_number: initialData.plate_number || "",
                    vin_number: initialData.vin_number || "",
                    dot_number: initialData.dot_number || "",
                    rate_per_hour: initialData.rate_per_hour || 0,
                    fixed_rate: initialData.fixed_rate || 0,
                });
            } else {
                // New Mode
                reset({
                    name: "",
                    status: "active",
                    capacity: 0,
                    license_requirement: "",
                    miles_per_gallon: 0,
                    plate_number: "",
                    vin_number: "",
                    dot_number: "",
                    rate_per_hour: 0,
                    fixed_rate: 0
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

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Vehicle" : "Add Vehicle"}
            description="Manage vehicle details, rates, and compliance."
            width="max-w-2xl"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* 1. Basic Info */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                    <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Vehicle Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Vehicle Name</label>
                            <input {...register("name")} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none" placeholder="e.g. Mercedes Sprinter" />
                            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Status</label>
                            <Combobox
                                options={statusOptions}
                                value={watch('status')}
                                onChange={(val) => setValue('status', val)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Capacity</label>
                            <input
                                type="number"
                                {...register("capacity", { valueAsNumber: true })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
                            />
                            {errors.capacity && <p className="text-xs text-red-400">{errors.capacity.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">License Required</label>
                            <input {...register("license_requirement")} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none" placeholder="e.g. CDL Class B" />
                            {errors.license_requirement && <p className="text-xs text-red-400">{errors.license_requirement.message}</p>}
                        </div>
                    </div>
                </div>

                {/* 2. Technical & Compliance */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                    <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Compliance & Specs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Plate Number</label>
                            <input {...register("plate_number")} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none font-mono" />
                            {errors.plate_number && <p className="text-xs text-red-400">{errors.plate_number.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Miles Per Gallon (MPG)</label>
                            <input type="number" step="0.1" {...register("miles_per_gallon", { valueAsNumber: true })} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">VIN Number</label>
                            <input {...register("vin_number")} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none font-mono text-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">DOT Number</label>
                            <input {...register("dot_number")} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none font-mono text-sm" />
                        </div>
                    </div>
                </div>

                {/* 3. Financials */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                    <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Financials</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Rate Per Hour ($)</label>
                            <input type="number" step="0.01" {...register("rate_per_hour", { valueAsNumber: true })} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">Fixed Rate ($)</label>
                            <input type="number" step="0.01" {...register("fixed_rate", { valueAsNumber: true })} className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-sm flex items-center gap-2 transition-colors"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {initialData ? "Update Vehicle" : "Create Vehicle"}
                    </button>
                </div>

            </form>
        </SidePanel>
    );
}
