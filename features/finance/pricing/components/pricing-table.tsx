"use client";

import { Edit2, Trash2, Search, Coins } from "lucide-react";
import { useState } from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface PricingSchedule {
    id: string;
    name: string;
    notes: string | null;
    created_at: string;
}

interface PricingSchedulesTableProps {
    data: PricingSchedule[];
    onEdit: (schedule: PricingSchedule) => void;
    onDelete: (id: string) => void;
}

export function PricingSchedulesTable({ data, onEdit, onDelete }: PricingSchedulesTableProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500 bg-[#0b1115] rounded-xl border border-white/5">
                <Search size={48} className="mb-4 opacity-20" />
                <p>No pricing schedules found.</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto relative">
            <table className="w-full text-left hidden md:table">
                <thead className="bg-white/5 backdrop-blur-sm text-zinc-400 text-xs uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
                    <tr>
                        <th className="px-6 py-4 font-medium w-[30%]">Schedule Name</th>
                        <th className="px-6 py-4 font-medium">Notes</th>
                        <th className="px-6 py-4 font-medium w-[150px]">Created</th>
                        <th className="px-6 py-4 font-medium text-right w-[100px]">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                    {data.map((schedule) => (
                        <tr key={schedule.id} className="hover:bg-white/5 transition-colors group">
                            {/* Name */}
                            <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                                    <Coins size={16} />
                                </div>
                                {schedule.name}
                            </td>

                            {/* Notes */}
                            <td className="px-6 py-4 text-zinc-400 max-w-md truncate">
                                {schedule.notes || <span className="opacity-30 italic">No notes</span>}
                            </td>

                            {/* Created At */}
                            <td className="px-6 py-4 text-zinc-500">
                                {new Date(schedule.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => onEdit(schedule)}
                                        className="p-2 hover:bg-cyan-500/10 hover:text-cyan-400 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(schedule.id)}
                                        className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
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
                {data.map((schedule) => (
                    <div key={schedule.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                        {/* Header: Name + Actions */}
                        <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                                    <Coins size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-white leading-tight">{schedule.name}</h3>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => onEdit(schedule)}
                                    className="p-2 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => setDeleteId(schedule.id)}
                                    className="p-2 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Body: Two Columns */}
                        <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-base">
                            <div className="text-zinc-500">Notes</div>
                            <div className="text-zinc-400">{schedule.notes || <span className="opacity-50 italic">No notes</span>}</div>

                            <div className="text-zinc-500">Created</div>
                            <div className="text-zinc-300">{new Date(schedule.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                    </div>
                ))}
            </div>

            <AlertDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => {
                    if (deleteId) onDelete(deleteId);
                    setDeleteId(null);
                }}
                isDestructive={true}
                title="Delete Schedule"
                description="Are you sure you want to delete this pricing schedule? This will delete all associated rates and cannot be undone."
                confirmLabel="Delete Schedule"
            />
        </div>
    );
}
