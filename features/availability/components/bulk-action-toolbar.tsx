"use client";

import { useState } from "react";
import { CheckSquare, X, Power, Users, Trash2, Loader2, Edit, CopyCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { BulkEditSheet } from "./bulk-edit-sheet";

interface BulkActionToolbarProps {
    selectedCount: number;
    selectedIds: Set<string>;
    onClearSelection: () => void;
    onSuccess: () => void;
    onExitBulkMode: () => void;
    onDuplicate?: () => void;
}

type BulkAction = 'status' | 'capacity' | 'delete' | null;

export function BulkActionToolbar({
    selectedCount,
    selectedIds,
    onClearSelection,
    onSuccess,
    onExitBulkMode,
    onDuplicate
}: BulkActionToolbarProps) {
    const [activeAction, setActiveAction] = useState<BulkAction>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

    // Action-specific state
    const [newStatus, setNewStatus] = useState<'open' | 'closed'>('open');
    const [newCapacity, setNewCapacity] = useState<number>(0);

    const handleExecute = async () => {
        if (selectedIds.size === 0) return;

        setIsLoading(true);
        try {
            const ids = Array.from(selectedIds);

            if (activeAction === 'status') {
                const { error } = await supabase
                    .from('availabilities' as any)
                    .update({ online_booking_status: newStatus })
                    .in('id', ids);
                if (error) throw error;
                toast.success(`Updated ${ids.length} availabilities to "${newStatus}"`);
            } else if (activeAction === 'capacity') {
                const { error } = await supabase
                    .from('availabilities' as any)
                    .update({ max_capacity: newCapacity })
                    .in('id', ids);
                if (error) throw error;
                toast.success(`Updated capacity to ${newCapacity} for ${ids.length} availabilities`);
            } else if (activeAction === 'delete') {
                const { error } = await supabase
                    .from('availabilities' as any)
                    .delete()
                    .in('id', ids);
                if (error) throw error;
                toast.success(`Deleted ${ids.length} availabilities`);
            }

            onClearSelection();
            onSuccess();
            setActiveAction(null);
        } catch (err: any) {
            console.error("Bulk action error:", err);
            toast.error(err.message || "Failed to execute bulk action");
        } finally {
            setIsLoading(false);
            setIsConfirmOpen(false);
        }
    };

    const getConfirmMessage = () => {
        const count = selectedIds.size;
        switch (activeAction) {
            case 'status':
                return `Change status to "${newStatus}" for ${count} availability slot(s)?`;
            case 'capacity':
                return `Set capacity to ${newCapacity} for ${count} availability slot(s)?`;
            case 'delete':
                return `Permanently delete ${count} availability slot(s)? This cannot be undone.`;
            default:
                return '';
        }
    };

    if (selectedCount === 0) {
        return (
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg mb-2.5">
                <div className="flex items-center gap-3">
                    <CheckSquare size={18} className="text-zinc-500" />
                    <span className="text-sm text-zinc-400">Select items to update</span>
                </div>
                <button
                    onClick={onExitBulkMode}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Exit Select Mode"
                >
                    <X size={18} />
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center justify-between px-4 py-3 bg-cyan-950/30 border border-cyan-500/20 rounded-lg mb-2.5">
                <div className="flex items-center gap-6">
                    {/* Selection Counter */}
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-cyan-400">{selectedCount}</span>
                        <span className="text-sm text-zinc-400">selected</span>
                        <button
                            onClick={onClearSelection}
                            className="ml-2 text-xs text-zinc-500 hover:text-white"
                        >
                            Clear
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 border-l border-zinc-700 pl-6">

                        {/* Update (Full Edit) Action - First */}
                        <button
                            onClick={() => setIsBulkEditOpen(true)}
                            className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-cyan-500 text-white hover:bg-cyan-400 transition-colors font-bold"
                        >
                            <Edit size={16} />
                            Update
                        </button>

                        {/* Duplicate Action */}
                        {onDuplicate && (
                            <button
                                onClick={onDuplicate}
                                disabled={selectedCount === 0}
                                className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                            >
                                <CopyCheck size={16} />
                                Duplicate
                            </button>
                        )}

                        {/* Delete Action */}
                        <button
                            onClick={() => {
                                setActiveAction('delete');
                                setIsConfirmOpen(true);
                            }}
                            className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                    </div>
                </div>

                {/* Apply Button */}
                <div className="flex items-center gap-3">
                    {activeAction && activeAction !== 'delete' && (
                        <button
                            onClick={() => setIsConfirmOpen(true)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isLoading && <Loader2 className="animate-spin" size={16} />}
                            Apply to {selectedCount} items
                        </button>
                    )}
                    <button
                        onClick={onExitBulkMode}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        title="Exit Select Mode"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <AlertDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleExecute}
                title="Confirm Bulk Update"
                description={getConfirmMessage()}
                confirmLabel={activeAction === 'delete' ? 'Delete' : 'Apply'}
                isDestructive={activeAction === 'delete'}
            />

            <BulkEditSheet
                isOpen={isBulkEditOpen}
                onClose={() => {
                    setIsBulkEditOpen(false);
                    onClearSelection();
                }}
                onSuccess={() => {
                    onClearSelection();
                    onSuccess();
                }}
                selectedIds={selectedIds}
            />
        </>
    );
}
