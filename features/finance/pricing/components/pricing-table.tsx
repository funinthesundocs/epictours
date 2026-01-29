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
                <thead className="bg-zinc-900/80 backdrop-blur-sm text-white text-sm uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
                    <tr>
                        <th className="px-6 py-4 font-medium w-[30%]">Schedule Name</th>
                        <th className="px-6 py-4 font-medium">Notes</th>
                        <th className="px-6 py-4 font-medium w-[150px]">Created</th>
                        <th className="px-6 py-4 font-medium w-[100px] border-l border-white/10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                    {data.map((schedule) => (
                        <tr key={schedule.id} className="hover:bg-white/5 transition-colors group">
                            {/* Name */}
                            <td className="px-6 py-4 font-medium text-white">
                                {schedule.name}
                            </td>

                            {/* Notes */}
                            <td className="px-6 py-4 text-zinc-400 max-w-md truncate">
                                {schedule.notes || <span className="opacity-30 italic">No notes</span>}
                            </td>

                            {/* Created At */}
                            <td className="px-6 py-4 text-zinc-400">
                                {new Date(schedule.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>

                            {/* Actions - Last Column */}
                            <td className="px-6 py-4 border-l border-white/10">
                                <div className="flex items-center gap-2 justify-end">
                                    <button
                                        onClick={() => onEdit(schedule)}
                                        className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeleteId(schedule.id)}
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
                {data.map((schedule) => (
                    <div key={schedule.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                        {/* Header: Name + Actions */}
                        <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                            <h3 className="text-lg font-bold text-white leading-tight">{schedule.name}</h3>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => onEdit(schedule)}
                                    className="p-2 text-zinc-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => setDeleteId(schedule.id)}
                                    className="p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="space-y-3">
                            {schedule.notes && (
                                <div className="text-zinc-400">{schedule.notes}</div>
                            )}
                            <div className="flex justify-end text-zinc-400">
                                {new Date(schedule.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
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
