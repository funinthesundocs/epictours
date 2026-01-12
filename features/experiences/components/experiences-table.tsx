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
            <div className="bg-[#0b1115] border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-black/20 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
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
                                            title="Edit Details"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setDeletingItem(item)}
                                            className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

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
