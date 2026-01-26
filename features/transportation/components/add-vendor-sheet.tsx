"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Info, Building2, Phone, Mail, FileText, MapPin } from "lucide-react";
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

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<VendorFormData>({
        resolver: zodResolver(VendorSchema),
        defaultValues: {
            name: "",
            address: "",
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
                    phone: initialData.phone || "",
                    email: initialData.email || "",
                    ein_number: initialData.ein_number || ""
                });
            } else {
                // New Mode
                reset({
                    name: "",
                    address: "",
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
            if (initialData?.id) {
                // Update
                const { error } = await supabase
                    .from("vendors")
                    .update(data)
                    .eq("id", initialData.id);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from("vendors")
                    .insert([data]);
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
                        <SectionHeader icon={Info} title="Vendor Profile" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 col-span-2">
                                <Label className="text-zinc-300">Vendor Name <span className="text-red-400">*</span></Label>
                                <Input
                                    {...register("name")}
                                    className="bg-black/20 border-white/10 text-white focus:border-cyan-500/50 focus:outline-none"
                                    placeholder="e.g. Acme Transport Co."
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label className="text-zinc-300">Address</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                                    <Input
                                        {...register("address")}
                                        className="pl-9 bg-black/20 border-white/10 text-white focus:border-cyan-500/50 focus:outline-none"
                                        placeholder="Full address..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-300">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                                    <Input
                                        {...register("phone")}
                                        className="pl-9 bg-black/20 border-white/10 text-white focus:border-cyan-500/50 focus:outline-none"
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-300">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                                    <Input
                                        {...register("email")}
                                        className="pl-9 bg-black/20 border-white/10 text-white focus:border-cyan-500/50 focus:outline-none"
                                        placeholder="contact@vendor.com"
                                    />
                                </div>
                                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-300">EIN Number</Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                                    <Input
                                        {...register("ein_number")}
                                        className="pl-9 font-mono bg-black/20 border-white/10 text-white focus:border-cyan-500/50 focus:outline-none"
                                        placeholder="12-3456789"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="shrink-0 flex justify-end items-center gap-4 py-4 px-6 border-t border-white/10 mt-auto bg-zinc-950/40 backdrop-blur-md">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className={cn(
                            "px-6 py-2 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors",
                            isSubmitting
                                ? "bg-cyan-500/50 text-white cursor-not-allowed"
                                : "bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                        )}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {initialData ? "Update Vendor" : "Create Vendor"}
                    </Button>
                </div>

            </form>
        </SidePanel>
    );
}
