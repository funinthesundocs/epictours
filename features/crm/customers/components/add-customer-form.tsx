"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { CustomerSchema, Customer, CustomerStatus } from "../types";
import { Loader2, Save, Contact, MapPin, User, Mail, Phone, Building, MessageCircle, Users, Flag, FileText } from "lucide-react";
import { z } from "zod";

// Brand icons for messaging apps
import { FaWhatsapp, FaFacebookMessenger, FaTelegram, FaViber, FaWeixin, FaLine } from "react-icons/fa";
import { SiSignal } from "react-icons/si";

import { Combobox } from "@/components/ui/combobox";
import { CustomSelect } from "@/components/ui/custom-select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RequiredIndicator } from "@/components/ui/required-indicator";
import { cn } from "@/lib/utils";

// Options Lists with icons
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
const REFERRAL_OPTIONS = ["Google Ad", "Google Map", "AI Search", "Facebook", "YouTube", "Instagram", "Word of Mouth", "Repeat Customer", "Email Offer", "Other"];
const STATUS_OPTIONS = ["Lead", "Customer", "Refund", "Problem"];

// Temporary Mock Data - Will trigger DB lookup later
const MOCK_HOTELS = [
    "Hilton Hawaiian Village",
    "Sheraton Waikiki",
    "The Royal Hawaiian",
    "Moana Surfrider",
    "Halekulani",
    "Ritz-Carlton Residences",
    "Marriott Resort",
    "Hyatt Regency",
    "Prince Waikiki",
    "Four Seasons"
];

interface AddCustomerFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    initialData?: Customer; // Enable Edit Mode
}

type FormData = z.infer<typeof CustomerSchema>;

