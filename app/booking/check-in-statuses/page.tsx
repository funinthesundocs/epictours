"use client";

import { useEffect, useState } from "react";
import { Plus, Search, UserCheck, Trash2, Save, Edit2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageShell } from "@/components/shell/page-shell";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/auth-context";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";
import { CustomSelect } from "@/components/ui/custom-select";

// Color options with colored dots for the selector
const COLOR_OPTIONS = [
    {
        value: "red",
        label: "Red",
        class: "bg-red-500/70",
        icon: <span className="w-3 h-3 rounded-full bg-red-500" />
    },
    {
        value: "orange",
        label: "Orange",
        class: "bg-orange-500/70",
        icon: <span className="w-3 h-3 rounded-full bg-orange-500" />
    },
    {
        value: "yellow",
        label: "Yellow",
        class: "bg-yellow-500/70",
        icon: <span className="w-3 h-3 rounded-full bg-yellow-500" />
    },
    {
        value: "green",
        label: "Green",
        class: "bg-emerald-500/70",
        icon: <span className="w-3 h-3 rounded-full bg-emerald-500" />
    },
    {
        value: "blue",
        label: "Blue",
        class: "bg-blue-500/70",
        icon: <span className="w-3 h-3 rounded-full bg-blue-500" />
    },
    {
        value: "indigo",
        label: "Indigo",
        class: "bg-indigo-500/70",
        icon: <span className="w-3 h-3 rounded-full bg-indigo-500" />
    },
    {
        value: "violet",
        label: "Violet",
        class: "bg-violet-500/70",
        icon: <span className="w-3 h-3 rounded-full bg-violet-500" />
    },
];

export function getColorClass(color: string): string {
    return COLOR_OPTIONS.find(c => c.value === color)?.class || "bg-blue-500/70";
}

interface CheckInStatus {
    id: string;
    status: string;
    color: string;
    notes: string | null;
    organization_id: string;
    created_at: string;
}

export default function CheckInStatusesPage() {
    const { effectiveOrganizationId } = useAuth();
    const [statuses, setStatuses] = useState<CheckInStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [statusToDelete, setStatusToDelete] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ status: "", color: "", notes: "" });

    const fetchStatuses = async () => {
        if (!effectiveOrganizationId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const { data, error } = await supabase
            .from("check_in_statuses")
            .select("*")
            .eq("organization_id", effectiveOrganizationId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error fetching statuses:", error);
        } else {
            setStatuses(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchStatuses();
    }, [effectiveOrganizationId]);

    const handleCreate = async () => {
        if (!effectiveOrganizationId) return;

        const { error } = await supabase
            .from("check_in_statuses")
            .insert([{
                status: "New Status",
                color: "blue",
                notes: "",
                organization_id: effectiveOrganizationId
            }]);

        if (error) {
            toast.error("Failed to create status");
        } else {
            toast.success("Status created");
            fetchStatuses();
        }
    };

    const handleEdit = (status: CheckInStatus) => {
        setEditingId(status.id);
        setEditForm({
            status: status.status,
            color: status.color,
            notes: status.notes || ""
        });
    };

    const handleSave = async () => {
        if (!editingId) return;

        const { error } = await supabase
            .from("check_in_statuses")
            .update({
                status: editForm.status,
                color: editForm.color,
                notes: editForm.notes || null
            })
            .eq("id", editingId);

        if (error) {
            toast.error("Failed to update status");
        } else {
            toast.success("Status updated");
            setEditingId(null);
            fetchStatuses();
        }
    };

    const handleDeleteClick = (id: string) => {
        setStatusToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!effectiveOrganizationId || !statusToDelete) return;

        const { error } = await supabase
            .from("check_in_statuses")
            .delete()
            .eq("id", statusToDelete)
            .eq("organization_id", effectiveOrganizationId);

        if (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete status");
        } else {
            toast.success("Status deleted");
            fetchStatuses();
        }

        setDeleteDialogOpen(false);
        setStatusToDelete(null);
    };

    const filteredStatuses = statuses.filter(s =>
        s.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.notes || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <PageShell
            title="Check-In Statuses"
            description="Configure check-in statuses for bookings."
            icon={UserCheck}
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
            action={
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} /> New Status
                </button>
            }
        >
            <div className="h-full flex flex-col space-y-4">
                {/* Toolbar */}
                <div className="flex items-center gap-4 shrink-0">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search statuses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Table Area */}
                <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                    {isLoading ? (
                        <LoadingState message="Loading statuses..." />
                    ) : filteredStatuses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                            <UserCheck size={32} className="opacity-50" />
                            <p>No check-in statuses found</p>
                            <button
                                onClick={handleCreate}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted border border-border rounded-lg transition-colors"
                            >
                                <Plus size={14} /> Create First Status
                            </button>
                        </div>
                    ) : (
                        <div className="h-full overflow-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
                                    <tr className="border-b border-border">
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Color</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Notes</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStatuses.map((status) => (
                                        <tr
                                            key={status.id}
                                            className="border-b border-border hover:bg-muted/30 transition-colors"
                                        >
                                            {editingId === status.id ? (
                                                <>
                                                    <td className="px-6 py-3">
                                                        <Input
                                                            value={editForm.status}
                                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                                            className="max-w-xs"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <CustomSelect
                                                            value={editForm.color}
                                                            onChange={(value) => setEditForm({ ...editForm, color: value })}
                                                            options={COLOR_OPTIONS}
                                                            className="w-40"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <Input
                                                            value={editForm.notes}
                                                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                                            placeholder="Optional notes..."
                                                            className="max-w-md"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={handleSave}
                                                                className="px-3 py-1.5 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center gap-1.5"
                                                            >
                                                                <Save size={14} /> Save
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingId(null)}
                                                                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <span className={cn(
                                                                "w-3 h-3 rounded-full shrink-0",
                                                                getColorClass(status.color)
                                                            )} />
                                                            <span className="text-foreground font-medium">{status.status}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <span className={cn(
                                                            "px-2 py-1 rounded text-xs font-medium text-white",
                                                            getColorClass(status.color)
                                                        )}>
                                                            {status.color}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-muted-foreground text-sm">
                                                        {status.notes || "-"}
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEdit(status)}
                                                                className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteClick(status.id)}
                                                                className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Check-in Status?"
                description="This status will be removed. Bookings using it will have no status."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                isDestructive={true}
            />
        </PageShell >
    );
}
