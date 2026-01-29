"use client";

import { ExternalLink, MapPin, Trash2, Edit2, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface PickupTableProps {
    data: any[];
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
}

export function PickupPointsTable({ data, onEdit, onDelete }: PickupTableProps) {
    const [deletingItem, setDeletingItem] = useState<any>(null);
    const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedNotes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500 bg-[#0b1115] rounded-xl border border-white/10">
                No locations found.
            </div>
        );
    }

    return (
        <>
            <div className="h-full overflow-auto relative">
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-zinc-900/80 backdrop-blur-sm text-white text-sm uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4">Location Name</th>
                            <th className="px-6 py-4">Map Link</th>
                            <th className="px-6 py-4">Notes</th>
                            <th className="px-6 py-4 w-[100px] border-l border-white/10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                        {data.map((point) => (
                            <tr key={point.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 font-medium text-white align-middle">
                                    {point.name}
                                </td>
                                <td className="px-6 py-4">
                                    {point.map_link ? (
                                        <a
                                            href={point.map_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-400/10 text-cyan-400 rounded-full text-xs font-medium border border-cyan-400/20 hover:bg-cyan-400/20 transition-colors"
                                        >
                                            View Map <ExternalLink size={12} />
                                        </a>
                                    ) : (
                                        <span className="text-zinc-600 italic">No link</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-zinc-400 max-w-xs align-middle">
                                    {point.instructions && point.instructions.length > 30 && !expandedNotes.has(point.id) ? (
                                        <span className="flex items-center gap-2">
                                            <span>{point.instructions.substring(0, 30)}...</span>
                                            <button
                                                onClick={(e) => toggleExpand(point.id, e)}
                                                className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20 transition-colors"
                                            >
                                                <Plus size={10} />
                                            </button>
                                        </span>
                                    ) : (
                                        <span className="flex items-start gap-2">
                                            <span>{point.instructions || "-"}</span>
                                            {point.instructions && point.instructions.length > 30 && (
                                                <button
                                                    onClick={(e) => toggleExpand(point.id, e)}
                                                    className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                                                >
                                                    <Minus size={10} />
                                                </button>
                                            )}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 align-middle border-l border-white/10">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(point);
                                            }}
                                            className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingItem(point);
                                            }}
                                            className="p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
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
                    {data.map((point) => (
                        <div key={point.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                                <h3 className="text-lg font-bold text-white leading-tight">
                                    {point.name}
                                </h3>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onEdit(point)}
                                        className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingItem(point)}
                                        className="p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Body Grid */}
                            <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-sm">
                                <div className="text-zinc-500">Map Link</div>
                                <div>
                                    {point.map_link ? (
                                        <a
                                            href={point.map_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-400/10 text-cyan-400 rounded-full text-xs font-medium border border-cyan-400/20 hover:bg-cyan-400/20 transition-colors"
                                        >
                                            View Map <ExternalLink size={12} />
                                        </a>
                                    ) : (
                                        <span className="text-zinc-600 italic">No link</span>
                                    )}
                                </div>

                                <div className="text-zinc-500">Notes</div>
                                <div className="text-zinc-400 text-sm">
                                    {point.instructions && point.instructions.length > 30 && !expandedNotes.has(point.id) ? (
                                        <span className="flex items-center gap-2">
                                            <span>{point.instructions.substring(0, 30)}...</span>
                                            <button
                                                onClick={(e) => toggleExpand(point.id, e)}
                                                className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20 transition-colors"
                                            >
                                                <Plus size={10} />
                                            </button>
                                        </span>
                                    ) : (
                                        <span className="flex items-start gap-2">
                                            <span>{point.instructions || "-"}</span>
                                            {point.instructions && point.instructions.length > 30 && (
                                                <button
                                                    onClick={(e) => toggleExpand(point.id, e)}
                                                    className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                                                >
                                                    <Minus size={10} />
                                                </button>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
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
