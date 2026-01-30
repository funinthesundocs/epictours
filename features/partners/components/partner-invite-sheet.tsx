"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { X, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Role {
    id: string;
    name: string;
    description: string | null;
}

interface PartnerInviteSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (email: string, roleId: string, type: 'partner' | 'affiliate') => Promise<boolean>;
    availableRoles: Role[];
}

interface InviteFormData {
    email: string;
    permission_group_id: string;
    relationship_type: 'partner' | 'affiliate';
}

export function PartnerInviteSheet({ isOpen, onClose, onInvite, availableRoles }: PartnerInviteSheetProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteFormData>({
        defaultValues: {
            relationship_type: 'partner'
        }
    });

    const onSubmit = async (data: InviteFormData) => {
        setIsSubmitting(true);
        try {
            const success = await onInvite(data.email, data.permission_group_id, data.relationship_type);
            if (success) {
                reset();
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
                        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col"
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-semibold text-foreground">Invite Partner</h2>
                            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                                <input
                                    {...register("email", { required: "Email is required" })}
                                    type="email"
                                    className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:border-ring focus:outline-none"
                                    placeholder="partner@example.com"
                                />
                                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Relationship Type</label>
                                <select
                                    {...register("relationship_type")}
                                    className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:border-ring focus:outline-none"
                                >
                                    <option value="partner">Partner</option>
                                    <option value="affiliate">Affiliate</option>
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    Partners typically have more access than Affiliates.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Permission Group (Role)</label>
                                <select
                                    {...register("permission_group_id", { required: "Role is required" })}
                                    className="w-full bg-input border border-border rounded-lg px-4 py-2 text-foreground focus:border-ring focus:outline-none"
                                >
                                    <option value="">Select a role...</option>
                                    {availableRoles.map(role => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                                {errors.permission_group_id && <p className="text-sm text-destructive">{errors.permission_group_id.message}</p>}
                            </div>
                        </form>

                        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
                            <button onClick={onClose} className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted">Cancel</button>
                            <button
                                onClick={handleSubmit(onSubmit)}
                                disabled={isSubmitting}
                                className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg flex items-center gap-2"
                            >
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                Send Invite
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
