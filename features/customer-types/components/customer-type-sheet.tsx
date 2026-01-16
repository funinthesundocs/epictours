"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";

// Schema
const CustomerTypeSchema = z.object({
    name: z.string().min(2, "Name is required"),
    code: z.string().min(1, "Code is required").max(10, "Code is too long"),
    description: z.string().optional(),
});

type FormData = z.infer<typeof CustomerTypeSchema>;

interface CustomerTypeSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // If passed, we are in EDIT mode
}

export function CustomerTypeSheet({ isOpen, onClose, onSuccess, initialData }: CustomerTypeSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<FormData>({
        resolver: zodResolver(CustomerTypeSchema),
        defaultValues: {
            name: "",
            code: "",
            description: ""
        }
    });

    // Effect to set form data when editing
    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                code: initialData.code || "",
                description: initialData.description || ""
            });
        } else {
            reset({ name: "", code: "", description: "" });
        }
    }, [initialData, reset, isOpen]);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            if (initialData?.id) {
                // Update
                const { error } = await supabase
                    .from("customer_types")
                    .update(data)
                    .eq("id", initialData.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from("customer_types")
                    .insert([data]);
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error saving customer type:", err);
            alert("Failed to save. Check console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Customer Type" : "Add Customer Type"}
            description={initialData ? "Modify classification details." : "Create a new customer classification."}
        >

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Customer Type Name <span className="text-red-400">*</span></label>
                    <input
                        {...register("name")}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                        placeholder="e.g. Regular Guest"
                    />
                    {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Unique Code <span className="text-red-400">*</span></label>
                    <input
                        {...register("code")}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                        placeholder="e.g. REG"
                    />
                    {errors.code && <p className="text-xs text-red-400">{errors.code.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Notes / Description</label>
                    <textarea
                        {...register("description")}
                        rows={4}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                        placeholder="Internal notes about this segment..."
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
                    {/* Cancel button removed per user request strategy */}
                </div>
            </form>
        </SidePanel>
    );
}
