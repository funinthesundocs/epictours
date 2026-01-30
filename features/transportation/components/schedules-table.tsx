"use client";

import { Edit2, Clock, Trash2, CalendarClock } from "lucide-react";

import { useState } from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface ScheduleTableProps {
    data: any[];
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
}

export function SchedulesTable({ data, onEdit, onDelete }: ScheduleTableProps) {
    const [deletingItem, setDeletingItem] = useState<any>(null);

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-popover rounded-xl border border-border">
                No schedules found.
            </div>
        );
    }

    return (
        <>
            <div className="h-full overflow-auto relative">
                <table className="w-full text-left hidden md:table">
                    <thead className="bg-muted/50 backdrop-blur-sm text-foreground text-sm uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-border">
                        <tr>
                            <th className="px-6 py-4">Schedule Name</th>
                            <th className="px-6 py-4">Start Time</th>
                            <th className="px-6 py-4 w-[100px] border-l border-border"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-muted-foreground">
                        {data.map((schedule) => (
                            <tr key={schedule.id} className="hover:bg-muted/50 transition-colors group">
                                <td className="px-6 py-4 font-medium text-foreground">
                                    {schedule.name}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                        <Clock size={14} className="shrink-0 text-muted-foreground" />
                                        {schedule.start_time}
                                    </span>
                                </td>
                                <td className="px-6 py-4 border-l border-border">
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(schedule);
                                            }}
                                            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingItem(schedule);
                                            }}
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
                    {data.map((schedule) => (
                        <div key={schedule.id} className="bg-card border border-border rounded-xl p-4 space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
                                <h3 className="text-lg font-bold text-foreground leading-tight">
                                    {schedule.name}
                                </h3>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => onEdit(schedule)}
                                        className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => setDeletingItem(schedule)}
                                        className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Body Grid */}
                            <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-3 text-sm">
                                <div className="text-muted-foreground">Start Time</div>
                                <div className="flex items-center gap-2 text-foreground">
                                    <Clock size={14} className="text-muted-foreground" />
                                    {schedule.start_time}
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
                title="Delete Schedule?"
                description={`Are you sure you want to remove "${deletingItem?.name}"?`}
                confirmLabel="Delete Schedule"
                isDestructive={true}
            />
        </>
    );
}
