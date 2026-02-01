"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Shield, Plus, Loader2 } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PermissionGroupsPositionsList } from "@/features/settings/roles/components/permission-groups-list";
import { AddRoleSheet } from "@/features/settings/roles/components/add-role-sheet";
import { StaffPositionFormSheet } from "@/features/settings/roles/components/staff-position-form-sheet";

interface StaffPosition {
    id: string;
    name: string;
    default_role_id: string | null;
    color?: string | null;
}

interface PermissionGroup {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    positions?: StaffPosition[];
}

export default function PermissionsPage() {
    const [groups, setGroups] = useState<PermissionGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Sheet States
    const [isGroupSheetOpen, setIsGroupSheetOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<PermissionGroup | null>(null);
    const [isPositionSheetOpen, setIsPositionSheetOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState<StaffPosition | null>(null);
    const [targetGroupId, setTargetGroupId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch roles and join with positions
            // Note: Assuming foreign key relationship exists from staff_positions.default_role_id -> roles.id
            const { data, error } = await supabase
                .from("roles")
                .select(`
                    *,
                    positions:staff_positions(*)
                `)
                .order("name");

            if (error) throw error;
            setGroups(data || []);
        } catch (err) {
            console.error("PermissionsPage: Error fetching permissions data:", JSON.stringify(err, null, 2));
            toast.error("Failed to load permission groups");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Role (Group) Handlers
    const handleAddGroup = () => {
        setEditingGroup(null);
        setIsGroupSheetOpen(true);
    };

    const handleEditGroup = (group: PermissionGroup) => {
        setEditingGroup(group);
        setIsGroupSheetOpen(true);
    };

    const handleDeleteGroup = async (id: string) => {
        try {
            const { error } = await supabase.from("roles").delete().eq("id", id);
            if (error) throw error;
            toast.success("Permission group deleted");
            fetchData();
        } catch (err) {
            console.error("Error deleting group:", err);
            toast.error("Failed to delete group");
        }
    };

    // Position Handlers
    const handleAddPosition = (groupId: string) => {
        setTargetGroupId(groupId);
        setEditingPosition(null);
        setIsPositionSheetOpen(true);
    };

    const handleEditPosition = (position: StaffPosition) => {
        setEditingPosition(position);
        setTargetGroupId(position.default_role_id);
        setIsPositionSheetOpen(true);
    };

    const handleDeletePosition = async (id: string) => {
        try {
            const { error } = await supabase.from("staff_positions").delete().eq("id", id);
            if (error) throw error;
            toast.success("Position deleted");
            fetchData();
        } catch (err) {
            console.error("Error deleting position:", err);
            toast.error("Failed to delete position");
        }
    };

    return (
        <PageShell
            title="Roles & Permissions"
            description="Manage access levels and staff positions."
            icon={Shield}
            action={
                <button
                    onClick={handleAddGroup}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    New Group
                </button>
            }
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col p-4 md:p-6"
        >
            <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                {isLoading ? (
                    <LoadingState message="Loading permissions..." />
                ) : (
                    <PermissionGroupsPositionsList
                        groups={groups}
                        onEditGroup={handleEditGroup}
                        onDeleteGroup={handleDeleteGroup}
                        onAddPosition={handleAddPosition}
                        onEditPosition={handleEditPosition}
                        onDeletePosition={handleDeletePosition}
                    />
                )}
            </div>

            <AddRoleSheet
                isOpen={isGroupSheetOpen}
                onClose={() => setIsGroupSheetOpen(false)}
                onSuccess={fetchData}
                initialData={editingGroup}
            />

            <StaffPositionFormSheet
                isOpen={isPositionSheetOpen}
                onClose={() => setIsPositionSheetOpen(false)}
                onSuccess={fetchData}
                groupId={targetGroupId}
                groupName={groups.find(g => g.id === targetGroupId)?.name}
                initialData={editingPosition}
            />
        </PageShell>
    );
}
