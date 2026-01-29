"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, MapPin, Link, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RequiredIndicator } from "@/components/ui/required-indicator";

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
        formState: { errors, isDirty }
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
            contentClassName="p-0 overflow-hidden flex flex-col"
        >

            <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                            <MapPin size={16} className="text-zinc-500" />
                            Location Name <RequiredIndicator />
                        </label>
                        <Input
                            {...register("name")}
                            placeholder="e.g. Waikiki Gateway"
                        />
                        {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                            <Link size={16} className="text-zinc-500" />
                            Google Map Link
                        </label>
                        <Input
                            {...register("map_link")}
                            placeholder="https://goo.gl/maps/..."
                        />
                        {errors.map_link && <p className="text-xs text-red-400">{errors.map_link.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                            <FileText size={16} className="text-zinc-500" />
                            Instructions / Notes
                        </label>
                        <Textarea
                            {...register("instructions")}
                            rows={4}
                            placeholder="Specific pickup details..."
                        />
                    </div>
                </div>

                <div className="shrink-0 flex justify-end items-center gap-4 py-4 px-6 border-t border-white/10 mt-auto bg-zinc-950/40 backdrop-blur-md">
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
                            isDirty ? <><Save size={16} /> {initialData ? "Update" : "Create"}</> :
                                "No Changes"}
                    </Button>
                </div>
            </form>
        </SidePanel>
    );
}
