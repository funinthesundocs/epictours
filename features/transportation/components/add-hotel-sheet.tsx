"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Building2, Phone, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RequiredIndicator } from "@/components/ui/required-indicator";
import { useAuth } from "@/features/auth/auth-context";

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
    const { effectiveOrganizationId } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pickupOptions, setPickupOptions] = useState<{ value: string; label: string }[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isDirty }
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
        if (!effectiveOrganizationId) return;

        const fetchPickups = async () => {
            const { data } = await supabase.from("pickup_points").select("id, name").eq("organization_id", effectiveOrganizationId).order("name");
            if (data) {
                setPickupOptions(data.map(p => ({ value: p.id, label: p.name })));
            }
        };
        fetchPickups();
    }, [effectiveOrganizationId]);

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
                    .insert([{ ...data, organization_id: effectiveOrganizationId }]);
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
            contentClassName="p-0 overflow-hidden flex flex-col"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Building2 size={16} className="text-muted-foreground" />
                            Hotel Name <RequiredIndicator />
                        </label>
                        <Input
                            {...register("name")}
                            placeholder="e.g. Hilton Hawaiian Village"
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Phone size={16} className="text-muted-foreground" />
                            Contact Phone
                        </label>
                        <Input
                            {...register("contact_phone")}
                            placeholder="(808) 555-0123"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <MapPin size={16} className="text-muted-foreground" />
                            Assigned Pickup Point <RequiredIndicator />
                        </label>
                        <Combobox
                            options={pickupOptions}
                            value={currentPickupId}
                            onChange={(val) => setValue("pickup_point_id", val, { shouldValidate: true })}
                            placeholder="Select a pickup location..."
                        />
                        {errors.pickup_point_id && <p className="text-xs text-destructive">{errors.pickup_point_id.message}</p>}
                        <p className="text-xs text-muted-foreground">Guests at this hotel will be directed to this pickup point.</p>
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
