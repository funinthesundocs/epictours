"use client";

import { useEffect, useState } from "react";
import { Plus, Search, UserCheck, Trash2, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageShell } from "@/components/shell/page-shell";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/ui/loading-state";

// Color options (70% opacity for soft effect)
const COLOR_OPTIONS = [
    { value: "red", label: "Red", class: "bg-red-500/70" },
    { value: "orange", label: "Orange", class: "bg-orange-500/70" },
    { value: "yellow", label: "Yellow", class: "bg-yellow-500/70" },
    { value: "green", label: "Green", class: "bg-emerald-500/70" },
    { value: "blue", label: "Blue", class: "bg-blue-500/70" },
    { value: "indigo", label: "Indigo", class: "bg-indigo-500/70" },
    { value: "violet", label: "Violet", class: "bg-violet-500/70" },
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
    const [statuses, setStatuses] = useState<CheckInStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ status: "", color: "", notes: "" });

    const fetchStatuses = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("check_in_statuses")
            .select("*")
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
    }, []);

    const handleCreate = async () => {
        // Get org ID from first status or fetch it
        let orgId = statuses[0]?.organization_id;
        if (!orgId) {
            const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
            orgId = orgs?.[0]?.id;
        }

        const { error } = await supabase
            .from("check_in_statuses")
            .insert([{
                status: "New Status",
                color: "blue",
                notes: "",
                organization_id: orgId
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

    const handleDelete = async (id: string) => {
        const confirm = window.confirm("Delete this status? Bookings using it will have no status.");
        if (!confirm) return;

        const { error } = await supabase
            .from("check_in_statuses")
            .delete()
            .eq("id", id);

        if (error) {
            toast.error("Failed to delete status");
        } else {
            toast.success("Status deleted");
            fetchStatuses();
        }
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
                <Button
                    onClick={handleCreate}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all"
                >
                    <Plus className="mr-2 h-4 w-4" /> New Status
                </Button>
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
                            <Button variant="outline" size="sm" onClick={handleCreate}>
                                <Plus className="mr-2 h-4 w-4" /> Create First Status
                            </Button>
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
                                                        <select
                                                            value={editForm.color}
                                                            onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                                                            className="h-10 px-3 rounded-md border border-border bg-background text-foreground"
                                                        >
                                                            {COLOR_OPTIONS.map((opt) => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </select>
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
                                                            <Button
                                                                size="sm"
                                                                onClick={handleSave}
                                                                className="bg-emerald-500 hover:bg-emerald-600"
                                                            >
                                                                <Save size={14} className="mr-1" /> Save
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setEditingId(null)}
                                                            >
                                                                Cancel
                                                            </Button>
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
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleEdit(status)}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-destructive hover:bg-destructive/10"
                                                                onClick={() => handleDelete(status.id)}
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
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
        </PageShell>
    );
}
