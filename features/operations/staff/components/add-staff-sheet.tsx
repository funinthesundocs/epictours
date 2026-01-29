"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Info, User, Contact, Phone, MessageCircle, Mail, FileText, BadgeCheck, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";

// Brand icons for messaging apps
import { FaWhatsapp, FaFacebookMessenger, FaTelegram, FaViber, FaWeixin, FaLine, FaApple } from "react-icons/fa";
import { SiSignal } from "react-icons/si";

// Zod Schema
const StaffSchema = z.object({
    name: z.string().min(2, "Name is required"),
    role_id: z.string().min(1, "Role is required"),
    phone: z.string().optional().nullable(),
    // messaging_app is now just for storage, form uses messaging_apps array
    messaging_apps: z.array(z.object({
        app: z.string().min(1, "App required"),
        handle: z.string().min(1, "Handle required")
    })).optional(),
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
    { value: "WhatsApp", label: "WhatsApp", icon: <FaWhatsapp size={16} className="text-green-500" /> },
    { value: "Telegram", label: "Telegram", icon: <FaTelegram size={16} className="text-sky-400" /> },
    { value: "Signal", label: "Signal", icon: <SiSignal size={16} className="text-blue-400" /> },
    { value: "WeChat", label: "WeChat", icon: <FaWeixin size={16} className="text-green-600" /> },
    { value: "Line", label: "Line", icon: <FaLine size={16} className="text-green-400" /> },
    { value: "Viber", label: "Viber", icon: <FaViber size={16} className="text-purple-500" /> },
    { value: "Messenger", label: "Messenger", icon: <FaFacebookMessenger size={16} className="text-blue-500" /> },
    { value: "iMessage", label: "iMessage", icon: <FaApple size={16} className="text-zinc-400" /> },
];

export function AddStaffSheet({ isOpen, onClose, onSuccess, initialData }: AddStaffSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState<{ value: string; label: string }[]>([]);

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
        control,
        formState: { errors }
    } = useForm<StaffFormData>({
        resolver: zodResolver(StaffSchema),
        defaultValues: {
            name: "",
            role_id: "",
            phone: "",
            messaging_apps: [],
            email: "",
            notes: ""
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "messaging_apps"
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
                // Parse existing messaging_app JSON or migrate legacy string
                let parsedApps = [];
                try {
                    if (initialData.messaging_app?.startsWith('[')) {
                        parsedApps = JSON.parse(initialData.messaging_app);
                    } else if (initialData.messaging_app) {
                        parsedApps = [{ app: initialData.messaging_app, handle: "" }];
                    }
                } catch (e) {
                    console.warn("Failed to parse messaging apps", e);
                }

                // Ensure at least one empty row if none exist
                if (parsedApps.length === 0) {
                    parsedApps = [{ app: "", handle: "" }];
                }

                reset({
                    name: initialData.name,
                    role_id: initialData.role_id || "",
                    phone: formatPhoneNumber(initialData.phone || ""),
                    messaging_apps: parsedApps,
                    email: initialData.email || "",
                    notes: initialData.notes || "",
                });
            } else {
                reset({
                    name: "",
                    role_id: "",
                    phone: "",
                    messaging_apps: [{ app: "", handle: "" }], // Default to one empty row
                    email: "",
                    notes: "",
                });
            }
        }
    }, [isOpen, initialData, reset]);

    const onSubmit = async (data: StaffFormData) => {
        setIsSubmitting(true);
        try {
            // Filter out empty rows before saving
            const validApps = data.messaging_apps?.filter(a => a.app && a.handle) || [];

            const payload = {
                name: data.name,
                role_id: data.role_id,
                phone: data.phone?.replace(/\D/g, "") || null,
                messaging_app: validApps.length > 0 ? JSON.stringify(validApps) : null,
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

    const SectionHeader = ({ icon: Icon, title, className }: { icon: any, title: string, className?: string }) => (
        <div className={`flex items-center gap-2 bg-white/5 -mx-6 px-6 py-3 mb-6 border-y border-white/5 ${className || ''}`}>
            <Icon size={16} className="text-cyan-400" />
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{title}</h3>
        </div>
    );

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Staff" : "Add Staff"}
            description="Manage staff details and role assignment."
            width="max-w-lg"
            contentClassName="p-0 overflow-hidden flex flex-col"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24 space-y-8">
                    {/* Basic Info */}
                    <div>
                        <SectionHeader icon={Info} title="Basic Information" className="-mt-6 border-t-0" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-zinc-300 flex items-center gap-2">
                                    <User size={16} className="text-zinc-500" />
                                    Full Name
                                </Label>
                                <Input {...register("name")} placeholder="e.g. John Doe" />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-300 flex items-center gap-2">
                                    <BadgeCheck size={16} className="text-zinc-500" />
                                    Role
                                </Label>
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
                                    <Input {...register("email")} type="email" placeholder="john@example.com" />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-zinc-300 flex items-center gap-2">
                                    <MessageCircle size={16} className="text-zinc-500" />
                                    Messaging Apps
                                </Label>

                                <div className="space-y-2">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex items-center gap-2 group animate-in slide-in-from-left-2 duration-300">
                                            <div className="flex-1 flex items-center pr-2 rounded-lg border bg-white/5 border-white/5 transition-colors focus-within:border-cyan-400/30">
                                                {/* App Name */}
                                                <div className="w-[40%] min-w-[120px] border-r border-white/5 h-full relative">
                                                    <Controller
                                                        control={control}
                                                        name={`messaging_apps.${index}.app`}
                                                        render={({ field }) => (
                                                            <Combobox
                                                                options={APP_OPTIONS}
                                                                value={field.value}
                                                                onChange={(val) => field.onChange(val)}
                                                                placeholder="App..."
                                                                className="w-full bg-transparent border-none text-white text-sm h-[42px] px-3 shadow-none hover:bg-white/5 rounded-none rounded-l-lg"
                                                            />
                                                        )}
                                                    />
                                                </div>

                                                {/* Handle Input */}
                                                <div className="flex-1 h-full relative">
                                                    <input
                                                        {...register(`messaging_apps.${index}.handle`, {
                                                            onChange: (e) => {
                                                                const app = watch(`messaging_apps.${index}.app`) || "";
                                                                const isPhoneApp = ["WhatsApp", "Signal", "Viber", "iMessage"].includes(app);
                                                                const val = e.target.value;
                                                                const hasLetters = /[a-zA-Z]/.test(val);

                                                                // Format if it's a known phone app OR if the input looks like a phone number (no letters)
                                                                if (isPhoneApp || (!hasLetters && val.length > 0)) {
                                                                    const formatted = formatPhoneNumber(val);
                                                                    // We need to set the value explicitly to update the form state and UI
                                                                    if (formatted !== val) {
                                                                        setValue(`messaging_apps.${index}.handle`, formatted);
                                                                    }
                                                                }
                                                            }
                                                        })}
                                                        placeholder="@handle or number"
                                                        className="w-full bg-transparent border-none text-white text-sm focus:ring-0 placeholder:text-zinc-600 h-[42px] px-3 outline-none"
                                                    />
                                                </div>
                                                {/* Delete Button (Inside) */}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => remove(index)}
                                                    className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0 rounded-full mr-1"
                                                >
                                                    <Trash2 size={15} />
                                                </Button>
                                            </div>

                                            {/* Add Button (Outside) */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => append({ app: "", handle: "" })}
                                                className="text-zinc-500 hover:text-cyan-400 hover:bg-cyan-400/10 h-8 w-8 p-0 rounded-lg transition-colors shrink-0"
                                            >
                                                <Plus size={16} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-zinc-300 flex items-center gap-2">
                                    <FileText size={16} className="text-zinc-500" />
                                    Notes
                                </Label>
                                <Textarea
                                    {...register("notes")}
                                    placeholder="Additional notes..."
                                    className="min-h-[100px] bg-[#0b1115] border-white/10"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="shrink-0 flex justify-end items-center gap-4 py-4 px-6 border-t border-white/10 mt-auto bg-zinc-950/40 backdrop-blur-md">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-cyan-400 hover:bg-cyan-400 text-white font-bold rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {initialData ? "Update" : "Create"}
                    </Button>
                </div>

            </form>
        </SidePanel >
    );
}
