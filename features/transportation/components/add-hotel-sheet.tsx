"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Combobox } from "@/components/ui/combobox";

// Schema
const HotelSchema = z.object({
    name: z.string().min(2, "Name is required"),
    contact_phone: z.string().optional(),
    pickup_point_id: z.string().min(1, "Pickup Point is required"),
});

type FormData = z.infer<typeof HotelSchema>;

interface AddHotelSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export function AddHotelSheet({ isOpen, onClose, onSuccess, initialData }: AddHotelSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pickupOptions, setPickupOptions] = useState<{ value: string; label: string }[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors }
    } = useForm<FormData>({
        resolver: zodResolver(HotelSchema),
        defaultValues: {
            name: "",
            contact_phone: "",
            pickup_point_id: ""
        }
    });

    const currentPickupId = watch("pickup_point_id");

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

    // Load Initial Data
    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                contact_phone: initialData.contact_phone || "",
                pickup_point_id: initialData.pickup_point_id || ""
            });
        } else {
            reset({ name: "", contact_phone: "", pickup_point_id: "" });
        }
    }, [initialData, reset, isOpen]);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            if (initialData?.id) {
                // Update
                const { error } = await supabase
                    .from("hotels")
                    .update(data)
                    .eq("id", initialData.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from("hotels")
                    .insert([data]);
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error saving hotel:", err);
            alert("Failed to save hotel.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Hotel" : "Add Hotel"}
            description={initialData ? "Modify hotel details." : "Register a new hotel and assign a pickup point."}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Hotel Name <span className="text-red-400">*</span></label>
                    <input
                        {...register("name")}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                        placeholder="e.g. Hilton Hawaiian Village"
                    />
                    {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Contact Phone</label>
                    <input
                        {...register("contact_phone")}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                        placeholder="(808) 555-0123"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Assigned Pickup Point <span className="text-red-400">*</span></label>
                    <Combobox
                        options={pickupOptions}
                        value={currentPickupId}
                        onChange={(val) => setValue("pickup_point_id", val, { shouldValidate: true })}
                        placeholder="Select a pickup location..."
                    />
                    {errors.pickup_point_id && <p className="text-xs text-red-400">{errors.pickup_point_id.message}</p>}
                    <p className="text-xs text-zinc-500">Guests at this hotel will be directed to this pickup point.</p>
                </div>

                <div className="pt-4 border-t border-white/10">
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {initialData ? "Save Changes" : "Create Hotel"}
                    </button>
                </div>
            </form>
        </SidePanel>
    );
}
