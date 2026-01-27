"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Availability } from "@/features/availability/components/availability-list-table";
import { Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ColumnOneProps {
    availability: Availability;
    // Expose state for parent/column-three
    onStateChange: (state: {
        hasChanges: boolean;
        isSaving: boolean;
    }) => void;
    saveRef: React.MutableRefObject<(() => Promise<void>) | null>;
}

export function ColumnOne({ availability, onStateChange, saveRef }: ColumnOneProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Form state - initialized from availability
    const [headline, setHeadline] = useState(availability.private_announcement || "");
    const [onlineStatus, setOnlineStatus] = useState<"open" | "closed">(availability.online_booking_status || "open");

    const formatDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return format(new Date(y, m - 1, d), "MMM d, yyyy");
    };

    const formatTime = (timeStr: string | undefined) => {
        if (!timeStr) return "All Day";
        return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    // Track changes and notify parent
    useEffect(() => {
        const changed =
            headline !== (availability.private_announcement || "") ||
            onlineStatus !== (availability.online_booking_status || "open");

        setHasChanges(changed);
        onStateChange({ hasChanges: changed, isSaving });
    }, [headline, onlineStatus, isSaving, availability, onStateChange]);

    // Expose save function to parent
    useEffect(() => {
        saveRef.current = async () => {
            setIsSaving(true);
            try {
                const { error } = await supabase
                    .from('availabilities' as any)
                    .update({
                        private_announcement: headline || null,
                        online_booking_status: onlineStatus,
                    })
                    .eq('id', availability.id);

                if (error) throw error;
                setHasChanges(false);
            } finally {
                setIsSaving(false);
            }
        };
    }, [headline, onlineStatus, availability.id, saveRef]);

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Fixed Header */}
            <div className="shrink-0 px-6 py-4 bg-white/5 backdrop-blur-md border-b border-white/5 sticky top-0 z-10 space-y-4">
                <div className="flex flex-col gap-0.5">
                    <div className="text-lg font-bold text-white uppercase tracking-wider truncate" title={availability.experience_name || ""}>
                        {availability.experience_name || "Unknown Experience"}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                        {availability.id}
                    </div>
                </div>

                {/* Session Details Card (Time/Capacity) */}
                <div className="space-y-3">
                    <div className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Session Details</div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-zinc-500 text-sm uppercase font-bold tracking-wider">Date</div>
                            <div className="text-white font-medium">
                                {formatDate(availability.start_date)}
                            </div>
                        </div>
                        <div>
                            <div className="text-zinc-500 text-sm uppercase font-bold tracking-wider">Time</div>
                            <div className="text-white font-medium">
                                {formatTime(availability.start_time)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transportation and Staff */}
                <div className="space-y-3 border-t border-white/5 pt-4">
                    <div className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Transportation & Staff</div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-zinc-500 text-sm uppercase font-bold tracking-wider">Route</div>
                            <div className="text-white font-medium truncate">
                                {availability.route_name || "—"}
                            </div>
                        </div>
                        <div>
                            <div className="text-zinc-500 text-sm uppercase font-bold tracking-wider">Vehicle</div>
                            <div className="text-white font-medium truncate">
                                {availability.vehicle_name || "—"}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-zinc-500 text-sm uppercase font-bold tracking-wider">Driver</div>
                            <div className="text-white font-medium truncate">
                                {availability.driver_name || "—"}
                            </div>
                        </div>
                        <div>
                            <div className="text-zinc-500 text-sm uppercase font-bold tracking-wider">Guide</div>
                            <div className="text-white font-medium truncate">
                                {availability.guide_name || ""}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-0 space-y-0 custom-scrollbar animate-in fade-in slide-in-from-left-4 duration-500">
                {/* Quick Settings Header - Sticky */}
                <div className="px-6 py-3 border-b border-white/5 bg-black/40 backdrop-blur-sm sticky top-0 z-10 w-full mb-6 relative">
                    <div className="text-xl font-medium text-zinc-400 flex items-center gap-2">
                        <Settings size={20} className="text-cyan-500" />
                        Quick Settings
                    </div>
                </div>

                <div className="px-6 pb-6 space-y-4">
                    {/* Online Status */}
                    <div className="flex items-center justify-between p-3 bg-zinc-900/80 border border-white/10 rounded-lg">
                        <div className="space-y-0.5">
                            <Label className="text-sm text-zinc-400">
                                Online Booking
                            </Label>
                            <div className="text-lg text-zinc-500">
                                {onlineStatus === "open" ? "Available for online booking" : "Not available online"}
                            </div>
                        </div>
                        <Switch
                            checked={onlineStatus === "open"}
                            onCheckedChange={(checked) => setOnlineStatus(checked ? "open" : "closed")}
                            className="data-[state=checked]:bg-cyan-500"
                        />
                    </div>

                    {/* Private Note */}
                    <div className="space-y-2">
                        <Label className="text-zinc-500 text-sm uppercase font-bold tracking-wider">
                            Private Note
                        </Label>
                        <Textarea
                            value={headline}
                            onChange={(e) => setHeadline(e.target.value)}
                            className="bg-zinc-900/80 border-white/10 text-white placeholder:text-zinc-600 focus-visible:border-cyan-500/50 min-h-[80px] text-base"
                            placeholder="Internal note for staff..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
