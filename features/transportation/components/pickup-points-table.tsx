"use client";

import { ExternalLink, MapPin, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface PickupTableProps {
    data: any[];
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
}

export function PickupPointsTable({ data, onEdit, onDelete }: PickupTableProps) {
    const [deletingItem, setDeletingItem] = useState<any>(null);

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500 bg-[#0b1115] rounded-xl border border-white/10">
                No locations found.
            </div>
        );
    }

    return (
        <>
            <div className="bg-[#0b1115] border border-white/10 rounded-xl overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-black/20 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                        <tr>
                            <th className="px-6 py-4">Location Name</th>
                            <th className="px-6 py-4">Notes</th>
                            <th className="px-6 py-4">Map Link</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                        {data.map((point) => (
                            <tr key={point.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                                        <MapPin size={16} />
                                    </div>
                                    {point.name}
                                </td>
                                <td className="px-6 py-4 text-zinc-400 text-xs max-w-xs truncate">
                                    {point.instructions || "-"}
                                </td>
                                <td className="px-6 py-4">
                                    {point.map_link ? (
                                        <a
                                            href={point.map_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors text-xs"
                                        >
                                            View Map <ExternalLink size={12} />
                                        </a>
                                    ) : (
                                        <span className="text-zinc-600 italic">No link</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 relative z-50">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(point);
                                            }}
                                            className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingItem(point);
                                            }}
                                            className="p-1.5 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400 transition-colors"
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
            </div>

            <AlertDialog
                isOpen={!!deletingItem}
                onClose={() => setDeletingItem(null)}
                onConfirm={() => {
                    if (deletingItem) {
                        onDelete(deletingItem.id);
                        setDeletingItem(null);
                    }
                }}
                title="Delete Location?"
                description={`Are you sure you want to remove "${deletingItem?.name}"? This action cannot be undone.`}
                confirmLabel="Delete Location"
                isDestructive={true}
            />
        </>
    );
}
