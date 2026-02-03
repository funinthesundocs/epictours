"use client";

import { useState, useEffect } from "react";
import { SidePanel } from "@/components/ui/side-panel";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Shield, ChevronDown, ChevronRight, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { cn } from "@/lib/utils";
import { getRegisteredModules, type ModuleDefinition } from "@/features/modules/registry";
import type { ModuleCode } from "@/features/auth/types";
import { useAuth } from "@/features/auth/auth-context";

const positionSchema = z.object({
    name: z.string().min(1, "Position name is required").max(100, "Name too long"),
    default_role_id: z.string().min(1, "Permission group is required"),
});

type PositionFormData = z.infer<typeof positionSchema>;

interface Permission {
    module_code: ModuleCode;
    resource_type: string;
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
}

interface StaffPositionFormSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    groupId: string | null;
    groupName?: string;
    initialData?: {
        id: string;
        name: string;
        default_role_id: string | null;
        color?: string | null;
    } | null;
    onEditParentGroup?: (groupId: string) => void;
}

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Color options for position badges
const POSITION_COLORS = [
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Yellow", value: "#eab308" },
    { name: "Green", value: "#22c55e" },
    { name: "Emerald", value: "#10b981" },
    { name: "Teal", value: "#14b8a6" },
    { name: "Cyan", value: "#06b6d4" },
    { name: "Sky", value: "#0ea5e9" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Indigo", value: "#6366f1" },
    { name: "Violet", value: "#8b5cf6" },
    { name: "Purple", value: "#a855f7" },
    { name: "Fuchsia", value: "#d946ef" },
    { name: "Pink", value: "#ec4899" },
    { name: "Rose", value: "#f43f5e" },
];

interface PermissionGroupOption {
    value: string;
    label: string;
}

export function StaffPositionFormSheet({
    isOpen,
    onClose,
    onSuccess,
    groupId,
    groupName,
    initialData,
    onEditParentGroup
}: StaffPositionFormSheetProps) {
    const { effectiveOrganizationId } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [permissionGroups, setPermissionGroups] = useState<PermissionGroupOption[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [parentPermissions, setParentPermissions] = useState<Permission[]>([]);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [useCustomPermissions, setUseCustomPermissions] = useState(false);
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const isEditing = !!initialData;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors }
    } = useForm<PositionFormData>({
        resolver: zodResolver(positionSchema),
        defaultValues: {
            name: "",
            default_role_id: ""
        }
    });

    const selectedGroupId = watch("default_role_id");
    const selectedGroup = permissionGroups.find(g => g.value === selectedGroupId);

    // Build initial permissions structure from module registry
    const buildEmptyPermissions = (): Permission[] => {
        const perms: Permission[] = [];
        const modules = getRegisteredModules();
        modules.forEach((module: ModuleDefinition) => {
            module.resources.forEach((resource) => {
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

    // Fetch permission groups
    useEffect(() => {
        const fetchGroups = async () => {
            const { data } = await supabase
                .from("roles")
                .select("id, name")
                .order("name");
            if (data) {
                setPermissionGroups(data.map(r => ({ value: r.id, label: r.name })));
            }
        };
        if (isOpen) {
            fetchGroups();
        }
    }, [isOpen]);

    // Fetch parent group permissions when group changes
    useEffect(() => {
        const fetchParentPermissions = async () => {
            if (!selectedGroupId) {
                setParentPermissions([]);
                return;
            }

            const { data } = await supabase
                .from("role_permissions")
                .select("*")
                .eq("role_id", selectedGroupId);

            if (data) {
                const emptyPerms = buildEmptyPermissions();
                const merged = emptyPerms.map(perm => {
                    const found = data.find(
                        d => d.module_code === perm.module_code && d.resource_type === perm.resource_type
                    );
                    if (found) {
                        return {
                            ...perm,
                            can_create: found.can_create ?? false,
                            can_read: found.can_read ?? false,
                            can_update: found.can_update ?? false,
                            can_delete: found.can_delete ?? false,
                        };
                    }
                    return perm;
                });
                setParentPermissions(merged);

                // If not using custom, sync to parent
                if (!useCustomPermissions) {
                    setPermissions(merged);
                }
            }
        };
        fetchParentPermissions();
    }, [selectedGroupId, useCustomPermissions]);

    // Fetch position-specific permissions when editing
    useEffect(() => {
        const fetchPositionPermissions = async () => {
            if (!initialData?.id) return;

            // Use type assertion for untyped table
            const { data } = await (supabase as any)
                .from("position_permissions")
                .select("*")
                .eq("position_id", initialData.id);

            if (data && data.length > 0) {
                setUseCustomPermissions(true);
                const emptyPerms = buildEmptyPermissions();
                const merged = emptyPerms.map(perm => {
                    const found = data.find(
                        (d: { module_code: string; resource_type: string }) =>
                            d.module_code === perm.module_code && d.resource_type === perm.resource_type
                    );
                    if (found) {
                        return {
                            ...perm,
                            can_create: found.can_create ?? false,
                            can_read: found.can_read ?? false,
                            can_update: found.can_update ?? false,
                            can_delete: found.can_delete ?? false,
                        };
                    }
                    return perm;
                });
                setPermissions(merged);
            }
        };
        if (isOpen && initialData?.id) {
            fetchPositionPermissions();
        }
    }, [isOpen, initialData]);

    // Reset form when sheet opens/closes or initialData changes
    useEffect(() => {
        if (isOpen) {
            reset({
                name: initialData?.name || "",
                default_role_id: initialData?.default_role_id || groupId || ""
            });
            setSelectedColor(initialData?.color || null);
            if (!initialData) {
                setUseCustomPermissions(false);
                setPermissions(buildEmptyPermissions());
                setExpandedModules(new Set());
                setSelectedColor(null);
            }
        }
    }, [isOpen, initialData, groupId, reset]);

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

    const onSubmit = async (data: PositionFormData) => {
        setIsSubmitting(true);
        try {
            let positionId = initialData?.id;

            if (isEditing && initialData) {
                // Update existing position
                const { error } = await (supabase as any)
                    .from("staff_positions")
                    .update({
                        name: data.name,
                        default_role_id: data.default_role_id,
                        color: selectedColor
                    })
                    .eq("id", initialData.id);

                if (error) throw error;
            } else {
                // Create new position
                const { data: newPosition, error } = await (supabase as any)
                    .from("staff_positions")
                    .insert({
                        name: data.name,
                        default_role_id: data.default_role_id,
                        color: selectedColor,
                        organization_id: effectiveOrganizationId
                    })
                    .select()
                    .single();

                if (error) throw error;
                positionId = newPosition?.id;
            }

            // Save position-specific permissions if custom
            if (positionId && useCustomPermissions) {
                // Delete existing (use type assertion for untyped table)
                await (supabase as any)
                    .from("position_permissions")
                    .delete()
                    .eq("position_id", positionId);

                // Insert new permissions (only those with at least one enabled)
                const permsToInsert = permissions
                    .filter(p => p.can_create || p.can_read || p.can_update || p.can_delete)
                    .map(p => ({
                        position_id: positionId,
                        module_code: p.module_code,
                        resource_type: p.resource_type,
                        can_create: p.can_create,
                        can_read: p.can_read,
                        can_update: p.can_update,
                        can_delete: p.can_delete,
                    }));

                if (permsToInsert.length > 0) {
                    const { error: permError } = await (supabase as any)
                        .from("position_permissions")
                        .insert(permsToInsert);
                    if (permError) throw permError;
                }
            } else if (positionId && !useCustomPermissions) {
                // Clear any existing position permissions when switching back to inherited
                await (supabase as any)
                    .from("position_permissions")
                    .delete()
                    .eq("position_id", positionId);
            }

            toast.success(isEditing ? "Position updated" : "Position created");
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error saving position:", err);
            toast.error("Failed to save position");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SidePanel
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Edit Position" : "New Position"}
            description={isEditing
                ? `Editing ${initialData?.name}`
                : groupName
                    ? `Adding position to ${groupName}`
                    : "Create a new staff position"
            }
            width="max-w-2xl"
            contentClassName="p-0 overflow-hidden flex flex-col"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24">
                    <div className="space-y-6">
                        {/* Position Name */}
                        <div className="space-y-2">
                            <Label>Position Name</Label>
                            <Input
                                {...register("name")}
                                placeholder="e.g. Tour Guide, Driver, Office Manager"
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500">{errors.name.message}</p>
                            )}
                        </div>

                        {/* Position Color */}
                        <div className="space-y-2">
                            <Label>Position Color</Label>
                            <div className="flex flex-wrap gap-2">
                                <TooltipProvider>
                                    {POSITION_COLORS.map(color => (
                                        <Tooltip key={color.value}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedColor(color.value)}
                                                    className={cn(
                                                        "w-6 h-6 rounded-full border-2 transition-all",
                                                        selectedColor === color.value
                                                            ? "border-black dark:border-white scale-110 shadow-lg"
                                                            : "border-transparent hover:scale-105"
                                                    )}
                                                    style={{ backgroundColor: color.value }}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="capitalize">
                                                {color.name}
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedColor(null)}
                                                className={cn(
                                                    "w-6 h-6 rounded-full border-2 bg-muted transition-all flex items-center justify-center text-xs text-muted-foreground",
                                                    selectedColor === null
                                                        ? "border-black dark:border-white scale-110 shadow-lg"
                                                        : "border-transparent hover:scale-105"
                                                )}
                                            >
                                                ∅
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Default
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>

                        {/* Permission Group Selection */}
                        <div className="space-y-2">
                            <Label>Permission Group</Label>
                            <CustomSelect
                                options={permissionGroups}
                                value={selectedGroupId}
                                onChange={(val: string) => setValue("default_role_id", val, { shouldValidate: true })}
                                placeholder="Select permission group..."
                            />
                            {errors.default_role_id && (
                                <p className="text-xs text-red-500">{errors.default_role_id.message}</p>
                            )}
                        </div>

                        {/* Custom Permissions Toggle */}
                        <div className="bg-muted/50 border border-border rounded-lg p-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={useCustomPermissions}
                                    onChange={(e) => {
                                        setUseCustomPermissions(e.target.checked);
                                        if (!e.target.checked) {
                                            setPermissions(parentPermissions);
                                        }
                                    }}
                                    className="w-5 h-5 rounded border-muted-foreground/30 bg-card text-primary focus:ring-primary"
                                />
                                <div>
                                    <span className="text-foreground font-medium">Use custom permissions</span>
                                    <p className="text-xs text-muted-foreground">
                                        Override the inherited permissions from {selectedGroup?.label || "the group"}
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Permissions Matrix */}
                        {useCustomPermissions && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Shield size={18} className="text-primary" />
                                    <Label className="text-lg">Custom Permissions</Label>
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
                                                        : "bg-muted/50 hover:bg-muted"
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
                                                        className="px-2 py-1 text-xs bg-muted/50 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                                                    >
                                                        All
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); toggleAllForModule(module.code, false); }}
                                                        className="px-2 py-1 text-xs bg-muted/50 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
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
                                                                        {(['can_create', 'can_read', 'can_update', 'can_delete'] as const).map(action => (
                                                                            <td key={action} className="text-center p-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => togglePermission(module.code, resource.code, action)}
                                                                                    className={cn(
                                                                                        "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
                                                                                        perm?.[action]
                                                                                            ? "bg-primary border-primary"
                                                                                            : "border-muted-foreground/30 hover:border-muted-foreground"
                                                                                    )}
                                                                                >
                                                                                    {perm?.[action] && (
                                                                                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                                                                        ? "bg-cyan-500 border-cyan-500"
                                                                                        : "border-zinc-600 hover:border-zinc-400"
                                                                                )}
                                                                            >
                                                                                {allEnabled && (
                                                                                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        )}

                        {/* Info when not using custom */}
                        {!useCustomPermissions && selectedGroup && (
                            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <Info size={18} className="text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-foreground">
                                            Inheriting permissions from <span className="text-primary font-medium">{selectedGroup.label}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Enable "Use custom permissions" above to override.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit Button - Fixed Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
                        {isEditing ? "Save Changes" : "Create Position"}
                    </Button>
                </div>
            </form>
        </SidePanel>
    );
}
