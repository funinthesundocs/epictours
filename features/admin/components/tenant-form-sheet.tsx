"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Save, Calendar, Check, Clock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Tenant, CreateTenantData, UpdateTenantData } from "@/features/admin/hooks/use-tenants";
import { useSubscriptions } from "@/features/admin/hooks/use-subscriptions";
import { cn } from "@/lib/utils";
import type { ModuleCode } from "@/features/auth/types";

const tenantSchema = z.object({
    name: z.string().min(2, "Name is required"),
    slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
    is_active: z.boolean(),
});

type TenantFormData = z.infer<typeof tenantSchema>;

interface TenantFormSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTenantData | UpdateTenantData, tenantId?: string) => Promise<boolean>;
    initialData?: Tenant | null;
}

export function TenantFormSheet({ isOpen, onClose, onSubmit, initialData }: TenantFormSheetProps) {
    const isEditing = !!initialData;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'subscriptions'>('details');

    const { subscriptions, availableModules, fetchSubscriptions, setModuleSubscription, isModuleActive, getExpiryDate } =
        useSubscriptions(initialData?.id || null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty }
    } = useForm<TenantFormData>({
        resolver: zodResolver(tenantSchema),
        defaultValues: {
            name: "",
            slug: "",
            is_active: true,
        }
    });

    // Reset form and load subscriptions when sheet opens
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    name: initialData.name,
                    slug: initialData.slug,
                    is_active: initialData.is_active,
                });
                fetchSubscriptions();
            } else {
                reset({
                    name: "",
                    slug: "",
                    is_active: true,
                });
            }
            setActiveTab('details');
        }
    }, [isOpen, initialData, reset, fetchSubscriptions]);

    // Auto-generate slug from name
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        if (!isEditing) {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            reset({ name, slug, is_active: true });
        }
    };

    const onFormSubmit = async (data: TenantFormData) => {
        setIsSubmitting(true);
        try {
            const success = await onSubmit(
                {
                    name: data.name,
                    slug: data.slug,
                    is_active: data.is_active,
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

    const handleToggleModule = async (moduleCode: ModuleCode) => {
        const currentlyActive = isModuleActive(moduleCode);
        await setModuleSubscription(moduleCode, !currentlyActive);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Never";
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
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
                        className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-zinc-950 border-l border-white/10 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <h2 className="text-lg font-semibold text-white">
                                {isEditing ? "Edit Organization" : "Create Organization"}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs (only for editing) */}
                        {isEditing && (
                            <div className="flex border-b border-white/10">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={cn(
                                        "flex-1 py-3 text-sm font-medium transition-colors",
                                        activeTab === 'details'
                                            ? "text-cyan-400 border-b-2 border-cyan-400"
                                            : "text-zinc-400 hover:text-white"
                                    )}
                                >
                                    Details
                                </button>
                                <button
                                    onClick={() => setActiveTab('subscriptions')}
                                    className={cn(
                                        "flex-1 py-3 text-sm font-medium transition-colors",
                                        activeTab === 'subscriptions'
                                            ? "text-cyan-400 border-b-2 border-cyan-400"
                                            : "text-zinc-400 hover:text-white"
                                    )}
                                >
                                    Subscriptions
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'details' ? (
                                <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
                                    {/* Name */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400">Organization Name</label>
                                        <input
                                            {...register("name")}
                                            onChange={handleNameChange}
                                            className="w-full bg-[#0b1115] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                                            placeholder="Acme Tours Inc."
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-400">{errors.name.message}</p>
                                        )}
                                    </div>

                                    {/* Slug */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-400">URL Slug</label>
                                        <input
                                            {...register("slug")}
                                            className={cn(
                                                "w-full bg-[#0b1115] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-cyan-500/50 focus:outline-none transition-colors font-mono",
                                                isEditing && "opacity-50"
                                            )}
                                            placeholder="acme-tours"
                                            disabled={isEditing}
                                        />
                                        {errors.slug && (
                                            <p className="text-sm text-red-400">{errors.slug.message}</p>
                                        )}
                                        <p className="text-xs text-zinc-500">Used for unique tenant identification</p>
                                    </div>

                                    {/* Active Toggle */}
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                                        <div>
                                            <p className="font-medium text-white">Active Status</p>
                                            <p className="text-sm text-zinc-400">Inactive tenants cannot access the system</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                {...register("is_active")}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                                        </label>
                                    </div>

                                    {/* Stats (editing only) */}
                                    {isEditing && initialData && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                                <p className="text-2xl font-bold text-white">{initialData.user_count || 0}</p>
                                                <p className="text-sm text-zinc-400">Users</p>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                                <p className="text-2xl font-bold text-white">{subscriptions.filter(s => s.is_active).length}</p>
                                                <p className="text-sm text-zinc-400">Active Modules</p>
                                            </div>
                                        </div>
                                    )}
                                </form>
                            ) : (
                                <div className="p-6 space-y-4">
                                    <p className="text-sm text-zinc-400">
                                        Toggle modules to enable or disable them for this organization.
                                    </p>

                                    <div className="space-y-2">
                                        {availableModules.map(module => {
                                            const active = isModuleActive(module.code);
                                            const expiry = getExpiryDate(module.code);

                                            return (
                                                <div
                                                    key={module.code}
                                                    className={cn(
                                                        "flex items-center justify-between p-4 rounded-lg border transition-colors",
                                                        active
                                                            ? "bg-cyan-500/10 border-cyan-500/30"
                                                            : "bg-white/5 border-white/10"
                                                    )}
                                                >
                                                    <div>
                                                        <p className="font-medium text-white">{module.name}</p>
                                                        {module.description && (
                                                            <p className="text-sm text-zinc-400">{module.description}</p>
                                                        )}
                                                        {expiry && (
                                                            <div className="flex items-center gap-1 mt-1 text-xs text-amber-400">
                                                                <Clock size={12} />
                                                                Expires: {formatDate(expiry)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleToggleModule(module.code)}
                                                        className={cn(
                                                            "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                                            active
                                                                ? "bg-cyan-500 text-white"
                                                                : "bg-white/10 text-zinc-400 hover:bg-white/20"
                                                        )}
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {activeTab === 'details' && (
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
                                    {isEditing ? "Save Changes" : "Create Organization"}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
