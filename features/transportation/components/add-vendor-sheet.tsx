"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Info, Handshake, Phone, Mail, FileText, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Zod Schema
const VendorSchema = z.object({
    name: z.string().min(2, "Name is required"),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    ein_number: z.string().optional(),
});

type VendorFormData = z.infer<typeof VendorSchema>;

interface AddVendorSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export function AddVendorSheet({ isOpen, onClose, onSuccess, initialData }: AddVendorSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatPhoneNumber = (value: string) => {
        const numbers = value.replace(/\D/g, "");
        if (numbers.length === 0) return "";
        if (numbers.length <= 3) return `(${numbers}`;
        if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
        return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    };

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty }
    } = useForm<VendorFormData>({
        resolver: zodResolver(VendorSchema),
        defaultValues: {
            name: "",
            address: "",
            city: "",
            state: "",
            zip_code: "",
            phone: "",
            email: "",
            ein_number: ""
        }
    });

    // Reset when opening/changing mode
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Edit Mode
                reset({
                    name: initialData.name,
                    address: initialData.address || "",
                    city: initialData.city || "",
                    state: initialData.state || "",
                    zip_code: initialData.zip_code || "",
                    phone: formatPhoneNumber(initialData.phone || ""),
                    email: initialData.email || "",
                    ein_number: initialData.ein_number || ""
                });
            } else {
                // New Mode
                reset({
                    name: "",
                    address: "",
                    city: "",
                    state: "",
                    zip_code: "",
                    phone: "",
                    email: "",
                    ein_number: ""
                });
            }
        }
    }, [isOpen, initialData, reset]);

    const onSubmit = async (data: VendorFormData) => {
        setIsSubmitting(true);
        try {
            // Strip formatting from phone before saving
            const payload = { ...data, phone: data.phone?.replace(/\D/g, "") || null };

            if (initialData?.id) {
                // Update
                const { error } = await supabase
                    .from("vendors")
                    .update(payload)
                    .eq("id", initialData.id);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from("vendors")
                    .insert([payload]);
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error saving vendor:", err);
            alert("Failed to save vendor.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className="flex items-center gap-2 text-cyan-400 border-b border-white/10 pb-2 mb-6 mt-2">
            <Icon size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
        </div>
    );

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Vendor" : "Add Vendor"}
            description="Manage vendor profiles and contact information."
            width="max-w-2xl"
            contentClassName="p-0 overflow-hidden flex flex-col"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24 space-y-8">
                    <div>
                        <SectionHeader icon={Handshake} title="Vendor Profile" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 col-span-2">
                                <Label className="text-zinc-300 flex items-center gap-2">
                                    <Handshake size={16} className="text-zinc-500" />
                                    Vendor Name <span className="text-red-400">*</span>
                                </Label>
                                <Input
                                    {...register("name")}
                                    placeholder="e.g. Acme Transport Co."
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label className="text-zinc-300 flex items-center gap-2">
                                    <MapPin size={16} className="text-zinc-500" />
                                    Address
                                </Label>
                                <Input
                                    {...register("address")}
                                    placeholder="Street Address..."
                                />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 col-span-2">
                                <div className="col-span-2 space-y-2">
                                    <Label className="text-zinc-300">City</Label>
                                    <Input {...register("city")} placeholder="City" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">State</Label>
                                    <Input {...register("state")} placeholder="State" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Zip Code</Label>
                                    <Input {...register("zip_code")} placeholder="Zip" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-300 flex items-center gap-2">
                                    <Phone size={16} className="text-zinc-500" />
                                    Phone Number
                                </Label>
                                <Input
                                    {...register("phone", {
                                        onChange: (e) => {
                                            e.target.value = formatPhoneNumber(e.target.value);
                                        }
                                    })}
                                    placeholder="(555) 123-4567"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-300 flex items-center gap-2">
                                    <Mail size={16} className="text-zinc-500" />
                                    Email Address
                                </Label>
                                <Input
                                    {...register("email")}
                                    placeholder="contact@vendor.com"
                                />
                                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-300 flex items-center gap-2">
                                    <FileText size={16} className="text-zinc-500" />
                                    EIN Number
                                </Label>
                                <Input
                                    {...register("ein_number")}
                                    className="font-mono"
                                    placeholder="12-3456789"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="shrink-0 flex justify-end items-center gap-4 py-4 px-6 border-t border-white/10 mt-auto bg-zinc-950/40 backdrop-blur-md">
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
                            isDirty ? <><Save size={16} /> {initialData ? "Update Vendor" : "Create Vendor"}</> :
                                "No Changes"}
                    </Button>
                </div>

            </form>
        </SidePanel>
    );
}
