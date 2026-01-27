"use client";

import { Edit2, Trash2, Search, Copy, Calendar, List, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface BookingOptionSchedule {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
    config_retail: any[];
    config_online: any[];
    config_special: any[];
    config_custom: any[];
}

interface BookingOptionsTableProps {
    data: BookingOptionSchedule[];
    onEdit: (schedule: BookingOptionSchedule) => void;
    onDuplicate: (schedule: BookingOptionSchedule) => void;
    onDelete: (id: string) => void;
}

export function BookingOptionsTable({ data, onEdit, onDuplicate, onDelete }: BookingOptionsTableProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-zinc-500 bg-[#0b1115] rounded-xl border border-white/5">
                <Search size={48} className="mb-4 opacity-20" />
                <p>No booking option schedules found.</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto relative">
            <table className="w-full text-left">
                <thead className="bg-white/5 backdrop-blur-sm text-zinc-400 text-xs uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
                    <tr>
                        <th className="px-6 py-4 font-medium w-[25%]">Schedule Name</th>
                        <th className="px-6 py-4 font-medium w-[35%]">Description</th>
                        <th className="px-6 py-4 font-medium">Field Count</th>
                        <th className="px-6 py-4 font-medium">Created</th>
                        <th className="px-6 py-4 font-medium text-right w-[120px]">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                    {data.map((schedule) => {
                        // Calculate total unique fields across configs or just show Retail count as proxy
                        const fieldCount = (schedule.config_retail?.length || 0);

                        return (
                            <tr key={schedule.id} className="hover:bg-white/5 transition-colors group">
                                {/* Name */}
                                <td className="px-6 py-4 font-medium text-white align-top">
                                    <div className="flex items-center gap-3 pt-2">
                                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                                            <List size={16} />
                                        </div>
                                        <span>{schedule.name}</span>
                                    </div>
                                </td>

                                {/* Description */}
                                <td className="px-6 py-4 align-top">
                                    <div className="pt-3 text-zinc-400">
                                        {schedule.description || <span className="opacity-30 italic">No description</span>}
                                    </div>
                                </td>

                                {/* Count */}
                                <td className="px-6 py-4 align-top">
                                    <div className="flex items-center gap-2 pt-3">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-zinc-400">
                                            {fieldCount} Fields
                                        </span>
                                    </div>
                                </td>

                                {/* Created */}
                                <td className="px-6 py-4 align-top text-zinc-400">
                                    <div className="pt-3">
                                        {new Date(schedule.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-4 text-right align-top">
                                    <div className="flex items-center justify-end gap-2 mt-2">
                                        <button
                                            onClick={() => onEdit(schedule)}
                                            className="p-2 text-zinc-400 hover:bg-cyan-500/10 hover:text-cyan-400 rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDuplicate(schedule)}
                                            className="p-2 text-zinc-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors"
                                        >
                                            <Copy size={16} />
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
                        );
                    })}
                </tbody>
            </table>

            <AlertDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => {
                    if (deleteId) onDelete(deleteId);
                    setDeleteId(null);
                }}
                isDestructive={true}
                title="Delete Schedule"
                description="Are you sure you want to delete this schedule? This action cannot be undone."
                confirmLabel="Delete Schedule"
            />
        </div>
    );
}
