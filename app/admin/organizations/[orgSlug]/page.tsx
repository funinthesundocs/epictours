"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { PageShell } from "@/components/shell/page-shell";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LoadingState } from "@/components/ui/loading-state";
import { useOrganizations } from "@/features/admin/hooks/use-organizations";
import { useAuth } from "@/features/auth/auth-context";
import { useOrgMembers, OrgMember } from "@/features/admin/hooks/use-org-members";
import { useSubscriptions } from "@/features/admin/hooks/use-subscriptions";
import { getRegisteredModules } from "@/features/modules/registry";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
    Building2,
    Users,
    Layers,
    Crown,
    MoreVertical,
    Trash2,
    Check,
    X,
    ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Organization } from "@/features/auth/types";

type TabId = "overview" | "users" | "modules";

export default function OrganizationDetailPage() {
    return (
        <ProtectedRoute>
            <OrganizationDetailContent />
        </ProtectedRoute>
    );
}

function OrganizationDetailContent() {
    const params = useParams();
    const orgSlug = params?.orgSlug as string;

    const { organizations, isLoading: orgsLoading } = useOrganizations();
    const { setAdminOrgContext } = useAuth();

    // Find organization by slug first
    const organization = useMemo(() => {
        return organizations.find((o) => o.slug === orgSlug) || null;
    }, [organizations, orgSlug]);

    // Auto-set admin org context when viewing this org
    useEffect(() => {
        if (organization?.id) {
            setAdminOrgContext(organization.id);
        }
    }, [organization?.id, setAdminOrgContext]);

    // Use orgId for hooks that need the ID
    const orgId = organization?.id || "";

    const { members, isLoading: membersLoading, toggleOwnerStatus, removeMember } = useOrgMembers(orgId);
    const {
        subscriptions,
        isLoading: subsLoading,
        fetchSubscriptions,
        setModuleSubscription,
        isModuleActive,
    } = useSubscriptions(orgId);

    const [activeTab, setActiveTab] = useState<TabId>("overview");
    const [removingMember, setRemovingMember] = useState<OrgMember | null>(null);

    // Fetch subscriptions when org loaded
    useEffect(() => {
        if (orgId) {
            fetchSubscriptions();
        }
    }, [orgId, fetchSubscriptions]);

    // Get all registered modules
    const availableModules = getRegisteredModules();

    const isLoading = orgsLoading || membersLoading;

    const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
        { id: "overview", label: "Overview", icon: Building2 },
        { id: "users", label: "Users", icon: Users },
        { id: "modules", label: "Modules", icon: Layers },
    ];

    const handleRemoveMember = async () => {
        if (removingMember) {
            await removeMember(removingMember.id);
            setRemovingMember(null);
        }
    };

    const handleModuleToggle = async (moduleCode: string, currentlyActive: boolean) => {
        // Toggle Module
        await setModuleSubscription(moduleCode as any, !currentlyActive);

        // Seeding Logic: If enabling "bookings" module, seed default positions
        if (moduleCode === 'bookings' && !currentlyActive) { // If TURNING ON
            try {
                // 1. Ensure "Staff" group exists (or similar default group)
                let { data: staffGroup } = await supabase
                    .from("roles")
                    .select("id")
                    .eq("organization_id", orgId)
                    .ilike("name", "Staff")
                    .maybeSingle();

                if (!staffGroup) {
                    const { data: newGroup } = await supabase
                        .from("roles")
                        .insert({
                            organization_id: orgId,
                            name: "Staff",
                            description: "General staff members"
                        })
                        .select()
                        .single();
                    staffGroup = newGroup;
                }

                if (staffGroup) {
                    // 2. Seed "Driver" position if missing
                    const { count: driverCount } = await supabase
                        .from("staff_positions")
                        .select("*", { count: 'exact', head: true })
                        .eq("organization_id", orgId)
                        .eq("name", "Driver");

                    if (driverCount === 0) {
                        await supabase
                            .from("staff_positions")
                            .insert({
                                organization_id: orgId,
                                name: "Driver",
                                default_role_id: staffGroup.id,
                                color: "#0ea5e9" // Sky Blue
                            });
                    }

                    // 3. Seed "Guide" position if missing
                    const { count: guideCount } = await supabase
                        .from("staff_positions")
                        .select("*", { count: 'exact', head: true })
                        .eq("organization_id", orgId)
                        .eq("name", "Guide");

                    if (guideCount === 0) {
                        await supabase
                            .from("staff_positions")
                            .insert({
                                organization_id: orgId,
                                name: "Guide",
                                default_role_id: staffGroup.id,
                                color: "#10b981" // Emerald
                            });
                    }
                }
            } catch (err) {
                console.error("Error seeding positions:", err);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <LoadingState message="Loading organization..." />
            </div>
        );
    }

    if (!organization) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">Organization not found</p>
                <Link
                    href="/admin/organizations"
                    className="text-primary hover:underline"
                >
                    ← Back to Organizations
                </Link>
            </div>
        );
    }

    return (
        <PageShell
            title={organization.name}
            description={`Manage organization settings, users, and module access`}
            icon={Building2}
            action={
                <Link
                    href="/admin/organizations"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronLeft size={16} />
                    Back to Organizations
                </Link>
            }
            className="flex flex-col"
            style={{ height: "calc(100vh / var(--zoom-factor, 1) - 4rem)" }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            {/* Tabs */}
            <div className="flex gap-1 border-b border-border mb-4 shrink-0">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                                activeTab === tab.id
                                    ? "text-primary border-primary"
                                    : "text-muted-foreground border-transparent hover:text-foreground"
                            )}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-auto">
                {activeTab === "overview" && (
                    <OverviewTab organization={organization} memberCount={members.length} />
                )}
                {activeTab === "users" && (
                    <UsersTab
                        members={members}
                        onToggleOwner={toggleOwnerStatus}
                        onRemoveMember={(m) => setRemovingMember(m)}
                    />
                )}
                {activeTab === "modules" && (
                    <ModulesTab
                        availableModules={availableModules}
                        isModuleActive={isModuleActive}
                        isLoading={subsLoading}
                        onToggle={handleModuleToggle}
                    />
                )}
            </div>

            {/* Remove Member Dialog */}
            <AlertDialog
                isOpen={!!removingMember}
                onClose={() => setRemovingMember(null)}
                onConfirm={handleRemoveMember}
                title="Remove Member?"
                description={`Are you sure you want to remove "${removingMember?.name}" from this organization?`}
                confirmLabel="Remove"
                isDestructive
            />
        </PageShell>
    );
}

