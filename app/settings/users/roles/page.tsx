"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Shield, Plus, Loader2, Search } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
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
    role_permissions?: any[];
    positions?: StaffPosition[];
}

export default function PermissionGroupsPage() {
    const [groups, setGroups] = useState<PermissionGroup[]>([]);
    const [filteredGroups, setFilteredGroups] = useState<PermissionGroup[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Group Sheet
    const [isGroupSheetOpen, setIsGroupSheetOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<PermissionGroup | null>(null);

    // Position Sheet
    const [isPositionSheetOpen, setIsPositionSheetOpen] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [selectedGroupName, setSelectedGroupName] = useState<string>("");
    const [editingPosition, setEditingPosition] = useState<StaffPosition | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch permission groups (roles)
            const { data: rolesData, error: rolesError } = await supabase
                .from("roles")
                .select("*, role_permissions(*)")
                .order("name");

            if (rolesError) throw rolesError;

            // Fetch staff positions (default_role_id and color may not exist before migration)
            const { data: positionsData, error: positionsError } = await supabase
                .from("staff_positions")
                .select("id, name, default_role_id, color")
                .order("name");

            // Note: If default_role_id column doesn't exist yet, this will return an error
            // which is fine - positions will show without grouping until migration runs

            // Group positions by their default_role_id
            const positionsByRole: Record<string, StaffPosition[]> = {};
            if (!positionsError && positionsData) {
                // Type assertion since default_role_id may not exist pre-migration
                const positions = positionsData as unknown as Array<{
                    id: string;
                    name: string;
                    default_role_id: string | null;
                    color?: string | null;
                }>;

                positions.forEach(pos => {
                    const roleId = pos.default_role_id;
                    if (roleId) {
                        if (!positionsByRole[roleId]) {
                            positionsByRole[roleId] = [];
                        }
                        positionsByRole[roleId].push({
                            id: pos.id,
                            name: pos.name,
                            default_role_id: pos.default_role_id,
                            color: pos.color
                        });
                    }
                });
            }

            // Merge positions into groups
            const groupsWithPositions = (rolesData || []).map(role => ({
                ...role,
                positions: positionsByRole[role.id] || []
            }));

            setGroups(groupsWithPositions);
            setFilteredGroups(groupsWithPositions);
        } catch (err) {
            console.error("Error loading data:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Client-side search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredGroups(groups);
            return;
        }
        const lowerQ = searchQuery.toLowerCase();
        const filtered = groups.filter(g =>
            g.name.toLowerCase().includes(lowerQ) ||
            (g.description && g.description.toLowerCase().includes(lowerQ)) ||
            g.positions?.some(p => p.name.toLowerCase().includes(lowerQ))
        );
        setFilteredGroups(filtered);
    }, [searchQuery, groups]);

    // Group Handlers
    const handleDeleteGroup = async (id: string) => {
        try {
            const { error } = await supabase
                .from("roles")
                .delete()
                .eq("id", id);

            if (error) throw error;
            toast.success("Permission group deleted");
            fetchData();
        } catch (err) {
            console.error("Error deleting group:", err);
            toast.error("Failed to delete permission group");
        }
    };

    const handleEditGroup = (group: PermissionGroup) => {
        setEditingGroup(group);
        setIsGroupSheetOpen(true);
    };

    const handleAddNewGroup = () => {
        setEditingGroup(null);
        setIsGroupSheetOpen(true);
    };

    // Position Handlers
    const handleAddPosition = (groupId: string) => {
        const group = groups.find(g => g.id === groupId);
        setSelectedGroupId(groupId);
        setSelectedGroupName(group?.name || "");
        setEditingPosition(null);
        setIsPositionSheetOpen(true);
    };

    const handleEditPosition = (position: StaffPosition) => {
        const group = groups.find(g => g.id === position.default_role_id);
        setSelectedGroupId(position.default_role_id);
        setSelectedGroupName(group?.name || "");
        setEditingPosition(position);
        setIsPositionSheetOpen(true);
    };

    const handleDeletePosition = async (id: string) => {
        try {
            const { error } = await supabase
                .from("staff_positions")
                .delete()
                .eq("id", id);

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
            title="Permission Groups"
            description="Manage permission groups and their associated staff positions."
            icon={Shield}
            action={
                <button
                    onClick={handleAddNewGroup}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    New Permission Group
                </button>
            }
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Search Bar */}
                <div className="relative w-full max-w-md shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search groups or positions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:border-primary/50 focus:outline-none transition-colors placeholder:text-muted-foreground"
                    />
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                        <PermissionGroupsPositionsList
                            groups={filteredGroups}
                            onEditGroup={handleEditGroup}
                            onDeleteGroup={handleDeleteGroup}
                            onAddPosition={handleAddPosition}
                            onEditPosition={handleEditPosition}
                            onDeletePosition={handleDeletePosition}
                        />
                    </div>
                )}
            </div>

            {/* Permission Group Form */}
            <AddRoleSheet
                isOpen={isGroupSheetOpen}
                onClose={() => setIsGroupSheetOpen(false)}
                onSuccess={fetchData}
                initialData={editingGroup}
            />

            {/* Staff Position Form */}
            <StaffPositionFormSheet
                isOpen={isPositionSheetOpen}
                onClose={() => setIsPositionSheetOpen(false)}
                onSuccess={fetchData}
                groupId={selectedGroupId}
                groupName={selectedGroupName}
                initialData={editingPosition}
                onEditParentGroup={(groupId) => {
                    const group = groups.find(g => g.id === groupId);
                    if (group) {
                        handleEditGroup(group);
                    }
                }}
            />
        </PageShell>
    );
}
