"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Info, Handshake, Phone, Mail, FileText, MapPin, Contact, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";
import { CustomSelect } from "@/components/ui/custom-select";
import { RequiredIndicator } from "@/components/ui/required-indicator";

// Brand icons for messaging apps
import { FaWhatsapp, FaFacebookMessenger, FaTelegram, FaViber, FaWeixin, FaLine } from "react-icons/fa";
import { SiSignal } from "react-icons/si";

// Messaging app options with icons
const MESSAGING_OPTIONS = [
    { value: "", label: "None", icon: null },
    { value: "WhatsApp", label: "WhatsApp", icon: <FaWhatsapp size={16} className="text-green-500" /> },
    { value: "FB Messenger", label: "FB Messenger", icon: <FaFacebookMessenger size={16} className="text-blue-500" /> },
    { value: "Signal", label: "Signal", icon: <SiSignal size={16} className="text-blue-400" /> },
    { value: "Telegram", label: "Telegram", icon: <FaTelegram size={16} className="text-sky-400" /> },
    { value: "Viber", label: "Viber", icon: <FaViber size={16} className="text-purple-500" /> },
    { value: "Line", label: "Line", icon: <FaLine size={16} className="text-green-400" /> },
    { value: "WeChat", label: "WeChat", icon: <FaWeixin size={16} className="text-green-600" /> },
];

const US_STATES = [
    { value: "AL", label: "Alabama" },
    { value: "AK", label: "Alaska" },
    { value: "AZ", label: "Arizona" },
    { value: "AR", label: "Arkansas" },
    { value: "CA", label: "California" },
    { value: "CO", label: "Colorado" },
    { value: "CT", label: "Connecticut" },
    { value: "DE", label: "Delaware" },
    { value: "DC", label: "District of Columbia" },
    { value: "FL", label: "Florida" },
    { value: "GA", label: "Georgia" },
    { value: "HI", label: "Hawaii" },
    { value: "ID", label: "Idaho" },
    { value: "IL", label: "Illinois" },
    { value: "IN", label: "Indiana" },
    { value: "IA", label: "Iowa" },
    { value: "KS", label: "Kansas" },
    { value: "KY", label: "Kentucky" },
    { value: "LA", label: "Louisiana" },
    { value: "ME", label: "Maine" },
    { value: "MD", label: "Maryland" },
    { value: "MA", label: "Massachusetts" },
    { value: "MI", label: "Michigan" },
    { value: "MN", label: "Minnesota" },
    { value: "MS", label: "Mississippi" },
    { value: "MO", label: "Missouri" },
    { value: "MT", label: "Montana" },
    { value: "NE", label: "Nebraska" },
    { value: "NV", label: "Nevada" },
    { value: "NH", label: "New Hampshire" },
    { value: "NJ", label: "New Jersey" },
    { value: "NM", label: "New Mexico" },
    { value: "NY", label: "New York" },
    { value: "NC", label: "North Carolina" },
    { value: "ND", label: "North Dakota" },
    { value: "OH", label: "Ohio" },
    { value: "OK", label: "Oklahoma" },
    { value: "OR", label: "Oregon" },
    { value: "PA", label: "Pennsylvania" },
    { value: "RI", label: "Rhode Island" },
    { value: "SC", label: "South Carolina" },
    { value: "SD", label: "South Dakota" },
    { value: "TN", label: "Tennessee" },
    { value: "TX", label: "Texas" },
    { value: "UT", label: "Utah" },
    { value: "VT", label: "Vermont" },
    { value: "VA", label: "Virginia" },
    { value: "WA", label: "Washington" },
    { value: "WV", label: "West Virginia" },
    { value: "WI", label: "Wisconsin" },
    { value: "WY", label: "Wyoming" }
];

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
    preferred_messaging_app: z.string().optional().nullable(),
    messaging_handle: z.string().optional().nullable(),
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
        setValue,
        watch,
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
            ein_number: "",
            preferred_messaging_app: "",
            messaging_handle: ""
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
                    ein_number: initialData.ein_number || "",
                    preferred_messaging_app: initialData.preferred_messaging_app || "",
                    messaging_handle: initialData.messaging_handle || ""
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
                    ein_number: "",
                    preferred_messaging_app: "",
                    messaging_handle: ""
                });
            }
        }
    }, [isOpen, initialData, reset]);

    const onSubmit = async (data: VendorFormData) => {
        setIsSubmitting(true);
        try {
            // Strip formatting from phone before saving
            const payload = {
                ...data,
                phone: data.phone?.replace(/\D/g, "") || null,
                preferred_messaging_app: data.preferred_messaging_app || null,
                messaging_handle: data.messaging_handle || null
            };

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

    const SectionHeader = ({ icon: Icon, title, className }: { icon: any, title: string, className?: string }) => (
        <div className={`flex items-center gap-2 bg-white/5 -mx-6 px-6 py-3 mb-6 border-y border-white/5 ${className || ''}`}>
            <Icon size={16} className="text-cyan-500" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{title}</h3>
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

                    {/* Basic Information Section */}
                    <div>
                        <SectionHeader icon={Info} title="Basic Information" className="-mt-6 border-t-0" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300 flex items-center gap-2">
                                    <Handshake size={16} className="text-zinc-500" />
                                    Vendor Name <RequiredIndicator />
                                </Label>
                                <Input
                                    {...register("name")}
                                    placeholder="e.g. Acme Transport Co."
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300 flex items-center gap-2">
                                    <FileText size={16} className="text-zinc-500" />
                                    EIN Number
                                </Label>
                                <Input
                                    {...register("ein_number")}
                                    placeholder="12-3456789"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Details Section */}
                    <div>
                        <SectionHeader icon={Contact} title="Contact Details" />
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            </div>

                            {/* Preferred Messaging App */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300 flex items-center gap-2">
                                        <MessageCircle size={16} className="text-zinc-500" />
                                        Preferred Messaging
                                    </Label>
                                    <CustomSelect
                                        value={watch("preferred_messaging_app") || ""}
                                        onChange={(val) => {
                                            setValue("preferred_messaging_app", val || null, { shouldDirty: true });
                                            // Clear handle when app is unselected
                                            if (!val) setValue("messaging_handle", null);
                                        }}
                                        options={MESSAGING_OPTIONS}
                                        placeholder="Select App..."
                                    />
                                </div>

                                {/* Handle/Nickname - Only shows when app is selected */}
                                {watch("preferred_messaging_app") && (
                                    <div className="space-y-2">
                                        <Label className="text-zinc-300 flex items-center gap-2">
                                            Handle / Nickname
                                        </Label>
                                        <Input
                                            {...register("messaging_handle")}
                                            placeholder="@username or phone"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-300 flex items-center gap-2">
                                    <MapPin size={16} className="text-zinc-500" />
                                    Street Address
                                </Label>
                                <Input
                                    {...register("address")}
                                    placeholder="123 Main Street..."
                                />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <Label className="text-zinc-300">City</Label>
                                    <Input {...register("city")} placeholder="City" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">State</Label>
                                    <Combobox
                                        value={watch("state")}
                                        onChange={(val) => setValue("state", val, { shouldDirty: true })}
                                        options={US_STATES}
                                        placeholder="Select State"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Zip Code</Label>
                                    <Input {...register("zip_code")} placeholder="Zip" />
                                </div>
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
