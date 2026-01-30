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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        formState: { errors, isDirty }
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
                    .from("customer_types" as any)
                    .update(data)
                    .eq("id", initialData.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from("customer_types" as any)
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
            width="max-w-lg"
            contentClassName="p-0 overflow-hidden flex flex-col"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24 space-y-6">
                    <div className="space-y-2">
                        <Label>Customer Type Name</Label>
                        <Input
                            {...register("name")}
                            placeholder="e.g. Regular Guest"
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Unique Code</Label>
                        <Input
                            {...register("code")}
                            placeholder="e.g. REG"
                        />
                        {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Notes / Description</Label>
                        <Textarea
                            {...register("description")}
                            placeholder="Internal notes about this segment..."
                            className="min-h-[100px]"
                        />
                    </div>
                </div>

                <div className="shrink-0 flex justify-end items-center gap-4 py-4 px-6 border-t border-border mt-auto bg-background/80 backdrop-blur-md">
                    <Button
                        type="submit"
                        disabled={isSubmitting || !isDirty}
                        className={cn(
                            "px-6 py-2 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors",
                            isSubmitting ? "bg-primary/50 text-primary-foreground cursor-not-allowed" :
                                isDirty ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow" :
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