export function AddCustomerForm({ onSuccess, onCancel, initialData }: AddCustomerFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        reset,
        watch,
        setValue
    } = useForm({
        resolver: zodResolver(CustomerSchema),
        defaultValues: {
            status: (initialData?.status || "Lead") as CustomerStatus,
            tags: [],
            total_value: 0,
            preferences: {
                dietary: [],
                marketing_consent: { email: true, sms: false, whatsapp: false },
                notes: "",
                preferred_messaging_app: undefined
            },
            metadata: {
                source: undefined,
                hotel: ""
            },
            ...initialData // Override defaults if editing
        }
    });

    // Reset if initialData changes (for reusing the sheet)
    useEffect(() => {
        if (initialData) {
            reset({
                // Ensure explicit handling of nulls for Zod
                phone: initialData.phone || null,
                avatar_url: initialData.avatar_url || null,
                last_active: initialData.last_active || null,
                // Nested objects
                preferences: {
                    ...initialData.preferences,
                    notes: initialData.preferences?.notes || null,
                    accessibility: initialData.preferences?.accessibility || null,
                    preferred_messaging_app: initialData.preferences?.preferred_messaging_app || null
                },
                metadata: {
                    ...initialData.metadata,
                    source: initialData.metadata?.source || null,
                    hotel: initialData.metadata?.hotel || null,
                    campaign: initialData.metadata?.campaign || null
                }
            });
        }
    }, [initialData, reset]);

    // Helper to format phone number
    const formatPhoneNumber = (phone: string | null | undefined): string | null => {
        if (!phone) return null;
        const digits = phone.replace(/\D/g, '');
        if (digits.length === 0) return null;
        if (digits.length >= 10) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
        } else if (digits.length >= 6) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        } else if (digits.length >= 3) {
            return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
        }
        return digits;
    };

    const onSubmit = async (data: FormData) => {
        console.log("🚀 onSubmit called with data:", data);
        setIsSubmitting(true);
        setSubmitError(null);

        // Auto-format phone number before saving
        const formattedPhone = formatPhoneNumber(data.phone);

        try {
            // Check for duplicate email in users table on Create
            if (!initialData?.id) {
                const { data: existing } = await supabase
                    .from("users")
                    .select("id")
                    .eq("email", data.email)
                    .maybeSingle();

                if (existing) {
                    setSubmitError("A user with this email already exists.");
                    setIsSubmitting(false);
                    return;
                }
            }

            if (initialData?.id) {
                // UPDATE Mode - update both users and customers
                // Use user_id from initialData if available, otherwise fetch it
                let userId = (initialData as any).user_id;

                if (!userId) {
                    const { data: customer } = await supabase
                        .from("customers")
                        .select("user_id")
                        .eq("id", initialData.id)
                        .single();
                    userId = customer?.user_id;
                }

                if (userId) {
                    // Update user identity data
                    await supabase
                        .from("users")
                        .update({
                            name: data.name,
                            email: data.email,
                            phone_number: formattedPhone,
                        })
                        .eq("id", userId);
                }

                // Update customer module data
                const { error } = await supabase
                    .from("customers")
                    .update({
                        status: data.status,
                        tags: data.tags,
                        preferences: data.preferences,
                        metadata: data.metadata,
                    })
                    .eq("id", initialData.id);
                if (error) throw error;
            } else {
                // INSERT Mode - create user first, then customer with user_id
                const { data: newUser, error: userError } = await supabase
                    .from("users")
                    .insert({
                        name: data.name,
                        email: data.email,
                        phone_number: formattedPhone,
                    })
                    .select("id")
                    .single();

                if (userError) throw userError;

                // Create customer linked to user
                const { error } = await supabase
                    .from("customers")
                    .insert([{
                        user_id: newUser.id,
                        status: data.status,
                        tags: data.tags,
                        preferences: data.preferences,
                        metadata: data.metadata,
                    }]);
                if (error) throw error;
            }

            console.log("Customer saved:", data);
            if (!initialData) reset(); // Only reset on create
            onSuccess();
        } catch (err: any) {
            console.error("Error saving customer:", err);
            setSubmitError(err.message || "Failed to save profile.");
            // Also explicitly alert if it's not a validation error
            if (err.message && !err.message.includes("Validation")) {
                alert(`Database Error: ${err.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const onError = (errors: any) => {
        console.error("Form Validation Errors:", JSON.stringify(errors, null, 2));
        setSubmitError("Validation failed. Check console for details.");
    };

    const SectionHeader = ({ icon: Icon, title, className }: { icon: any, title: string, className?: string }) => (
        <div className={`flex items-center gap-2 bg-muted/30 -mx-6 px-6 py-3 mb-6 border-y border-border ${className || ''}`}>
            <Icon size={16} className="text-primary" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</h3>
        </div>
    );

    return (
        <form onSubmit={handleSubmit(onSubmit, onError)} className="h-full flex flex-col">

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24 space-y-8">

                {/* 1. Identity */}
                <div>
                    <SectionHeader icon={Contact} title="Contact Details" className="-mt-6 border-t-0" />

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-foreground flex items-center gap-2">
                                    <User size={16} className="text-muted-foreground" />
                                    Name <RequiredIndicator />
                                </Label>
                                <Input
                                    {...register("name")}
                                    placeholder="Jane Doe"
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground flex items-center gap-2">
                                    <Flag size={16} className="text-muted-foreground" />
                                    Status
                                </Label>
                                <CustomSelect
                                    value={watch("status")}
                                    onChange={(val) => setValue("status", val as any, { shouldValidate: true })}
                                    options={STATUS_OPTIONS}
                                    placeholder="Status..."
                                />
                                {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-foreground flex items-center gap-2">
                                    <Phone size={16} className="text-muted-foreground" />
                                    Phone
                                </Label>
                                <Input
                                    {...register("phone", {
                                        onChange: (e) => {
                                            // Auto-format phone number
                                            const value = e.target.value.replace(/\D/g, '');
                                            let formatted = value;
                                            if (value.length >= 6) {
                                                formatted = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
                                            } else if (value.length >= 3) {
                                                formatted = `(${value.slice(0, 3)}) ${value.slice(3)}`;
                                            } else if (value.length > 0) {
                                                formatted = `(${value}`;
                                            }
                                            e.target.value = formatted;
                                        }
                                    })}
                                    placeholder="(555) 000-0000"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-foreground flex items-center gap-2">
                                    <Mail size={16} className="text-muted-foreground" />
                                    Email <RequiredIndicator />
                                </Label>
                                <Input
                                    {...register("email")}
                                    type="email"
                                    placeholder="jane@example.com"
                                />
                                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                            </div>
                        </div>

                        {/* Preferred Messaging App */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-foreground flex items-center gap-2">
                                    <MessageCircle size={16} className="text-muted-foreground" />
                                    Preferred Messaging
                                </Label>
                                <CustomSelect
                                    value={watch("preferences.preferred_messaging_app") || ""}
                                    onChange={(val) => {
                                        setValue("preferences.preferred_messaging_app", val || null as any, { shouldValidate: true });
                                        // Clear handle when app is unselected
                                        if (!val) setValue("preferences.messaging_handle", null);
                                    }}
                                    options={MESSAGING_OPTIONS}
                                    placeholder="Select App..."
                                />
                            </div>

                            {/* Handle/Nickname - Only shows when app is selected */}
                            {watch("preferences.preferred_messaging_app") && (
                                <div className="space-y-2">
                                    <Label className="text-foreground flex items-center gap-2">
                                        Handle / Nickname
                                    </Label>
                                    <Input
                                        {...register("preferences.messaging_handle")}
                                        placeholder="@username or phone"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Logistics & Preferences */}
                <div>
                    <SectionHeader icon={MapPin} title="Logistics & Context" />

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Hotel - Smart Autocomplete */}
                            <div className="space-y-2">
                                <Label className="text-foreground flex items-center gap-2">
                                    <Building size={16} className="text-muted-foreground" />
                                    Hotel / Accommodation
                                </Label>
                                <Combobox
                                    value={watch("metadata.hotel") || ""}
                                    onChange={(val) => setValue("metadata.hotel", val, { shouldValidate: true })}
                                    options={MOCK_HOTELS}
                                    placeholder="Search or type hotel..."
                                />
                            </div>

                            {/* Referral Source */}
                            <div className="space-y-2">
                                <Label className="text-foreground flex items-center gap-2">
                                    <Users size={16} className="text-muted-foreground" />
                                    Referral Source
                                </Label>
                                <CustomSelect
                                    value={watch("metadata.source") || undefined}
                                    onChange={(val) => setValue("metadata.source", val as any, { shouldValidate: true })}
                                    options={REFERRAL_OPTIONS}
                                    placeholder="Select Source..."
                                />
                            </div>
                        </div>


                        {/* Notes */}
                        <div className="space-y-2">
                            <Label className="text-foreground flex items-center gap-2">
                                <FileText size={16} className="text-muted-foreground" />
                                Notes (Internal)
                            </Label>
                            <Textarea
                                {...register("preferences.notes")}
                                placeholder="Any special requests, internal context, or details..."
                                className="min-h-[100px] bg-muted border-border"
                            />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {submitError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive text-center">
                        {submitError}
                    </div>
                )}
            </div>

            {/* Fixed Footer */}
            <div className="shrink-0 flex justify-end items-center gap-4 py-4 px-6 border-t border-border mt-auto bg-card">
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
                        isDirty ? <><Save size={16} /> {initialData ? "Update Customer" : "Create Customer"}</> :
                            "No Changes"}
                </Button>
            </div>
        </form>
    );
}
