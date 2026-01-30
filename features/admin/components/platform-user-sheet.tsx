"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
import { AuthenticatedUser } from "@/features/auth/types";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
});

export type PlatformUserData = z.infer<typeof formSchema>;

interface PlatformUserSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PlatformUserData, userId?: string) => Promise<boolean>;
    initialData: AuthenticatedUser | null;
}

export function PlatformUserSheet({
    isOpen,
    onClose,
    onSubmit,
    initialData
}: PlatformUserSheetProps) {
    const isEditing = !!initialData;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm<PlatformUserData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
        },
    });

    // Reset form when opening/closing or changing data
    useEffect(() => {
        if (isOpen) {
            reset({
                name: initialData?.name || "",
                email: initialData?.email || "",
            });
        }
    }, [isOpen, initialData, reset]);

    const onFormSubmit = async (data: PlatformUserData) => {
        setIsSubmitting(true);
        try {
            const success = await onSubmit(data, initialData?.id);
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
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold text-foreground">
                                    {isEditing ? "Edit User" : "Add Platform User"}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    {isEditing
                                        ? "Update user details."
                                        : "Create a new user. They will be sent an email."}
                                </p>
                            </div>
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
                                    <Input
                                        {...register("name")}
                                        className={cn(
                                            "bg-input border-border text-foreground",
                                            errors.name && "border-destructive"
                                        )}
                                        placeholder="John Doe"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name.message}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                                    <Input
                                        {...register("email")}
                                        disabled={isEditing}
                                        className={cn(
                                            "bg-input border-border text-foreground",
                                            isEditing && "opacity-50 cursor-not-allowed",
                                            errors.email && "border-destructive"
                                        )}
                                        placeholder="john@example.com"
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-destructive">{errors.email.message}</p>
                                    )}
                                    {isEditing && (
                                        <p className="text-xs text-muted-foreground">Email cannot be changed directly.</p>
                                    )}
                                </div>
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
                            <Button variant="outline" type="button" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit(onFormSubmit)}
                                disabled={isSubmitting}
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? "Save Changes" : "Create User"}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
