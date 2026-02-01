"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, Info, Handshake, Phone, Mail, FileText, MapPin, Contact, MessageCircle, UserPlus, KeyRound, Eye, EyeOff, Copy, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";
import { CustomSelect } from "@/components/ui/custom-select";
import { RequiredIndicator } from "@/components/ui/required-indicator";
import { toast } from "sonner";

// Brand icons for messaging apps
import { FaWhatsapp, FaFacebookMessenger, FaTelegram, FaViber, FaWeixin, FaLine } from "react-icons/fa";
import { SiSignal } from "react-icons/si";

// Messaging app options with icons
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
    name: z.string().min(2, "Business Name is required"),
    full_name: z.string().optional(), // Contact Person Name
    nickname: z.string().optional(), // Contact Person Nickname
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    ein_number: z.string().optional(),
    preferred_messaging_app: z.string().optional().nullable(),
    messaging_handle: z.string().optional().nullable(),
    // User account fields
    create_user_account: z.boolean(),
    temp_password: z.string().optional(),
});

function generatePassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

type VendorFormData = z.infer<typeof VendorSchema>;

interface AddVendorSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export function AddVendorSheet({ isOpen, onClose, onSuccess, initialData }: AddVendorSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [vendorContactRoleId, setVendorContactRoleId] = useState<string | null>(null);

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
            full_name: "",
            nickname: "",
            address: "",
            city: "",
            state: "",
            zip_code: "",
            phone: "",
            email: "",
            ein_number: "",
            preferred_messaging_app: "",
            messaging_handle: "",
            create_user_account: false,
            temp_password: "",
        }
    });

    // Fetch Vendor Contact role on mount
    useEffect(() => {
        const fetchVendorRole = async () => {
            const { data } = await supabase
                .from("roles")
                .select("id")
                .eq("name", "Vendor Contact")
                .single();
            if (data) {
                setVendorContactRoleId(data.id);
            }
        };
        fetchVendorRole();
    }, []);

    // Reset when opening/changing mode
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    name: initialData.name,
                    full_name: "", // We don't have this on vendor yet, unless we fetch linked user
                    nickname: "", // Same as above
                    address: initialData.address || "",
                    city: initialData.city || "",
                    state: initialData.state || "",
                    zip_code: initialData.zip_code || "",
                    phone: formatPhoneNumber(initialData.phone || ""),
                    email: initialData.email || "",
                    ein_number: initialData.ein_number || "",
                    preferred_messaging_app: initialData.preferred_messaging_app || "",
                    messaging_handle: initialData.messaging_handle || "",
                    create_user_account: false,
                    temp_password: "",
                });
            } else {
                const pw = generatePassword();
                reset({
                    name: "",
                    full_name: "",
                    nickname: "",
                    address: "",
                    city: "",
                    state: "",
                    zip_code: "",
                    phone: "",
                    email: "",
                    ein_number: "",
                    preferred_messaging_app: "",
                    messaging_handle: "",
                    create_user_account: false,
                    temp_password: pw,
                });
            }
        }
    }, [isOpen, initialData, reset]);

    const onSubmit = async (data: VendorFormData) => {
        setIsSubmitting(true);
        try {
            // Strip formatting and create payload (no name/email/phone - those go to users table)
            const payload: Record<string, any> = {
                address: data.address || null,
                city: data.city || null,
                state: data.state || null,
                zip_code: data.zip_code || null,
                ein_number: data.ein_number || null,
                preferred_messaging_app: data.preferred_messaging_app || null,
                messaging_handle: data.messaging_handle || null
            };

            // Create user account if requested
            if (data.create_user_account && data.email && data.temp_password) {
                // Check if user already exists
                const { data: existingUser } = await supabase
                    .from("users")
                    .select("id")
                    .eq("email", data.email)
                    .single();

                if (existingUser) {
                    payload.user_id = existingUser.id;
                    toast.info("Linked to existing user account");
                } else {
                    // Create new user
                    // USE FULL NAME FOR USER ACCOUNT, FALLBACK TO BUSINESS NAME
                    const userName = data.full_name || data.name;

                    const { data: newUser, error: userError } = await supabase
                        .from("users")
                        .insert([{
                            email: data.email,
                            name: userName,
                            nickname: data.nickname || null,
                            password_hash: data.temp_password,
                            temp_password: true,
                            phone_number: data.phone?.replace(/\D/g, "") || null,
                            address: data.address || null,
                            city: data.city || null,
                            state: data.state || null,
                            zip_code: data.zip_code || null,
                            messaging_apps: data.preferred_messaging_app
                                ? [{ type: data.preferred_messaging_app, handle: data.messaging_handle || "" }]
                                : [],
                        }])
                        .select()
                        .single();

                    if (userError) throw userError;

                    payload.user_id = newUser.id;

                    // Assign Vendor Contact role if available
                    if (vendorContactRoleId && newUser.id) {
                        await supabase
                            .from("user_roles")
                            .insert([{
                                user_id: newUser.id,
                                role_id: vendorContactRoleId,
                            }])
                            .single();
                    }

                    toast.success("User account created with Vendor Contact role");
                }
            }

            if (initialData?.id) {
                // UPDATE MODE - also update user record with identity data
                const { data: vendorRecord } = await supabase
                    .from("vendors")
                    .select("user_id")
                    .eq("id", initialData.id)
                    .single();

                if (vendorRecord?.user_id) {
                    const userName = data.full_name || data.name;
                    await supabase
                        .from("users")
                        .update({
                            name: userName,
                            email: data.email || null,
                            phone_number: data.phone?.replace(/\D/g, "") || null,
                        })
                        .eq("id", vendorRecord.user_id);
                }

                const { error } = await supabase
                    .from("vendors")
                    .update(payload)
                    .eq("id", initialData.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("vendors")
                    .insert([payload] as any);
                if (error) throw error;
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error saving vendor:", err);
            toast.error("Failed to save vendor.");
        } finally {
            setIsSubmitting(false);
        }
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
                            {/* Row 1: Contact Name and Nickname */}
                            <div className="space-y-2">
                                <Label className="text-foreground flex items-center gap-2">
                                    <UserPlus size={16} className="text-muted-foreground" />
                                    Contact Person (Full Name)
                                </Label>
                                <Input
                                    {...register("full_name")}
                                    placeholder="e.g. John Doe"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-foreground flex items-center gap-2">
                                    <span className="text-muted-foreground">👤</span>
                                    Nickname
                                </Label>
                                <Input
                                    {...register("nickname")}
                                    placeholder="e.g. Johnny"
                                />
                            </div>

                            {/* Row 2: Business Name and EIN */}
                            <div className="space-y-2">
                                <Label className="text-foreground flex items-center gap-2">
                                    <Handshake size={16} className="text-muted-foreground" />
                                    Business Name <RequiredIndicator />
                                </Label>
                                <Input
                                    {...register("name")}
                                    placeholder="e.g. Acme Transport Co."
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-foreground flex items-center gap-2">
                                    <FileText size={16} className="text-muted-foreground" />
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
                                    <Label className="text-foreground flex items-center gap-2">
                                        <Phone size={16} className="text-muted-foreground" />
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
                                    <Label className="text-foreground flex items-center gap-2">
                                        <Mail size={16} className="text-muted-foreground" />
                                        Email Address
                                    </Label>
                                    <Input
                                        {...register("email")}
                                        placeholder="contact@vendor.com"
                                    />
                                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                                </div>
                            </div>



                            <div className="space-y-3 pt-2">
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-foreground flex items-center gap-2">
                                                <MessageCircle size={16} className="text-muted-foreground" />
                                                Preferred Messaging
                                            </Label>
                                            <CustomSelect
                                                value={watch("preferred_messaging_app") || ""}
                                                onChange={(val) => {
                                                    setValue("preferred_messaging_app", val || "", { shouldDirty: true });
                                                    if (!val) setValue("messaging_handle", "");
                                                }}
                                                options={MESSAGING_OPTIONS}
                                                placeholder="Select App..."
                                            />
                                        </div>

                                        {watch("preferred_messaging_app") && (
                                            <div className="space-y-2">
                                                <Label className="text-foreground flex items-center gap-2">
                                                    Handle / Nickname
                                                </Label>
                                                <Input
                                                    {...register("messaging_handle")}
                                                    placeholder="@username or phone"
                                                />
                                            </div>
                                        )}
                                    </div>
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
                                        placeholder="Select State"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-foreground">Zip Code</Label>
                                    <Input {...register("zip_code")} placeholder="Zip" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Account Section - Only for new vendors */}
                    {!initialData && (
                        <div>
                            <SectionHeader icon={UserPlus} title="User Account (Optional)" />
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                                    <div>
                                        <p className="font-medium text-foreground">Create Login Account</p>
                                        <p className="text-sm text-muted-foreground">Allow this vendor contact to log in to the portal</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register("create_user_account")}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>

                                {watch("create_user_account") && (
                                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/30 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <KeyRound size={16} className="text-primary" />
                                                <span className="text-sm font-medium text-foreground">Temporary Password</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setValue("temp_password", generatePassword(), { shouldDirty: true })}
                                                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                    title="Generate new password"
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(watch("temp_password") || "");
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
                                        <div className="relative">
                                            <Input
                                                {...register("temp_password")}
                                                type={showPassword ? "text" : "password"}
                                                className="font-mono text-sm bg-muted border-border"
                                                readOnly
                                            />
                                        </div>
                                        <p className="text-xs text-primary/70">
                                            ⚠️ Share this password securely. User will be prompted to change it on first login.
                                        </p>
                                        {!watch("email") && (
                                            <p className="text-xs text-yellow-500">
                                                ⚠️ Email address is required to create a user account.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
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
                            isSubmitting ? "bg-primary/50 text-white cursor-not-allowed" :
                                isDirty ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" :
                                    "bg-muted text-muted-foreground cursor-not-allowed border border-border"
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
