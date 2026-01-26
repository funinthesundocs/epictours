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
                    <thead className="bg-white/5 backdrop-blur-sm text-zinc-400 text-xs uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Event Type</th>
                            <th className="px-6 py-4">Start Time</th>
                            <th className="px-6 py-4">End Time</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                {/* Name */}
                                <td className="px-6 py-4 text-white font-medium">
                                    {item.name}
                                </td>

                                {/* Type */}
                                <td className="px-6 py-4 text-zinc-400">
                                    {item.event_type}
                                </td>

                                {/* Start Time */}
                                <td className="px-6 py-4 text-zinc-400">
                                    {item.start_time || "-"}
                                </td>

                                {/* End Time */}
                                <td className="px-6 py-4 text-zinc-400">
                                    {item.end_time || "-"}
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit(item)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setDeletingItem(item)}
                                            className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
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
                        <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                                <h3 className="text-lg font-bold text-white leading-tight">
                                    {item.name}
                                </h3>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onEdit(item)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingItem(item)}
                                        className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Body Grid */}
                            <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-sm">
                                <div className="text-zinc-500">Event Type</div>
                                <div className="text-zinc-300">{item.event_type}</div>

                                <div className="text-zinc-500">Start Time</div>
                                <div className="text-zinc-300">{item.start_time || "-"}</div>

                                <div className="text-zinc-500">End Time</div>
                                <div className="text-zinc-300">{item.end_time || "-"}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {data.length === 0 && (
                    <div className="text-center py-12 text-zinc-500">
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
