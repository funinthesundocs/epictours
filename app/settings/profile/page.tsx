"use client";

import { PageShell } from "@/components/shell/page-shell";
import { User, Mail, Save, Loader2, Info, Contact, MapPin, MessageCircle, Plus, Trash2, Shield, RefreshCw, Copy, Eye, EyeOff, LogOut } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { CustomSelect } from "@/components/ui/custom-select";
import { UserService } from "@/lib/services/user-service";
import { RequiredIndicator } from "@/components/ui/required-indicator";
import { cn } from "@/lib/utils";

// Brand icons for messaging apps
import { FaWhatsapp, FaFacebookMessenger, FaTelegram, FaViber, FaWeixin, FaLine } from "react-icons/fa";
import { SiSignal } from "react-icons/si";

const MESSAGING_OPTIONS = [
    { value: "", label: "None", icon: null },
    { value: "WhatsApp", label: "WhatsApp", icon: <FaWhatsapp size={16} className="text-[#25D366]" /> },
    { value: "FB Messenger", label: "FB Messenger", icon: <FaFacebookMessenger size={16} className="text-[#0084FF]" /> },
    { value: "Signal", label: "Signal", icon: <SiSignal size={16} className="text-[#3A76F0]" /> },
    { value: "Telegram", label: "Telegram", icon: <FaTelegram size={16} className="text-[#0088cc]" /> },
    { value: "Viber", label: "Viber", icon: <FaViber size={16} className="text-[#7360f2]" /> },
    { value: "Line", label: "Line", icon: <FaLine size={16} className="text-[#00C300]" /> },
    { value: "WeChat", label: "WeChat", icon: <FaWeixin size={16} className="text-[#7BB32E]" /> },
];

