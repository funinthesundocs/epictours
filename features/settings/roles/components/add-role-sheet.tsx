"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Info, UserCog } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Zod Schema
const RoleSchema = z.object({
    name: z.string().min(2, "Role name is required"),
    description: z.string().optional().nullable(),
});

type RoleFormData = z.infer<typeof RoleSchema>;

interface AddRoleSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export function AddRoleSheet({ isOpen, onClose, onSuccess, initialData }: AddRoleSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty }
    } = useForm<RoleFormData>({
        resolver: zodResolver(RoleSchema),
        defaultValues: {
            name: "",
            description: ""
        }
    });

    // Reset when opening/changing mode
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Edit Mode
                reset({
                    name: initialData.name,
                    description: initialData.description || "",
                });
            } else {
                // New Mode
                reset({
                    name: "",
                    description: "",
                });
            }
        }
    }, [isOpen, initialData, reset]);

    const onSubmit = async (data: RoleFormData) => {
        setIsSubmitting(true);
        try {
            if (initialData?.id) {
                // Update
                const { error } = await supabase
                    .from("roles")
                    .update({
                        name: data.name,
                        description: data.description || null
                    })
                    .eq("id", initialData.id);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from("roles")
                    .insert([{
                        name: data.name,
                        description: data.description || null
                    }]);
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error saving role:", err);
            alert("Failed to save role.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Role" : "Add Role"}
            description="Manage user role definitions and permissions."
            width="max-w-lg"
            contentClassName="p-0 overflow-hidden flex flex-col"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24">
                    <div className="space-y-8">
                        <div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Role Name</Label>
                                    <Input {...register("name")} className="text-lg font-semibold" placeholder="e.g. Flight Manager" />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Notes / Description</Label>
                                    <Textarea
                                        {...register("description")}
                                        placeholder="Enter details about this role's responsibilities..."
                                        className="min-h-[120px] bg-[#0b1115] border-white/10 focus:border-cyan-500/50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end items-center gap-4 py-4 px-6 border-t border-white/10 mt-auto bg-[#0b1115]">
                    <Button
                        type="submit"
                        disabled={isSubmitting || !isDirty}
                        className={cn(
                            "px-6 py-2 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors",
                            isSubmitting ? "bg-cyan-500/50 text-white cursor-not-allowed" :
                                isDirty ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]" :
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
