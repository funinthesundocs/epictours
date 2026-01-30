"use client";

import { Edit2, Trash2, Calendar, Clock, Users, Repeat, MapPin, StickyNote, Bus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Availability {
    id: string;
    experience_id?: string;
    start_date: string;
    is_repeating: boolean;
    repeat_days?: string[];
    duration_type: 'all_day' | 'time_range';
    start_time?: string;
    hours_long?: number;
    max_capacity: number;
    booked_count?: number; // Tracks how many pax are booked (updated by DB trigger)
    online_booking_status: 'open' | 'closed';
    private_announcement?: string;
    transportation_route_id?: string;
    vehicle_id?: string;
    pricing_schedule_id?: string;
    booking_option_schedule_id?: string;
    staff_ids?: string[];
    bookings?: { pax_count: number, status: string }[]; // Nested relation
    booking_records_count?: number; // Calculated count of active bookings
    // Resource Clustering
    assignments?: {
        id: string;
        vehicle_id?: string;
        transportation_route_id?: string;
        driver_id?: string;
        guide_id?: string;
        sort_order: number;
    }[];
    // Enriched fields for UI
    staff_display?: string;
    route_name?: string;
    vehicle_name?: string;
    driver_name?: string;
    guide_name?: string;
    experience_name?: string; // New
    experience_short_code?: string; // New attempt to fix EXP label too
}

interface AvailabilityListTableProps {
    data: Availability[];
    onEdit?: (id: string, availability: Availability) => void;
    onDelete: (id: string) => void;
    // Bulk selection props
    selectedIds?: Set<string>;
    onSelectionChange?: (ids: Set<string>) => void;
    isBulkMode?: boolean;
}

import { useState } from "react";
import { AlertDialog } from "@/components/ui/alert-dialog";

export function AvailabilityListTable({
    data,
    onEdit,
    onDelete,
    selectedIds = new Set(),
    onSelectionChange,
    isBulkMode = false
}: AvailabilityListTableProps) {
    const [deletingItem, setDeletingItem] = useState<Availability | null>(null);

    const allSelected = data.length > 0 && data.every(item => selectedIds.has(item.id));
    const someSelected = data.some(item => selectedIds.has(item.id)) && !allSelected;

    const handleSelectAll = () => {
        if (allSelected) {
            onSelectionChange?.(new Set());
        } else {
            onSelectionChange?.(new Set(data.map(item => item.id)));
        }
    };

    const handleSelectItem = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        onSelectionChange?.(newSelection);
    };

    if (!data || data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-card border border-border rounded-2xl">
                <div className="text-muted-foreground text-sm">No availabilities found for this month.</div>
            </div>
        );
    }

    return (
        <>
            <div className="h-full overflow-auto relative bg-card border border-border rounded-xl">
                <table className="w-full text-left">
                    <thead className="bg-muted/50 backdrop-blur-sm text-foreground text-xs uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-border">
                        <tr>
                            {isBulkMode && (
                                <th className="px-4 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                                    />
                                </th>
                            )}
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Activity Date</th>
                            <th className="px-6 py-4">Start Time</th>
                            <th className="px-6 py-4">Duration</th>
                            <th className="px-6 py-4">Capacity</th>
                            <th className="px-6 py-4">Route Schedule</th>
                            <th className="px-6 py-4">Vehicle</th>
                            <th className="px-6 py-4">Assigned Staff</th>
                            <th className="px-6 py-4">Private Note</th>
                            <th className="px-6 py-4 w-[100px] border-l border-border"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-muted-foreground">
                        {data.map((item) => (
                            <tr
                                key={item.id}
                                className={cn(
                                    "hover:bg-muted transition-colors group cursor-pointer",
                                    selectedIds.has(item.id) && "bg-muted"
                                )}
                                onClick={() => isBulkMode ? handleSelectItem(item.id, { stopPropagation: () => { } } as React.MouseEvent) : onEdit?.(item.id, item)}
                            >
                                {isBulkMode && (
                                    <td className="px-4 py-4 align-middle" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(item.id)}
                                            onChange={(e) => handleSelectItem(item.id, e as unknown as React.MouseEvent)}
                                            className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                                        />
                                    </td>
                                )}
                                {/* Status */}
                                <td className="px-6 py-4 align-middle">
                                    <span className={cn(
                                        "px-2 py-1 rounded text-xs font-bold uppercase",
                                        item.online_booking_status === 'open'
                                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                            : "bg-destructive/10 text-destructive border border-destructive/20"
                                    )}>
                                        {item.online_booking_status}
                                    </span>
                                </td>

                                {/* Date */}
                                <td className="px-6 py-4 align-middle">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-foreground flex items-center gap-2">
                                            <Calendar size={14} className="text-primary" />
                                            {(() => {
                                                const [y, m, d] = item.start_date.split('-');
                                                return `${m}-${d}-${y}`;
                                            })()}
                                        </span>
                                        {item.is_repeating && (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <Repeat size={12} />
                                                {item.repeat_days?.join(", ")}
                                            </span>
                                        )}
                                    </div>
                                </td>

                                {/* Start Time */}
                                <td className="px-6 py-4 align-middle">
                                    {item.duration_type === 'all_day' ? (
                                        <span className="text-muted-foreground italic flex items-center gap-2"><Clock size={14} /> All Day</span>
                                    ) : (
                                        <span className="font-medium text-foreground flex items-center gap-2">
                                            <Clock size={14} className="text-primary" />
                                            {new Date(`1970-01-01T${item.start_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                        </span>
                                    )}
                                </td>

                                {/* Duration */}
                                <td className="px-6 py-4 align-middle">
                                    {item.duration_type === 'all_day' ? (
                                        <span className="text-muted-foreground italic">All Day</span>
                                    ) : (
                                        <span className="text-muted-foreground">{item.hours_long} Hours</span>
                                    )}
                                </td>

                                {/* Capacity */}
                                <td className="px-6 py-4 align-middle">
                                    <div className="flex items-center gap-2">
                                        <Users size={14} className="text-muted-foreground" />
                                        <span className={cn(
                                            (item.booked_count || 0) > 0 && "text-primary font-medium"
                                        )}>
                                            {item.booked_count || 0} / {item.max_capacity} pax
                                        </span>
                                    </div>
                                </td>

                                {/* Route Schedule */}
                                <td className="px-6 py-4 align-middle">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin size={14} className="text-muted-foreground" />
                                        <span>{item.route_name || <span className="text-muted-foreground italic">-</span>}</span>
                                    </div>
                                </td>

                                {/* Vehicle */}
                                <td className="px-6 py-4 align-middle">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Bus size={14} className="text-muted-foreground" />
                                        <span>{item.vehicle_name || <span className="text-muted-foreground italic">-</span>}</span>
                                    </div>
                                </td>

                                {/* Staff */}
                                <td className="px-6 py-4 align-middle text-muted-foreground max-w-[200px] truncate" title={item.staff_display}>
                                    {item.staff_display || <span className="text-muted-foreground italic">Unassigned</span>}
                                </td>

                                {/* Private Note */}
                                <td className="px-6 py-4 align-middle text-muted-foreground max-w-[200px] truncate" title={item.private_announcement}>
                                    {item.private_announcement ? (
                                        <div className="flex items-center gap-2">
                                            <StickyNote size={14} className="text-muted-foreground" />
                                            {item.private_announcement}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground italic">-</span>
                                    )}
                                </td>

                                {/* Actions - Last Column */}
                                <td className="px-6 py-4 align-middle border-l border-border">
                                    <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => onEdit?.(item.id, item)}
                                            className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setDeletingItem(item)}
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
            </div>

            <AlertDialog
                isOpen={!!deletingItem}
                onClose={() => setDeletingItem(null)}
                onConfirm={() => {
                    if (deletingItem?.id && (deletingItem.booked_count || 0) === 0) {
                        onDelete(deletingItem.id);
                    }
                    setDeletingItem(null);
                }}
                title={(deletingItem?.booked_count || 0) > 0 ? "Cannot Delete Availability" : "Delete Availability?"}
                description={(deletingItem?.booked_count || 0) > 0
                    ? `This availability has ${deletingItem?.booked_count} active booking(s). To remove this slot, cancel it instead. Bookings must be cancelled or refunded first.`
                    : `Are you sure you want to delete this availability for ${deletingItem?.start_date}? This cannot be undone.`}
                confirmLabel={(deletingItem?.booked_count || 0) > 0 ? "OK" : "Delete"}
                isDestructive={(deletingItem?.booked_count || 0) === 0}
            />
        </>
    );
}

