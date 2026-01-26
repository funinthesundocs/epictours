"use client";

import { Trash2, Edit2, Code } from "lucide-react";
import { useState } from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface CustomerTypesTableProps {
    data: any[];
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
}

export function CustomerTypesTable({ data, onEdit, onDelete }: CustomerTypesTableProps) {
    const [deletingItem, setDeletingItem] = useState<any>(null);


    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500 bg-[#0b1115] rounded-xl border border-white/10">
                No customer types found.
            </div>
        );
    }

    return (
        <>
            <div className="h-full overflow-auto relative">
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-white/5 backdrop-blur-sm text-zinc-400 text-xs uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4">Customer Type</th>
                            <th className="px-6 py-4">Code</th>
                            <th className="px-6 py-4">Notes</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                        {data.map((type) => (
                            <tr key={type.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                                    {type.name}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                                        {type.code}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-zinc-400 text-xs max-w-xs truncate">
                                    {type.description || "-"}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(type);
                                            }}
                                            className="p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingItem(type);
                                            }}
                                            className="p-2 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400 transition-colors"
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
                    {data.map((type) => (
                        <div key={type.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-white leading-tight">
                                        {type.name}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onEdit(type)}
                                        className="p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingItem(type)}
                                        className="p-2 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Body Grid */}
                            <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-sm">
                                <div className="text-zinc-500">Code</div>
                                <div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                                        {type.code}
                                    </span>
                                </div>

                                <div className="text-zinc-500">Notes</div>
                                <div className="text-zinc-400 text-xs">
                                    {type.description || "-"}
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
                title="Delete Customer Type?"
                description={`Are you sure you want to remove "${deletingItem?.name}"? This action cannot be undone.`}
                confirmLabel="Delete Type"
                isDestructive={true}
            />
        </>
    );
}
