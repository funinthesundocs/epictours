"use client";

import { Edit2, Clock, Trash2, CalendarClock } from "lucide-react";

interface ScheduleTableProps {
    data: any[];
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
}

export function SchedulesTable({ data, onEdit, onDelete }: ScheduleTableProps) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500 bg-[#0b1115] rounded-xl border border-white/10">
                No schedules found.
            </div>
        );
    }

    return (
        <div className="bg-[#0b1115] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-black/20 text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                        <th className="px-6 py-4">Schedule Name</th>
                        <th className="px-6 py-4">Start Time</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                    {data.map((schedule) => (
                        <tr key={schedule.id} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                    <CalendarClock size={16} />
                                </div>
                                {schedule.name}
                            </td>
                            <td className="px-6 py-4">
                                <span className="flex items-center gap-2 text-zinc-400">
                                    <Clock size={14} />
                                    {schedule.start_time}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => onEdit(schedule)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Delete ${schedule.name}?`)) {
                                                onDelete(schedule.id);
                                            }
                                        }}
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
        </div>
    );
}
