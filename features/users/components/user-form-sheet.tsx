"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash2, Info, Contact, MapPin, Shield, MessageCircle, RefreshCw, Copy, Eye, EyeOff, Save, Check, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidePanel } from "@/components/ui/side-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/custom-select";
import { RequiredIndicator } from "@/components/ui/required-indicator";
import type { User, CreateUserData, UpdateUserData } from "@/features/users/hooks/use-users";
import type { StaffPosition } from "@/features/settings/hooks/use-staff-positions";

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

const userSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email required"),
    nickname: z.string().optional(),
    phone_number: z.string().optional(),
    notes: z.string().optional(),
    password: z.string().optional(),
    position_id: z.string().optional(),
    messaging_apps: z.array(z.object({
        type: z.string().min(1, "App name required"),
        handle: z.string().min(1, "Handle required")
    })).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateUserData | UpdateUserData, userId?: string) => Promise<boolean>;
    initialData?: User | null;
    availablePositions: StaffPosition[];
}

export function UserFormSheet({ isOpen, onClose, onSubmit, initialData, availablePositions }: UserFormSheetProps) {
    const isEditing = !!initialData;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isDirty }
    } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: "",
            email: "",
            nickname: "",
            phone_number: "",
            notes: "",
            password: "",
            position_id: "",
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

    const selectedPositionId = watch("position_id");

    // Reset form when sheet opens/closes or initial data changes
    useEffect(() => {
        if (isOpen) {
            const initialApps = initialData?.messaging_apps || [];
            reset({
                name: initialData?.name || "",
                email: initialData?.email || "",
                nickname: initialData?.nickname || "",
                phone_number: initialData?.phone_number || "",
                notes: initialData?.notes || "",
                password: "",
                position_id: initialData?.position?.id || "",
                messaging_apps: initialApps,
                address: initialData?.address || "",
                city: initialData?.city || "",
                state: initialData?.state || "",
                zip_code: initialData?.zip_code || "",
            });
            // Ensure at least one empty row if no apps exist
            if (initialApps.length === 0) {
                append({ type: "", handle: "" });
            }
        }
    }, [isOpen, initialData, reset, append]);

    const onFormSubmit = async (data: UserFormData) => {
        // Filter out empty entries before submitting
        const cleanedApps = (data.messaging_apps || []).filter(app => app.type && app.handle);
        data.messaging_apps = cleanedApps;

        setIsSubmitting(true);
        try {
            const success = await onSubmit(
                isEditing
                    ? {
                        position_id: data.position_id,
                        name: data.name,
                        email: data.email,
                        nickname: data.nickname,
                        password: data.password,
                        phone_number: data.phone_number,
                        notes: data.notes,
                        messaging_apps: data.messaging_apps,
                        address: data.address,
                        city: data.city,
                        state: data.state,
                        zip_code: data.zip_code,
                    }
                    : {
                        email: data.email,
                        name: data.name,
                        nickname: data.nickname,
                        password: data.password,
                        position_id: data.position_id,
                        phone_number: data.phone_number,
                        notes: data.notes,
                        messaging_apps: data.messaging_apps,
                        address: data.address,
                        city: data.city,
                        state: data.state,
                        zip_code: data.zip_code,
                    },
                initialData?.id // This is Member ID
            );
            if (success) {
                onClose();
            }
        } finally {
            setIsSubmitting(false);
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

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Edit Staff" : "+ Add Staff"}
            description={isEditing ? "Update member details and position." : "Invite a new member to the organization."}
            width="max-w-2xl"
            contentClassName="p-0 overflow-hidden flex flex-col"
        >
            <form onSubmit={handleSubmit(onFormSubmit)} className="h-full flex flex-col">

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24 space-y-8">

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
                                        placeholder="john@company.com"
                                        className={cn(errors.email && "border-destructive")}
                                    />
                                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                                </div>
                            </div>

                            {/* Messaging Apps - Moved under Phone/Email */}
                            <div className="space-y-3 pt-2">
                                <div className="space-y-3">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-foreground flex items-center gap-2">
                                                    <MessageCircle size={16} className="text-muted-foreground" />
                                                    Preferred Messaging
                                                </Label>
                                                <CustomSelect
                                                    value={watch(`messaging_apps.${index}.type`) || ""}
                                                    onChange={(val) => {
                                                        setValue(`messaging_apps.${index}.type`, val || "", { shouldDirty: true });
                                                        // Clear handle when app is unselected
                                                        if (!val) setValue(`messaging_apps.${index}.handle`, "");
                                                    }}
                                                    options={MESSAGING_OPTIONS}
                                                    placeholder="Select App..."
                                                />
                                            </div>

                                            {/* Handle/Nickname - Only shows when app is selected */}
                                            {watch(`messaging_apps.${index}.type`) && (
                                                <div className="space-y-2">
                                                    <Label className="text-foreground flex items-center gap-2">
                                                        Handle / Nickname
                                                    </Label>
                                                    <Input
                                                        {...register(`messaging_apps.${index}.handle`)}
                                                        placeholder="@username or phone"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
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

                    {/* Position & Role */}
                    <div>
                        <SectionHeader icon={UserPlus} title="Position & Access" />
                        <div className="space-y-4">
                            <Label className="text-foreground">Organization Position</Label>
                            <div className="space-y-2">
                                {availablePositions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground p-4 bg-muted/40 rounded-lg text-center">
                                        No positions available. Create positions in Roles & Permissions.
                                    </p>
                                ) : (
                                    <div className="grid gap-2">
                                        {availablePositions.map(position => (
                                            <button
                                                key={position.id}
                                                type="button"
                                                onClick={() => setValue("position_id", position.id, { shouldDirty: true })}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left",
                                                    selectedPositionId === position.id
                                                        ? "bg-primary/10 border-primary/50 text-foreground"
                                                        : "bg-muted/30 border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-3 h-3 rounded-full shrink-0"
                                                        style={{ backgroundColor: position.color || '#71717a' }}
                                                    />
                                                    <div>
                                                        <p className="font-medium">{position.name}</p>
                                                    </div>
                                                </div>
                                                {selectedPositionId === position.id && (
                                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                                        <Check size={12} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                The position determines the user&apos;s permissions via the assigned Permission Group.
                            </p>
                        </div>
                    </div>

                    {/* Security */}
                    <div>
                        <SectionHeader icon={Shield} title="Security" />
                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-foreground font-medium">
                                        {isEditing ? "Reset Password" : "Initial Password"}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        {isEditing ? "Enter a new password to reset it immediately." : "Set a temporary password for the new user."}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={generatePassword}
                                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        title="Generate new password"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
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
                                placeholder={isEditing ? "Leave blank to keep current" : "Enter password"}
                                className="font-mono"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <SectionHeader icon={Info} title="Notes & Internal" />
                        <div className="space-y-2">
                            <Label className="text-foreground">Internal Notes</Label>
                            <Textarea
                                {...register("notes")}
                                className="min-h-[100px]"
                                placeholder="Internal notes about this user..."
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 flex justify-end items-center gap-4 py-4 px-6 border-t border-border mt-auto bg-card">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || (!isDirty && isEditing)}
                        className={cn(
                            "px-6 py-2 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors",
                            isSubmitting ? "bg-primary/50 text-white cursor-not-allowed" :
                                (isDirty || !isEditing) ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" :
                                    "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                        )}
                    >
                        {isSubmitting ? <><Loader2 className="animate-spin" size={16} /> Saving...</> :
                            isEditing ? <><Save size={16} /> Save Changes</> :
                                "+ Add Staff"}
                    </Button>
                </div>

            </form>
        </SidePanel>
    );
}