const US_STATES = [
    { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" }, { value: "AZ", label: "Arizona" },
    { value: "AR", label: "Arkansas" }, { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
    { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" }, { value: "DC", label: "District of Columbia" },
    { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" },
    { value: "ID", label: "Idaho" }, { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" },
    { value: "IA", label: "Iowa" }, { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" },
    { value: "LA", label: "Louisiana" }, { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" },
    { value: "MA", label: "Massachusetts" }, { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" },
    { value: "MS", label: "Mississippi" }, { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" },
    { value: "NE", label: "Nebraska" }, { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" },
    { value: "NJ", label: "New Jersey" }, { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" },
    { value: "NC", label: "North Carolina" }, { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" },
    { value: "OK", label: "Oklahoma" }, { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" },
    { value: "RI", label: "Rhode Island" }, { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" },
    { value: "TN", label: "Tennessee" }, { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" },
    { value: "VT", label: "Vermont" }, { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" },
    { value: "WV", label: "West Virginia" }, { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" }
];

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    nickname: z.string().optional(),
    phone_number: z.string().optional(),
    notes: z.string().optional(),
    password: z.string().optional(),
    messaging_apps: z.array(z.object({
        type: z.string().min(1, "App name required"),
        handle: z.string().min(1, "Handle required")
    })).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
});

type ProfileFormData = z.infer<typeof formSchema>;

export default function UserProfilePage() {
    const { user, refreshUser, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isDirty }
    } = useForm<ProfileFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            nickname: "",
            phone_number: "",
            notes: "",
            password: "",
            messaging_apps: [],
            address: "",
            city: "",
            state: "",
            zip_code: "",
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "messaging_apps"
    });

    useEffect(() => {
        const fetchUser = async () => {
            if (!user?.id) return;
            setIsLoading(true);

            // We need to fetch the raw data to get all columns, or update useAuth to return everything
            // For now, fetch direct from updated schema
            const { data, error } = await supabase
                .from("users")
                .select(`
                    id, name, email, nickname, phone_number, notes, messaging_apps,
                    address, city, state, zip_code
                `)
                .eq("id", user.id)
                .single();

            if (data) {
                reset({
                    name: data.name || "",
                    email: data.email || "",
                    nickname: data.nickname || "",
                    phone_number: data.phone_number || "",
                    notes: data.notes || "",
                    password: "",
                    messaging_apps: data.messaging_apps || [],
                    address: data.address || "",
                    city: data.city || "",
                    state: data.state || "",
                    zip_code: data.zip_code || "",
                });
            }
            setIsLoading(false);
        };
        fetchUser();
    }, [user?.id, reset]);

    const onSubmit = async (data: ProfileFormData) => {
        if (!user?.id) return;
        setIsSaving(true);
        try {
            await UserService.updateUser(user.id, {
                name: data.name,
                nickname: data.nickname,
                phone_number: data.phone_number,
                notes: data.notes,
                password: data.password || undefined,
                messaging_apps: data.messaging_apps,
                address: data.address,
                city: data.city,
                state: data.state,
                zip_code: data.zip_code
            });

            toast.success("Profile updated successfully");
            // refreshUser(); // If available

            // Re-fetch to confirm state (optional, or just reset dirty state)
            reset(data); // Reset form with new data to clear dirtiness
        } catch (err: any) {
            console.error("Error updating profile:", err);
            toast.error(err.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const generatePassword = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setValue("password", password, { shouldDirty: true });
    };

    const formatPhoneNumber = (value: string) => {
        const numbers = value.replace(/\D/g, "");
        if (numbers.length === 0) return "";
        if (numbers.length <= 3) return `(${numbers}`;
        if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
        return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    };

    const SectionHeader = ({ icon: Icon, title, className }: { icon: any, title: string, className?: string }) => (
        <div className={`flex items-center gap-2 bg-muted -mx-6 px-6 py-3 mb-6 border-y border-border ${className || ''}`}>
            <Icon size={16} className="text-primary" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</h3>
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingState message="Loading profile..." size="lg" />
            </div>
        );
    }

    return (
        <PageShell
            title="My Profile"
            description="Manage your personal account details and preferences."
            stats={[
                { label: "Role", value: user?.isPlatformAdmin ? "Administrator" : "User", icon: Shield },
                { label: "Email", value: user?.email || "N/A", icon: Mail },
            ]}
            action={
                <button
                    type="button"
                    onClick={() => logout()}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors"
                >
                    <LogOut size={16} />
                    Log Out
                </button>
            }
        >
            <div className="max-w-2xl mx-auto bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">

                    <div className="p-6 space-y-8">
                        {/* Basic Information */}
                        <div>
                            <SectionHeader icon={Info} title="Basic Information" className="-mt-6 border-t-0" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-foreground flex items-center gap-2">
                                        Full Name <RequiredIndicator />
                                    </Label>
                                    <Input
                                        {...register("name")}
                                        placeholder="John Doe"
                                        className={cn(errors.name && "border-destructive")}
                                    />
                                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-foreground flex items-center gap-2">
                                        Nickname
                                    </Label>
                                    <Input
                                        {...register("nickname")}
                                        placeholder="Johnny"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Details */}
                        <div>
                            <SectionHeader icon={Contact} title="Contact Details" />
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-foreground flex items-center gap-2">
                                            <MapPin size={16} className="text-muted-foreground" />
                                            Phone Number
                                        </Label>
                                        <Input
                                            {...register("phone_number", {
                                                onChange: (e) => e.target.value = formatPhoneNumber(e.target.value)
                                            })}
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-foreground flex items-center gap-2">
                                            Email Address <RequiredIndicator />
                                        </Label>
                                        <Input
                                            {...register("email")}
                                            disabled
                                            className="bg-muted opacity-70 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-muted-foreground">Email cannot be changed directly.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-foreground flex items-center gap-2">
                                        <MapPin size={16} className="text-muted-foreground" />
                                        Street Address
                                    </Label>
                                    <Input
                                        {...register("address")}
                                        placeholder="123 Main Street..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="col-span-2 space-y-2">
                                        <Label className="text-foreground">City</Label>
                                        <Input {...register("city")} placeholder="City" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-foreground">State</Label>
                                        <Combobox
                                            value={watch("state")}
                                            onChange={(val) => setValue("state", val, { shouldDirty: true })}
                                            options={US_STATES}
                                            placeholder="Select..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-foreground">Zip Code</Label>
                                        <Input {...register("zip_code")} placeholder="Zip" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messaging Apps */}
                        <div>
                            <SectionHeader icon={MessageCircle} title="Messaging Apps" />
                            <div className="space-y-3">
                                <div className="flex items-center justify-between pb-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Connected Apps</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                                        onClick={() => append({ type: "", handle: "" })}
                                    >
                                        <Plus size={16} className="mr-1" /> Add App
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex gap-2 items-start">
                                            <div className="w-1/3">
                                                <CustomSelect
                                                    value={watch(`messaging_apps.${index}.type`) || ""}
                                                    onChange={(val) => setValue(`messaging_apps.${index}.type`, val || "", { shouldDirty: true })}
                                                    options={MESSAGING_OPTIONS}
                                                    placeholder="App"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <Input
                                                    {...register(`messaging_apps.${index}.handle`)}
                                                    placeholder="Handle / Number"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                                onClick={() => remove(index)}
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    ))}
                                    {fields.length === 0 && (
                                        <div className="text-sm text-muted-foreground italic text-center py-4 bg-muted/20 border border-dashed border-border rounded-lg">
                                            No messaging apps added
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <SectionHeader icon={Info} title="Personal Notes" />
                            <div className="space-y-2">
                                <Label className="text-foreground">Notes</Label>
                                <Textarea
                                    {...register("notes")}
                                    className="min-h-[100px]"
                                    placeholder="Personal notes..."
                                />
                            </div>
                        </div>

                        {/* Security */}
                        <div>
                            <SectionHeader icon={Shield} title="Security" />
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-foreground font-medium">
                                            Change Password
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Enter a new password to update your login credentials.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={generatePassword}
                                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                            title="Generate secure password"
                                        >
                                            <RefreshCw size={14} />
                                        </button>
                                        {watch("password") && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(watch("password") || "");
                                                    toast.success("Password copied!");
                                                }}
                                                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                title="Copy password"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                            title={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <Input
                                    {...register("password")}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Leave blank to keep current password"
                                    className="font-mono"
                                />
                            </div>
                        </div>

                    </div>

                    <div className="flex justify-end items-center gap-4 py-4 px-6 border-t border-border bg-muted/30">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => reset()}
                            disabled={!isDirty || isSaving}
                        >
                            Reset
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving || !isDirty}
                            className={cn(
                                "bg-primary text-primary-foreground hover:bg-primary/90 min-w-[140px]",
                                isSaving && "opacity-80 cursor-not-allowed"
                            )}
                        >
                            {isSaving ? <><Loader2 className="animate-spin mr-2" size={16} /> Saving...</> : <><Save className="mr-2" size={16} /> Save Changes</>}
                        </Button>
                    </div>
                </form>
            </div>
        </PageShell>
    );
}
