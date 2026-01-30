"use client";

import { Edit2, Trash2, Map, Tag, Clock } from "lucide-react";
import { Experience } from "../types";
import { useState } from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface ExperiencesTableProps {
    data: Experience[];
    onEdit: (item: Experience) => void;
    onDelete: (id: string) => void;
}

export function ExperiencesTable({ data, onEdit, onDelete }: ExperiencesTableProps) {
    const [deletingItem, setDeletingItem] = useState<Experience | null>(null);

    return (
        <>
            <div className="h-full overflow-auto relative">
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-muted/50 backdrop-blur-sm text-foreground text-sm uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-border">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Event Type</th>
                            <th className="px-6 py-4">Start Time</th>
                            <th className="px-6 py-4">End Time</th>
                            <th className="px-6 py-4 w-[100px] border-l border-border"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-muted-foreground">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-muted transition-colors group">
                                {/* Name */}
                                <td className="px-6 py-4 text-foreground font-medium">
                                    {item.name}
                                </td>

                                {/* Type */}
                                <td className="px-6 py-4 text-muted-foreground">
                                    {item.event_type}
                                </td>

                                {/* Start Time */}
                                <td className="px-6 py-4 text-muted-foreground">
                                    {item.start_time || "-"}
                                </td>

                                {/* End Time */}
                                <td className="px-6 py-4 text-muted-foreground">
                                    {item.end_time || "-"}
                                </td>

                                {/* Actions - Last Column */}
                                <td className="px-6 py-4 border-l border-border">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            onClick={() => onEdit(item)}
                                            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setDeletingItem(item)}
                                            className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4">
                    {data.map((item) => (
                        <div key={item.id} className="bg-card border border-border rounded-xl p-4 space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
                                <h3 className="text-lg font-bold text-foreground leading-tight">
                                    {item.name}
                                </h3>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onEdit(item)}
                                        className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingItem(item)}
                                        className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Tag size={14} className="text-muted-foreground" />
                                    {item.event_type}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock size={14} className="text-muted-foreground" />
                                    {item.start_time || "-"} - {item.end_time || "-"}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {data.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/50 rounded-xl border border-border mx-4 md:mx-0">
                        No experiences found. Click "Add Experience" to create one.
                    </div>
                )}
            </div>

            <AlertDialog
                isOpen={!!deletingItem}
                onClose={() => setDeletingItem(null)}
                onConfirm={() => {
                    if (deletingItem?.id) onDelete(deletingItem.id);
                    setDeletingItem(null);
                }}
                title="Delete Experience?"
                description={`Are you sure you want to delete "${deletingItem?.name}"? This cannot be undone.`}
                confirmLabel="Delete"
                isDestructive={true}
            />
        </>
    );
}
