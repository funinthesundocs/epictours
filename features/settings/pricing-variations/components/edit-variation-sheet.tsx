"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const VariationSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required")
});

type VariationFormData = z.infer<typeof VariationSchema>;

interface EditVariationSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export function EditVariationSheet({ isOpen, onClose, onSuccess, initialData }: EditVariationSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<VariationFormData>({
        resolver: zodResolver(VariationSchema),
        defaultValues: {
            name: ""
        }
    });

    useEffect(() => {
        if (isOpen && initialData) {
            reset({
                id: initialData.id,
                name: initialData.name || ""
            });
        } else if (isOpen) {
            reset({ name: "" });
        }
    }, [isOpen, initialData, reset]);

    const onSubmit = async (data: VariationFormData) => {
        setIsSubmitting(true);
        try {
            const payload = { name: data.name };

            if (data.id) {
                const { error } = await supabase
                    .from("pricing_variations" as any)
                    .update(payload)
                    .eq("id", data.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("pricing_variations" as any)
                    .insert([payload]);
                if (error) throw error;
            }

            toast.success(data.id ? "Variation Updated" : "Variation Created");
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Save error:", err);
            toast.error("Failed to save: " + (err.message || "Unknown error"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Variation" : "New Variation"}
            description="Configure a pricing variation label."
            width="w-[90vw] max-w-md"
        >
            <form onSubmit={handleSubmit(onSubmit, (e) => console.error("Validation:", e))} className="space-y-6 p-6">
                <div className="space-y-2">
                    <Label>Variation Name *</Label>
                    <Input
                        {...register("name")}
                        placeholder="e.g. Retail, Online, Partner"
                        className="text-lg"
                    />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div className="flex justify-end pt-4 border-t border-white/10">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                        Save Variation
                    </Button>
                </div>
            </form>
        </SidePanel>
    );
}
