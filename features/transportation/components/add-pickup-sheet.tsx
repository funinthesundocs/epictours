"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";

// Schema
const PickupSchema = z.object({
    name: z.string().min(2, "Name is required"),
    map_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    instructions: z.string().optional(),
});

type FormData = z.infer<typeof PickupSchema>;

interface AddPickupSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // If passed, we are in EDIT mode
}

export function AddPickupSheet({ isOpen, onClose, onSuccess, initialData }: AddPickupSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<FormData>({
        resolver: zodResolver(PickupSchema),
        defaultValues: {
            name: "",
            map_link: "",
            instructions: ""
        }
    });

    // Effect to set form data when editing
    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                map_link: initialData.map_link || "",
                instructions: initialData.instructions || ""
            });
        } else {
            reset({ name: "", map_link: "", instructions: "" });
        }
    }, [initialData, reset, isOpen]);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            if (initialData?.id) {
                // Update
                const { error } = await supabase
                    .from("pickup_points")
                    .update(data)
                    .eq("id", initialData.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from("pickup_points")
                    .insert([data]);
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error saving pickup point:", err);
            alert("Failed to save. Check console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Location" : "Add Location"}
            description={initialData ? "Modify pickup details." : "Create a new centralized pickup point."}
        >

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Location Name <span className="text-red-400">*</span></label>
                    <input
                        {...register("name")}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                        placeholder="e.g. Waikiki Gateway"
                    />
                    {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Google Map Link</label>
                    <input
                        {...register("map_link")}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                        placeholder="https://goo.gl/maps/..."
                    />
                    {errors.map_link && <p className="text-xs text-red-400">{errors.map_link.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Instructions / Notes</label>
                    <textarea
                        {...register("instructions")}
                        rows={4}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                        placeholder="Specific pickup details..."
                    />
                </div>

                <div className="flex justify-end items-center gap-4 pt-4 border-t border-white/10">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {initialData ? "Update" : "Create"}
                    </button>
                    {/* Cancel button removed per user request */}
                </div>
            </form>
        </SidePanel>
    );
}
