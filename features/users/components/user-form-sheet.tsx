"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Eye, EyeOff, Copy, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import type { User, CreateUserData, UpdateUserData } from "@/features/users/hooks/use-users";
import type { Role } from "@/features/users/hooks/use-roles";
import { cn } from "@/lib/utils";

const userSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email required"),
    is_tenant_admin: z.boolean(),
    role_ids: z.array(z.string()),
    temp_password: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateUserData | UpdateUserData, userId?: string) => Promise<boolean>;
    initialData?: User | null;
    availableRoles: Role[];
}

function generatePassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export function UserFormSheet({ isOpen, onClose, onSubmit, initialData, availableRoles }: UserFormSheetProps) {
    const isEditing = !!initialData;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState("");

    const {
        register,
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
            is_tenant_admin: false,
            role_ids: [],
            temp_password: "",
        }
    });

    const selectedRoles = watch("role_ids") || [];

    // Reset form when sheet opens/closes or initial data changes
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    name: initialData.name,
                    email: initialData.email,
                    is_tenant_admin: initialData.is_tenant_admin,
                    role_ids: initialData.roles?.map(r => r.id) || [],
                    temp_password: "",
                });
                setGeneratedPassword("");
            } else {
                const pw = generatePassword();
                reset({
                    name: "",
                    email: "",
                    is_tenant_admin: false,
                    role_ids: [],
                    temp_password: pw,
                });
                setGeneratedPassword(pw);
            }
        }
    }, [isOpen, initialData, reset]);

    const handleGeneratePassword = () => {
        const pw = generatePassword();
        setGeneratedPassword(pw);
        setValue("temp_password", pw, { shouldDirty: true });
    };

    const handleCopyPassword = () => {
        navigator.clipboard.writeText(generatedPassword);
        toast.success("Password copied to clipboard");
    };

    const toggleRole = (roleId: string) => {
        const current = selectedRoles;
        if (current.includes(roleId)) {
            setValue("role_ids", current.filter(id => id !== roleId), { shouldDirty: true });
        } else {
            setValue("role_ids", [...current, roleId], { shouldDirty: true });
        }
    };

    const onFormSubmit = async (data: UserFormData) => {
        setIsSubmitting(true);
        try {
            const success = await onSubmit(
                isEditing
                    ? {
                        name: data.name,
                        is_tenant_admin: data.is_tenant_admin,
                        role_ids: data.role_ids,
                    }
                    : {
                        email: data.email,
                        name: data.name,
                        temp_password: data.temp_password,
                        is_tenant_admin: data.is_tenant_admin,
                        role_ids: data.role_ids,
                    },
                initialData?.id
            );
            if (success) {
                onClose();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-zinc-950 border-l border-white/10 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <h2 className="text-lg font-semibold text-white">
                                {isEditing ? "Edit User" : "Invite User"}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Full Name</label>
                                    <input
                                        {...register("name")}
                                        className="w-full bg-[#0b1115] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                                        placeholder="John Smith"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-400">{errors.name.message}</p>
                                    )}
                                </div>

                                {/* Email (disabled when editing) */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Email Address</label>
                                    <input
                                        {...register("email")}
                                        type="email"
                                        disabled={isEditing}
                                        className={cn(
                                            "w-full bg-[#0b1115] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none transition-colors",
                                            isEditing && "opacity-50 cursor-not-allowed"
                                        )}
                                        placeholder="john@company.com"
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-400">{errors.email.message}</p>
                                    )}
                                    {isEditing && (
                                        <p className="text-xs text-zinc-500">Email cannot be changed</p>
                                    )}
                                </div>

                                {/* Temporary Password (only for new users) */}
                                {!isEditing && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400">Temporary Password</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input
                                                    {...register("temp_password")}
                                                    type={showPassword ? "text" : "password"}
                                                    className="w-full bg-[#0b1115] border border-white/10 rounded-lg px-4 py-2.5 pr-20 text-white focus:border-cyan-500/50 focus:outline-none transition-colors font-mono"
                                                />
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleCopyPassword}
                                                        className="p-1.5 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                                    >
                                                        <Copy size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleGeneratePassword}
                                                className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors"
                                                title="Generate new password"
                                            >
                                                <RefreshCw size={18} />
                                            </button>
                                        </div>
                                        {errors.temp_password && (
                                            <p className="text-sm text-red-400">{errors.temp_password.message}</p>
                                        )}
                                        <p className="text-xs text-zinc-500">
                                            User will be prompted to change this on first login
                                        </p>
                                    </div>
                                )}

                                {/* Tenant Admin Toggle */}
                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div>
                                        <p className="font-medium text-white">Tenant Administrator</p>
                                        <p className="text-sm text-zinc-400">Full access to manage users and settings</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register("is_tenant_admin")}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                                    </label>
                                </div>

                                {/* Role Selection */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-zinc-400">Assign Roles</label>
                                    <div className="space-y-2">
                                        {availableRoles.length === 0 ? (
                                            <p className="text-sm text-zinc-500 p-4 bg-white/5 rounded-lg text-center">
                                                No roles available. Create roles first.
                                            </p>
                                        ) : (
                                            availableRoles.map(role => (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => toggleRole(role.id)}
                                                    className={cn(
                                                        "w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left",
                                                        selectedRoles.includes(role.id)
                                                            ? "bg-cyan-500/10 border-cyan-500/50 text-white"
                                                            : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
                                                    )}
                                                >
                                                    <div>
                                                        <p className="font-medium">{role.name}</p>
                                                        {role.description && (
                                                            <p className="text-sm text-zinc-500">{role.description}</p>
                                                        )}
                                                    </div>
                                                    <div className={cn(
                                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                                        selectedRoles.includes(role.id)
                                                            ? "bg-cyan-500 border-cyan-500"
                                                            : "border-zinc-600"
                                                    )}>
                                                        {selectedRoles.includes(role.id) && (
                                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit(onFormSubmit)}
                                disabled={isSubmitting || (!isDirty && isEditing)}
                                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
                            >
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                {isEditing ? "Save Changes" : "Send Invite"}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
