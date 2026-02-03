"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/auth-context";
import { Building2, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Organization } from "@/features/auth/types";

interface OrgContextPickerProps {
    isCollapsed?: boolean;
}

/**
 * Organization context picker for Platform Admins.
 * Allows admins to select which organization's navigation/modules to view.
 */
export function OrgContextPicker({ isCollapsed = false }: OrgContextPickerProps) {
    const router = useRouter();
    const { user, adminSelectedOrg, setAdminOrgContext, isPlatformAdmin } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Only render for platform admins
    if (!isPlatformAdmin()) {
        return null;
    }

    // Fetch organizations when dropdown opens
    const handleOpen = async () => {
        if (!isOpen && organizations.length === 0) {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('status', 'active')
                    .order('name');

                if (!error && data) {
                    setOrganizations(data as Organization[]);
                }
            } catch (err) {
                console.error('Failed to fetch organizations:', err);
            } finally {
                setIsLoading(false);
            }
        }
        setIsOpen(!isOpen);
    };

    const handleSelect = async (org: Organization | null) => {
        await setAdminOrgContext(org?.id ?? null);
        setIsOpen(false);

        // Navigate after selection - use path-based org routes
        if (org) {
            // Org selected -> go to org overview page
            router.push(`/org/${org.slug}`);
        } else {
            // Cleared selection -> go to Organizations list
            router.push("/admin/organizations");
        }
    };

    // Collapsed mode - just show icon
    if (isCollapsed) {
        return (
            <div className="px-2 py-2">
                <button
                    onClick={handleOpen}
                    className={cn(
                        "w-full p-2 rounded-lg flex items-center justify-center transition-colors",
                        adminSelectedOrg
                            ? "bg-primary/10 text-primary"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                    title={adminSelectedOrg?.name || "Select Organization"}
                >
                    <Building2 size={18} />
                </button>
            </div>
        );
    }

    return (
        <div className="px-3 py-2">
            {/* Trigger Button */}
            <button
                onClick={handleOpen}
                className={cn(
                    "w-full px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm",
                    adminSelectedOrg
                        ? "bg-primary/10 border border-primary/20 text-foreground"
                        : "bg-muted/50 border border-border text-muted-foreground hover:bg-muted"
                )}
            >
                <Building2 size={16} className="shrink-0" />
                <span className="flex-1 text-left truncate">
                    {adminSelectedOrg?.name || "Select Organization"}
                </span>
                <ChevronDown
                    size={14}
                    className={cn(
                        "shrink-0 transition-transform",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="mt-2 rounded-lg border border-border bg-card shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                    {/* Clear Selection Option */}
                    {adminSelectedOrg && (
                        <button
                            onClick={() => handleSelect(null)}
                            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted/50 text-muted-foreground border-b border-border"
                        >
                            <X size={14} />
                            Clear Selection
                        </button>
                    )}

                    {/* Loading */}
                    {isLoading && (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                            Loading...
                        </div>
                    )}

                    {/* Organization List */}
                    {!isLoading && organizations.map((org) => (
                        <button
                            key={org.id}
                            onClick={() => handleSelect(org)}
                            className={cn(
                                "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors",
                                adminSelectedOrg?.id === org.id && "bg-primary/5 text-primary"
                            )}
                        >
                            <Building2 size={14} className="shrink-0" />
                            <span className="flex-1 truncate">{org.name}</span>
                            {adminSelectedOrg?.id === org.id && (
                                <Check size={14} className="text-primary shrink-0" />
                            )}
                        </button>
                    ))}

                    {/* Empty State */}
                    {!isLoading && organizations.length === 0 && (
                        <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                            No organizations found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
