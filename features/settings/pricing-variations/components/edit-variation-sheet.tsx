"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Layers } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RequiredIndicator } from "@/components/ui/required-indicator";

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
        formState: { errors, isDirty }
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
            contentClassName="p-0 overflow-hidden flex flex-col"
        >
            <form onSubmit={handleSubmit(onSubmit, (e) => console.error("Validation:", e))} className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-foreground flex items-center gap-2">
                            <Layers size={16} className="text-muted-foreground" />
                            Variation Name <RequiredIndicator />
                        </Label>
                        <Input
                            {...register("name")}
                            placeholder="e.g. Retail, Online, Partner"
                            className="text-lg"
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                </div>

                <div className="flex justify-end items-center gap-4 py-4 px-6 border-t border-border mt-auto bg-background">
                    <Button
                        type="submit"
                        disabled={isSubmitting || !isDirty}
                        className={cn(
                            "px-6 py-2 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors",
                            isSubmitting ? "bg-primary/50 text-primary-foreground cursor-not-allowed" :
                                isDirty ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" :
                                    "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                        )}
                    >
                        {isSubmitting ? <><Loader2 className="animate-spin" size={16} /> Saving...</> :
                            isDirty ? <><Save size={16} /> Save Variation</> :
                                "No Changes"}
                    </Button>
                </div>
            </form>
        </SidePanel>
    );
}
