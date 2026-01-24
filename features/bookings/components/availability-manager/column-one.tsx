"use client";

import { Availability } from "@/features/availability/components/availability-list-table";
import { Calendar, Clock, Users, Hash } from "lucide-react";

interface ColumnOneProps {
    availability: Availability;
}

export function ColumnOne({ availability }: ColumnOneProps) {
    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-');
        return `${m}-${d}-${y}`;
    };

    const formatTime = (timeStr: string | undefined) => {
        if (!timeStr) return "All Day";
        return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const bookedCount = availability.booked_count || 0;
    const maxCapacity = availability.max_capacity || 0;
    const remaining = Math.max(0, maxCapacity - bookedCount);

    return (
        <div className="p-6 space-y-6">
            {/* Experience Name */}
            <div>
                <h2 className="text-cyan-400 font-bold text-xl">
                    {availability.experience_name || "Experience"}
                </h2>
                {availability.experience_short_code && (
                    <span className="text-zinc-500 text-sm font-mono">
                        ({availability.experience_short_code})
                    </span>
                )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider flex items-center gap-2">
                        <Calendar size={14} className="text-cyan-500" />
                        Date
                    </div>
                    <div className="text-white font-bold text-lg mt-1">
                        {formatDate(availability.start_date)}
                    </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider flex items-center gap-2">
                        <Clock size={14} className="text-cyan-500" />
                        Time
                    </div>
                    <div className="text-white font-bold text-lg mt-1">
                        {formatTime(availability.start_time)}
                    </div>
                </div>
            </div>

            {/* Availability ID */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider flex items-center gap-2">
                    <Hash size={14} className="text-zinc-500" />
                    Availability ID
                </div>
                <div className="text-zinc-400 font-mono text-xs mt-1 truncate" title={availability.id}>
                    {availability.id}
                </div>
            </div>

            {/* Capacity */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider flex items-center gap-2">
                            <Users size={14} className="text-cyan-500" />
                            Capacity
                        </div>
                        <div className="text-white font-bold text-lg mt-1">
                            {bookedCount} / {maxCapacity} <span className="text-sm font-normal text-zinc-500">Pax</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">
                            Remaining
                        </div>
                        <div className={`font-bold text-lg mt-1 ${remaining <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {remaining} <span className="text-sm font-normal text-zinc-500">Pax</span>
                        </div>
                    </div>
                </div>

                {/* Capacity Bar */}
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${remaining <= 5 ? 'bg-amber-500' : 'bg-cyan-500'
                            }`}
                        style={{ width: `${maxCapacity > 0 ? (bookedCount / maxCapacity) * 100 : 0}%` }}
                    />
                </div>
            </div>

            {/* Private Note */}
            {availability.private_announcement && (
                <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
                    <div className="text-amber-400 text-xs uppercase font-bold tracking-wider mb-1">
                        Private Note
                    </div>
                    <div className="text-amber-200 text-sm">
                        {availability.private_announcement}
                    </div>
                </div>
            )}
        </div>
    );
}
