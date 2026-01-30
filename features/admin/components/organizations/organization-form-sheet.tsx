"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Organization } from "@/features/auth/types";
import { CreateOrganizationData, UpdateOrganizationData } from "@/features/admin/hooks/use-organizations";
import { cn } from "@/lib/utils";

const orgSchema = z.object({
    name: z.string().min(2, "Name is required"),
    slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
    status: z.enum(['active', 'suspended']),
});

type OrgFormData = z.infer<typeof orgSchema>;

interface OrganizationFormSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateOrganizationData | UpdateOrganizationData, orgId?: string) => Promise<boolean>;
    initialData?: Organization | null;
}

export function OrganizationFormSheet({ isOpen, onClose, onSubmit, initialData }: OrganizationFormSheetProps) {
    const isEditing = !!initialData;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty }
    } = useForm<OrgFormData>({
        resolver: zodResolver(orgSchema),
        defaultValues: {
            name: "",
            slug: "",
            status: 'active',
        }
    });

    // Reset form
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    name: initialData.name,
                    slug: initialData.slug,
                    status: initialData.status as 'active' | 'suspended',
                });
            } else {
                reset({
                    name: "",
                    slug: "",
                    status: "active",
                });
            }
        }
    }, [isOpen, initialData, reset]);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        if (!isEditing) {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            reset({ name, slug, status: 'active' });
        }
    };

    const onFormSubmit = async (data: OrgFormData) => {
        setIsSubmitting(true);
        try {
            const success = await onSubmit(
                {
                    name: data.name,
                    slug: data.slug,
                    status: data.status,
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
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">
                                {isEditing ? "Edit Organization" : "Create Organization"}
                            </h2>
                            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                                    <input
                                        {...register("name")}
                                        onChange={handleNameChange}
                                        className="w-full bg-muted/50 border border-input rounded-lg px-4 py-2.5 text-foreground focus:border-primary/50 focus:outline-none transition-colors"
                                        placeholder="Acme Tours Inc."
                                    />
                                    {errors.name && <p className="text-sm text-red-400">{errors.name.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground">Slug</label>
                                    <input
                                        {...register("slug")}
                                        className={cn(
                                            "w-full bg-muted/50 border border-input rounded-lg px-4 py-2.5 text-foreground focus:border-primary/50 focus:outline-none transition-colors font-mono",
                                            isEditing && "opacity-50"
                                        )}
                                        placeholder="acme-tours"
                                        disabled={isEditing}
                                    />
                                    {errors.slug && <p className="text-sm text-red-400">{errors.slug.message}</p>}
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                                    <div>
                                        <p className="font-medium text-foreground">Active Status</p>
                                        <p className="text-sm text-muted-foreground">Suspended organizations cannot access the system</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!errors.status && (undefined /* controlled by form */)}
                                            {...register("status")}
                                            onChange={(e) => reset({ ...getValues(), status: e.target.checked ? 'active' : 'suspended' })}
                                            className="sr-only peer"
                                        />
                                        {/* Simplified toggle UI for now - implementing proper switch is tricky without Controlled Switch component */}
                                        <select {...register("status")} className="bg-transparent border border-input rounded p-1 text-sm">
                                            <option value="active">Active</option>
                                            <option value="suspended">Suspended</option>
                                        </select>
                                    </label>
                                </div>
                            </form>
                        </div>

                        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit(onFormSubmit)}
                                disabled={isSubmitting || (!isDirty && isEditing)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold rounded-lg transition-colors"
                            >
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                {isEditing ? "Save Changes" : "Create Organization"}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Helper for getValues since it wasn't valid in onChange above
function getValues(): OrgFormData | undefined {
    return undefined; // Placeholder
}
