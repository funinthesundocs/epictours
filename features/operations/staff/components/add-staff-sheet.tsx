"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Info, User, Contact } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";

// Zod Schema
const StaffSchema = z.object({
    name: z.string().min(2, "Name is required"),
    role_id: z.string().min(1, "Role is required"),
    phone: z.string().optional().nullable(),
    messaging_app: z.string().optional().nullable(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    notes: z.string().optional().nullable(),
});

type StaffFormData = z.infer<typeof StaffSchema>;

interface AddStaffSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

const APP_OPTIONS = [
    { value: "WhatsApp", label: "WhatsApp" },
    { value: "Telegram", label: "Telegram" },
    { value: "Signal", label: "Signal" },
    { value: "WeChat", label: "WeChat" },
    { value: "Line", label: "Line" },
    { value: "Viber", label: "Viber" },
    { value: "Messenger", label: "Messenger" },
    { value: "iMessage", label: "iMessage" },
];

export function AddStaffSheet({ isOpen, onClose, onSuccess, initialData }: AddStaffSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState<{ value: string; label: string }[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors }
    } = useForm<StaffFormData>({
        resolver: zodResolver(StaffSchema),
        defaultValues: {
            name: "",
            role_id: "",
            phone: "",
            messaging_app: "",
            email: "",
            notes: ""
        }
    });

    // Fetch Roles on mount
    useEffect(() => {
        const fetchRoles = async () => {
            const { data } = await supabase.from("roles").select("id, name").order("name");
            if (data) {
                setRoles(data.map(r => ({ value: r.id, label: r.name })));
            }
        };
        fetchRoles();
    }, []);

    // Reset when opening/changing mode
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    name: initialData.name,
                    role_id: initialData.role_id || "",
                    phone: initialData.phone || "",
                    messaging_app: initialData.messaging_app || "",
                    email: initialData.email || "",
                    notes: initialData.notes || "",
                });
            } else {
                reset({
                    name: "",
                    role_id: "",
                    phone: "",
                    messaging_app: "",
                    email: "",
                    notes: "",
                });
            }
        }
    }, [isOpen, initialData, reset]);

    const onSubmit = async (data: StaffFormData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                name: data.name,
                role_id: data.role_id,
                phone: data.phone || null,
                messaging_app: data.messaging_app || null,
                email: data.email || null,
                notes: data.notes || null,
            };

            if (initialData?.id) {
                // Update
                const { error } = await supabase
                    .from("staff")
                    .update(payload)
                    .eq("id", initialData.id);
                if (error) throw error;
            } else {
                // Create
                const { error } = await supabase
                    .from("staff")
                    .insert([payload]);
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error saving staff:", err);
            alert("Failed to save staff member.");
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
            title={initialData ? "Edit Staff" : "Add Staff"}
            description="Manage staff details and role assignment."
            width="max-w-lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="pb-12 pt-4">

                <div className="space-y-8">
                    {/* Basic Info */}
                    <div>
                        <SectionHeader icon={Info} title="Basic Information" />
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input {...register("name")} className="text-lg font-semibold" placeholder="e.g. John Doe" />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Combobox
                                    options={roles}
                                    value={watch('role_id')}
                                    onChange={(val) => setValue('role_id', val, { shouldValidate: true })}
                                    placeholder="Select Role..."
                                />
                                {errors.role_id && <p className="text-xs text-red-500">{errors.role_id.message}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <SectionHeader icon={Contact} title="Contact Details" />
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input {...register("phone")} placeholder="+1 (555)..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Messaging App</Label>
                                    <Combobox
                                        options={APP_OPTIONS}
                                        value={watch('messaging_app') || ""}
                                        onChange={(val) => setValue('messaging_app', val)}
                                        placeholder="Select App..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input {...register("email")} type="email" placeholder="john@example.com" />
                                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea
                                    {...register("notes")}
                                    placeholder="Additional notes..."
                                    className="min-h-[100px] bg-[#0b1115] border-white/10"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end items-center gap-4 pt-4 border-t border-white/10 mt-8">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {initialData ? "Update" : "Create"}
                    </button>
                </div>

            </form>
        </SidePanel>
    );
}
