"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { CustomerSchema, Customer, CustomerStatus } from "../types";
import { Loader2, Save } from "lucide-react";
import { z } from "zod";

import { Combobox } from "@/components/ui/combobox";
import { CustomSelect } from "@/components/ui/custom-select";
import { Button } from "@/components/ui/button";

// Options Lists
const MESSAGING_OPTIONS = ["WhatsApp", "FB Messenger", "Signal", "Telegram", "Viber", "Line", "WeChat"];
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
        formState: { errors },
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

    const onSubmit = async (data: FormData) => {
        console.log("🚀 onSubmit called with data:", data);
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            if (initialData?.id) {
                // UPDATE Mode
                const { error } = await supabase
                    .from("customers")
                    .update({
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
                        status: data.status,
                        tags: data.tags,
                        preferences: data.preferences,
                        metadata: data.metadata,
                    })
                    .eq("id", initialData.id);
                if (error) throw error;
            } else {
                // INSERT Mode
                const { error } = await supabase
                    .from("customers")
                    .insert([{
                        name: data.name,
                        email: data.email,
                        phone: data.phone,
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

    return (
        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">

            {/* 1. Identity */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider border-b border-white/10 pb-2">
                    Contact Details
                </h3>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Name <span className="text-red-400">*</span></label>
                    <input
                        {...register("name")}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                        placeholder="Jane Doe"
                    />
                    {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Email <span className="text-red-400">*</span></label>
                        <input
                            {...register("email")}
                            type="email"
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                            placeholder="jane@example.com"
                        />
                        {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Cell Phone</label>
                        <input
                            {...register("phone")}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                </div>
            </div>

            {/* 2. Logistics & Preferences */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider border-b border-white/10 pb-2">
                    Logistics & Context
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Hotel - Smart Autocomplete */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Hotel / Accommodation</label>
                        <Combobox
                            value={watch("metadata.hotel") || ""}
                            onChange={(val) => setValue("metadata.hotel", val, { shouldValidate: true })}
                            options={MOCK_HOTELS}
                            placeholder="Search or type hotel..."
                        />
                    </div>

                    {/* Preferred Messaging App - Updated Options */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Preferred Messaging</label>
                        <CustomSelect
                            value={watch("preferences.preferred_messaging_app") || undefined}
                            onChange={(val) => setValue("preferences.preferred_messaging_app", val as any, { shouldValidate: true })}
                            options={MESSAGING_OPTIONS}
                            placeholder="Select App..."
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Referral Source - Updated Options */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Referral Source</label>
                        <CustomSelect
                            value={watch("metadata.source") || undefined}
                            onChange={(val) => setValue("metadata.source", val as any, { shouldValidate: true })}
                            options={REFERRAL_OPTIONS}
                            placeholder="Select Source..."
                        />
                    </div>
                    {/* Status */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Status</label>
                        <CustomSelect
                            value={watch("status")}
                            onChange={(val) => setValue("status", val as any, { shouldValidate: true })}
                            options={STATUS_OPTIONS}
                            placeholder="Select Status..."
                        />
                        {errors.status && <p className="text-xs text-red-400">{errors.status.message}</p>}
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Notes (Internal)</label>
                    <textarea
                        {...register("preferences.notes")}
                        rows={3}
                        className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                        placeholder="Any special requests, internal context, or details..."
                    />
                </div>
            </div>

            {/* Error Message */}
            {submitError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 text-center">
                    {submitError}
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end items-center gap-4 pt-4 border-t border-white/10">
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {initialData ? "Update" : "Create"}
                </Button>
            </div>
        </form>
    );
}
