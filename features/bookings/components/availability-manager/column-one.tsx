"use client";

import { Availability } from "@/features/availability/components/availability-list-table";

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
            minute: '2-digit'
        });
    };

    const bookedCount = availability.booked_count || 0;
    const maxCapacity = availability.max_capacity || 0;
    const remaining = Math.max(0, maxCapacity - bookedCount);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Header Info Card - matches booking-desk column-one exactly */}
            <div className="p-4 bg-black/20 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-xs tracking-wider border-b border-white/5 pb-2">
                    {availability.experience_name || "Unknown Experience"}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Date</div>
                        <div className="text-white font-medium">
                            {formatDate(availability.start_date)}
                        </div>
                    </div>
                    <div>
                        <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Time</div>
                        <div className="text-white font-medium">
                            {formatTime(availability.start_time)}
                        </div>
                    </div>
                    <div className="col-span-2">
                        <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Availability ID</div>
                        <div className="text-zinc-400 font-mono text-[10px] truncate" title={availability.id}>
                            {availability.id}
                        </div>
                    </div>
                    <div className="col-span-2 border-t border-white/5 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Capacity</div>
                                <div className="text-white font-medium">
                                    {bookedCount} / {maxCapacity} Pax
                                </div>
                            </div>
                            <div>
                                <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Remaining</div>
                                <div className={`font-medium ${remaining <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {remaining} Pax
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vehicle & Route Info */}
            {(availability.vehicle_name || availability.route_name) && (
                <div className="space-y-2">
                    <label className="text-base font-medium text-zinc-400">
                        Transportation
                    </label>
                    <div className="p-4 bg-black/20 rounded-xl border border-white/10 space-y-2">
                        {availability.route_name && (
                            <div>
                                <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Route</div>
                                <div className="text-white text-sm">{availability.route_name}</div>
                            </div>
                        )}
                        {availability.vehicle_name && (
                            <div>
                                <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Vehicle</div>
                                <div className="text-white text-sm">{availability.vehicle_name}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Staff Info */}
            {availability.staff_display && (
                <div className="space-y-2">
                    <label className="text-base font-medium text-zinc-400">
                        Staff Assigned
                    </label>
                    <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                        <div className="text-white text-sm">{availability.staff_display}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