// ============================================
// Overview Tab
// ============================================
function OverviewTab({
    organization,
    memberCount,
}: {
    organization: Organization;
    memberCount: number;
}) {
    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Organization ID
                    </p>
                    <p className="font-mono text-sm text-foreground truncate">{organization.id}</p>
                </div>
                <div className="glass-card p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Slug
                    </p>
                    <p className="font-mono text-sm text-foreground">{organization.slug}</p>
                </div>
                <div className="glass-card p-4 rounded-xl">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Status
                    </p>
                    <span
                        className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                            organization.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-yellow-500/10 text-yellow-400"
                        )}
                    >
                        {organization.status}
                    </span>
                </div>
            </div>

            {/* Member Count */}
            <div className="glass-card p-6 rounded-xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="text-primary" size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">{memberCount}</p>
                        <p className="text-sm text-muted-foreground">Total Members</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Users Tab
// ============================================
function UsersTab({
    members,
    onToggleOwner,
    onRemoveMember,
}: {
    members: OrgMember[];
    onToggleOwner: (memberId: string, makeOwner: boolean) => Promise<boolean>;
    onRemoveMember: (member: OrgMember) => void;
}) {
    if (members.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="text-muted-foreground mb-4" size={48} />
                <p className="text-muted-foreground">No members in this organization</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
                <thead className="bg-muted/80 backdrop-blur-sm text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border">
                    <tr>
                        <th className="text-left py-3 px-4">User</th>
                        <th className="text-left py-3 px-4">Position</th>
                        <th className="text-center py-3 px-4">Owner</th>
                        <th className="text-center py-3 px-4">Status</th>
                        <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {members.map((member) => (
                        <tr
                            key={member.id}
                            className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                            <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-medium text-foreground flex items-center gap-2">
                                            {member.name}
                                            {member.isOwner && (
                                                <Crown size={14} className="text-yellow-500" />
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {member.email}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                                {member.positionName || "—"}
                            </td>
                            <td className="py-3 px-4 text-center">
                                <button
                                    onClick={() => onToggleOwner(member.id, !member.isOwner)}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-colors",
                                        member.isOwner
                                            ? "text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20"
                                            : "text-muted-foreground hover:bg-muted"
                                    )}
                                    title={member.isOwner ? "Remove Owner" : "Make Owner"}
                                >
                                    <Crown size={16} />
                                </button>
                            </td>
                            <td className="py-3 px-4 text-center">
                                <span
                                    className={cn(
                                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                                        member.status === "active"
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : "bg-zinc-500/10 text-zinc-400"
                                    )}
                                >
                                    {member.status}
                                </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                                <button
                                    onClick={() => onRemoveMember(member)}
                                    className="p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                    title="Remove from Organization"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ============================================
// Modules Tab
// ============================================
function ModulesTab({
    availableModules,
    isModuleActive,
    isLoading,
    onToggle,
}: {
    availableModules: { code: string; name: string; description?: string }[];
    isModuleActive: (code: any) => boolean;
    isLoading: boolean;
    onToggle: (code: string, currentlyActive: boolean) => void;
}) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingState message="Loading modules..." />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {availableModules.map((mod) => {
                const isActive = isModuleActive(mod.code as any);
                return (
                    <div
                        key={mod.code}
                        className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-colors",
                            isActive
                                ? "bg-primary/5 border-primary/20"
                                : "bg-muted/50 border-border"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center",
                                    isActive ? "bg-primary/10" : "bg-muted"
                                )}
                            >
                                <Layers
                                    size={20}
                                    className={isActive ? "text-primary" : "text-muted-foreground"}
                                />
                            </div>
                            <div>
                                <p className="font-medium text-foreground">{mod.name}</p>
                                {mod.description && (
                                    <p className="text-sm text-muted-foreground">
                                        {mod.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => onToggle(mod.code, isActive)}
                            className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            {isActive ? <Check size={18} /> : <X size={18} />}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
