"use client";

import { useState } from "react";
import { Edit2, Trash2, Plus, ChevronDown, ChevronRight, Shield, Briefcase } from "lucide-react";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

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

interface PermissionGroupsPositionsListProps {
    groups: PermissionGroup[];
    onEditGroup: (group: PermissionGroup) => void;
    onDeleteGroup: (id: string) => void;
    onAddPosition: (groupId: string) => void;
    onEditPosition: (position: StaffPosition) => void;
    onDeletePosition: (id: string) => void;
}

export function PermissionGroupsPositionsList({
    groups,
    onEditGroup,
    onDeleteGroup,
    onAddPosition,
    onEditPosition,
    onDeletePosition
}: PermissionGroupsPositionsListProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(groups.map(g => g.id)));
    const [deletingGroup, setDeletingGroup] = useState<PermissionGroup | null>(null);
    const [deletingPosition, setDeletingPosition] = useState<StaffPosition | null>(null);

    const toggleGroup = (groupId: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupId)) {
            newExpanded.delete(groupId);
        } else {
            newExpanded.add(groupId);
        }
        setExpandedGroups(newExpanded);
    };

    if (!groups || groups.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                <Shield size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No permission groups found</p>
                <p className="text-sm">Create your first permission group to get started</p>
            </div>
        );
    }

    return (
        <>
            <div className="h-full overflow-auto space-y-3 p-4">
                {groups.map((group) => {
                    const isExpanded = expandedGroups.has(group.id);
                    const positionCount = group.positions?.length || 0;

                    return (
                        <div
                            key={group.id}
                            className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                        >
                            {/* Group Header */}
                            <div
                                className={cn(
                                    "flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors",
                                    isExpanded && "border-b border-white/10"
                                )}
                                onClick={() => toggleGroup(group.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <button
                                        className="p-1 text-zinc-400"
                                        onClick={(e) => { e.stopPropagation(); toggleGroup(group.id); }}
                                    >
                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    </button>
                                    <div>
                                        <h3 className="font-semibold text-white">{group.name}</h3>
                                        <p className="text-xs text-zinc-500">
                                            {positionCount} {positionCount === 1 ? 'position' : 'positions'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => onAddPosition(group.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                                    >
                                        <Plus size={14} />
                                        Add Position
                                    </button>
                                    <button
                                        onClick={() => onEditGroup(group)}
                                        className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                        title="Edit Permission Group"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingGroup(group)}
                                        className="p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                        title="Delete Permission Group"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Positions List */}
                            {isExpanded && (
                                <div className="bg-zinc-900/50">
                                    {positionCount === 0 ? (
                                        <div className="px-6 py-4 text-sm text-zinc-500 italic">
                                            No positions in this group yet
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-white/5">
                                            {group.positions?.map((position) => (
                                                <div
                                                    key={position.id}
                                                    className="flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: position.color || '#71717a' }}
                                                        />
                                                        <span className="text-zinc-300">{position.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => onEditPosition(position)}
                                                            className="p-1.5 text-zinc-500 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                                            title="Edit Position"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeletingPosition(position)}
                                                            className="p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                                            title="Delete Position"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Delete Group Dialog */}
            <AlertDialog
                isOpen={!!deletingGroup}
                onClose={() => setDeletingGroup(null)}
                onConfirm={() => {
                    if (deletingGroup) {
                        onDeleteGroup(deletingGroup.id);
                        setDeletingGroup(null);
                    }
                }}
                title="Delete Permission Group?"
                description={`Are you sure you want to delete "${deletingGroup?.name}"? This will also remove the group from any users who have it assigned.`}
                confirmLabel="Delete Group"
                isDestructive={true}
            />

            {/* Delete Position Dialog */}
            <AlertDialog
                isOpen={!!deletingPosition}
                onClose={() => setDeletingPosition(null)}
                onConfirm={() => {
                    if (deletingPosition) {
                        onDeletePosition(deletingPosition.id);
                        setDeletingPosition(null);
                    }
                }}
                title="Delete Position?"
                description={`Are you sure you want to delete "${deletingPosition?.name}"? Staff members with this position will need to be reassigned.`}
                confirmLabel="Delete Position"
                isDestructive={true}
            />
        </>
    );
}
