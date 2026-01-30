"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Eye, EyeOff, Copy, RefreshCw, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import type { User, CreateUserData, UpdateUserData } from "@/features/users/hooks/use-users";
import type { StaffPosition } from "@/features/settings/hooks/use-staff-positions";
import { cn } from "@/lib/utils";

const userSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email required"),
    position_id: z.string().optional(),
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
            position_id: "",
        }
    });

    const selectedPositionId = watch("position_id");

    // Reset form when sheet opens/closes or initial data changes
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    name: initialData.name,
                    email: initialData.email,
                    position_id: initialData.position?.id || "",
                });
            } else {
                reset({
                    name: "",
                    email: "",
                    position_id: "",
                });
            }
        }
    }, [isOpen, initialData, reset]);

    const onFormSubmit = async (data: UserFormData) => {
        setIsSubmitting(true);
        try {
            const success = await onSubmit(
                isEditing
                    ? {
                        position_id: data.position_id,
                    }
                    : {
                        email: data.email,
                        name: data.name,
                        position_id: data.position_id,
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

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">
                                {isEditing ? "Edit Team Member" : "Invite Team Member"}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                                    <input
                                        {...register("name")}
                                        disabled={isEditing} // Name usually editable by user only, or allow admin? For now lock it like email if editing MEMBER details not USER profile. But invite flow allows setting name.
                                        className={cn(
                                            "w-full bg-input border border-border rounded-lg px-4 py-2.5 text-foreground focus:border-ring focus:outline-none transition-colors",
                                            isEditing && "opacity-50 cursor-not-allowed"
                                        )}
                                        placeholder="John Smith"
                                    />
                                    {isEditing && <p className="text-xs text-muted-foreground">Name is managed by the user</p>}
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name.message}</p>
                                    )}
                                </div>

                                {/* Email (disabled when editing) */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                                    <input
                                        {...register("email")}
                                        type="email"
                                        disabled={isEditing}
                                        className={cn(
                                            "w-full bg-input border border-border rounded-lg px-4 py-2.5 text-foreground focus:border-ring focus:outline-none transition-colors",
                                            isEditing && "opacity-50 cursor-not-allowed"
                                        )}
                                        placeholder="john@company.com"
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-destructive">{errors.email.message}</p>
                                    )}
                                    {isEditing && (
                                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                                    )}
                                </div>

                                {/* Position Selection */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-muted-foreground">Position</label>
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
                                        The position determines the user's permissions via the assigned Permission Group.
                                    </p>
                                </div>
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit(onFormSubmit)}
                                disabled={isSubmitting || (!isDirty && isEditing)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold rounded-lg transition-colors"
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
