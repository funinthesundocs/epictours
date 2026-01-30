"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SidePanel } from "@/components/ui/side-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";
import { getRegisteredModules, type ModuleDefinition, type ResourceDefinition } from "@/features/modules/registry";
import type { ModuleCode } from "@/features/auth/types";

// Zod Schema
const RoleSchema = z.object({
    name: z.string().min(2, "Group name is required"),
    description: z.string().optional().nullable(),
});

type RoleFormData = z.infer<typeof RoleSchema>;

interface Permission {
    module_code: ModuleCode;
    resource_type: string;
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
}

interface AddRoleSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export function AddRoleSheet({ isOpen, onClose, onSuccess, initialData }: AddRoleSheetProps) {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty }
    } = useForm<RoleFormData>({
        resolver: zodResolver(RoleSchema),
        defaultValues: {
            name: "",
            description: "",
        }
    });

    // Build initial permissions structure from module registry
    const buildEmptyPermissions = (): Permission[] => {
        const perms: Permission[] = [];
        const modules = getRegisteredModules();
        modules.forEach((module: ModuleDefinition) => {
            module.resources.forEach((resource: ResourceDefinition) => {
                perms.push({
                    module_code: module.code,
                    resource_type: resource.code,
                    can_create: false,
                    can_read: false,
                    can_update: false,
                    can_delete: false,
                });
            });
        });
        return perms;
    };

    // Reset when opening/changing mode
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                // Edit Mode - load existing permissions
                reset({
                    name: initialData.name,
                    description: initialData.description || "",
                });

                // Load permissions from initialData
                if (initialData.role_permissions && initialData.role_permissions.length > 0) {
                    const existingPerms = buildEmptyPermissions();
                    initialData.role_permissions.forEach((rp: any) => {
                        const idx = existingPerms.findIndex(
                            p => p.module_code === rp.module_code && p.resource_type === rp.resource_type
                        );
                        if (idx >= 0) {
                            existingPerms[idx] = {
                                ...existingPerms[idx],
                                can_create: rp.can_create,
                                can_read: rp.can_read,
                                can_update: rp.can_update,
                                can_delete: rp.can_delete,
                            };
                        }
                    });
                    setPermissions(existingPerms);
                } else {
                    setPermissions(buildEmptyPermissions());
                }
            } else {
                // New Mode
                reset({
                    name: "",
                    description: "",
                });
                setPermissions(buildEmptyPermissions());
            }
            setExpandedModules(new Set());
        }
    }, [isOpen, initialData, reset]);

    const toggleModule = (moduleCode: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(moduleCode)) {
                next.delete(moduleCode);
            } else {
                next.add(moduleCode);
            }
            return next;
        });
    };

    const togglePermission = (moduleCode: string, resourceType: string, action: 'can_create' | 'can_read' | 'can_update' | 'can_delete') => {
        setPermissions(prev => prev.map(p => {
            if (p.module_code === moduleCode && p.resource_type === resourceType) {
                return { ...p, [action]: !p[action] };
            }
            return p;
        }));
    };

    const toggleAllForResource = (moduleCode: string, resourceType: string, enable: boolean) => {
        setPermissions(prev => prev.map(p => {
            if (p.module_code === moduleCode && p.resource_type === resourceType) {
                return { ...p, can_create: enable, can_read: enable, can_update: enable, can_delete: enable };
            }
            return p;
        }));
    };

    const toggleAllForModule = (moduleCode: string, enable: boolean) => {
        setPermissions(prev => prev.map(p => {
            if (p.module_code === moduleCode) {
                return { ...p, can_create: enable, can_read: enable, can_update: enable, can_delete: enable };
            }
            return p;
        }));
    };

    const getModulePermissions = (moduleCode: string) => {
        return permissions.filter(p => p.module_code === moduleCode);
    };

    const hasAnyPermission = (moduleCode: string) => {
        return permissions.some(p =>
            p.module_code === moduleCode &&
            (p.can_create || p.can_read || p.can_update || p.can_delete)
        );
    };

    const onSubmit = async (data: RoleFormData) => {
        // Only require tenant context for creating new groups
        if (!initialData?.id && !user?.tenantId) {
            alert("No tenant context");
            return;
        }

        setIsSubmitting(true);
        try {
            let roleId = initialData?.id;

            if (initialData?.id) {
                // Update role
                const { error } = await supabase
                    .from("roles")
                    .update({
                        name: data.name,
                        description: data.description || null,
                    })
                    .eq("id", initialData.id);
                if (error) throw error;
            } else {
                // Create role - tenantId is guaranteed to exist from check above
                const { data: newRole, error } = await supabase
                    .from("roles")
                    .insert([{
                        tenant_id: user!.tenantId!,
                        name: data.name,
                        description: data.description || null,
                    }])
                    .select()
                    .single();
                if (error) throw error;
                roleId = newRole?.id;
            }

            // Update permissions
            if (roleId) {
                // Delete existing permissions
                await supabase
                    .from("role_permissions")
                    .delete()
                    .eq("role_id", roleId);

                // Insert new permissions (only those with at least one enabled)
                const permsToInsert = permissions
                    .filter(p => p.can_create || p.can_read || p.can_update || p.can_delete)
                    .map(p => ({
                        role_id: roleId,
                        module_code: p.module_code,
                        resource_type: p.resource_type,
                        can_create: p.can_create,
                        can_read: p.can_read,
                        can_update: p.can_update,
                        can_delete: p.can_delete,
                    }));

                if (permsToInsert.length > 0) {
                    const { error: permError } = await supabase
                        .from("role_permissions")
                        .insert(permsToInsert);
                    if (permError) throw permError;
                }
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error saving permission group:", err);
            alert("Failed to save permission group.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasChanges = isDirty;

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? "Edit Permission Group" : "Create Permission Group"}
            description="Define permissions for team members in this group."
            width="max-w-2xl"
            contentClassName="p-0 overflow-hidden flex flex-col"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24">
                    <div className="space-y-8">
                        {/* Basic Info */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Group Name</Label>
                                <Input
                                    {...register("name")}
                                    className="text-lg font-semibold"
                                    placeholder="e.g. Staff Member, Manager"
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    {...register("description")}
                                    placeholder="Describe this group's access level..."
                                    className="min-h-[80px] bg-muted/50 border-border focus:border-primary/50"
                                />
                            </div>
                        </div>

                        {/* Permissions Matrix */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-lg">Permissions</Label>
                                <span className="text-xs text-muted-foreground">
                                    Click module headers to expand
                                </span>
                            </div>

                            <div className="space-y-2">
                                {getRegisteredModules().map((module: ModuleDefinition) => (
                                    <div
                                        key={module.code}
                                        className="border border-border rounded-lg overflow-hidden"
                                    >
                                        {/* Module Header */}
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => toggleModule(module.code)}
                                            onKeyDown={(e) => e.key === 'Enter' && toggleModule(module.code)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-3 transition-colors cursor-pointer",
                                                hasAnyPermission(module.code)
                                                    ? "bg-primary/10"
                                                    : "bg-muted hover:bg-muted/80"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                {expandedModules.has(module.code)
                                                    ? <ChevronDown size={16} className="text-muted-foreground" />
                                                    : <ChevronRight size={16} className="text-muted-foreground" />
                                                }
                                                <span className="font-medium text-foreground">{module.name}</span>
                                                {hasAnyPermission(module.code) && (
                                                    <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); toggleAllForModule(module.code, true); }}
                                                    className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    All
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); toggleAllForModule(module.code, false); }}
                                                    className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    None
                                                </button>
                                            </div>
                                        </div>

                                        {/* Resources */}
                                        {expandedModules.has(module.code) && (
                                            <div className="border-t border-border">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="text-xs text-muted-foreground uppercase">
                                                            <th className="text-left p-3">Resource</th>
                                                            <th className="text-center p-2 w-16">Create</th>
                                                            <th className="text-center p-2 w-16">Read</th>
                                                            <th className="text-center p-2 w-16">Update</th>
                                                            <th className="text-center p-2 w-16">Delete</th>
                                                            <th className="text-center p-2 w-16">All</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {module.resources.map(resource => {
                                                            const perm = getModulePermissions(module.code)
                                                                .find(p => p.resource_type === resource.code);
                                                            const allEnabled = perm && perm.can_create && perm.can_read && perm.can_update && perm.can_delete;

                                                            return (
                                                                <tr key={resource.code} className="border-t border-border hover:bg-muted/50">
                                                                    <td className="p-3 text-sm text-foreground">{resource.name}</td>
                                                                    {['can_create', 'can_read', 'can_update', 'can_delete'].map(action => (
                                                                        <td key={action} className="text-center p-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => togglePermission(module.code, resource.code, action as any)}
                                                                                className={cn(
                                                                                    "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
                                                                                    perm?.[action as keyof Permission]
                                                                                        ? "bg-primary border-primary"
                                                                                        : "border-input hover:border-accent-foreground"
                                                                                )}
                                                                            >
                                                                                {perm?.[action as keyof Permission] && (
                                                                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                                    </svg>
                                                                                )}
                                                                            </button>
                                                                        </td>
                                                                    ))}
                                                                    <td className="text-center p-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleAllForResource(module.code, resource.code, !allEnabled)}
                                                                            className={cn(
                                                                                "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
                                                                                allEnabled
                                                                                    ? "bg-primary border-primary"
                                                                                    : "border-input hover:border-accent-foreground"
                                                                            )}
                                                                        >
                                                                            {allEnabled && (
                                                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                            )}
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end items-center gap-4 py-4 px-6 border-t border-border mt-auto bg-background">
                    <Button
                        type="submit"
                        disabled={isSubmitting || !hasChanges}
                        className={cn(
                            "px-6 py-2 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors",
                            isSubmitting ? "bg-primary/50 text-white cursor-not-allowed" :
                                hasChanges ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" :
                                    "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                        )}
                    >
                        {isSubmitting ? <><Loader2 className="animate-spin" size={16} /> Saving...</> :
                            hasChanges ? <><Save size={16} /> {initialData ? "Update" : "Create"}</> :
                                "No Changes"}
                    </Button>
                </div>
            </form>
        </SidePanel>
    );
}
