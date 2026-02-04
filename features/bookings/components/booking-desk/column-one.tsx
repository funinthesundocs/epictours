"use client";

import { useState, useEffect } from "react";
import { Availability } from "@/features/availability/components/availability-list-table";
import { Calendar, Check, ChevronsUpDown, Plus, Search, User, Users, Edit2, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Customer, PricingSchedule, PricingTier, PricingRate } from "@/features/bookings/types";
import { Button } from "@/components/ui/button";
import { QuickAddCustomerDialog } from "./quick-add-customer-dialog";
import { Combobox } from "@/components/ui/combobox";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Color options (70% opacity for soft effect)
const COLOR_MAP: Record<string, string> = {
    red: "bg-red-500/70",
    orange: "bg-orange-500/70",
    yellow: "bg-yellow-500/70",
    green: "bg-emerald-500/70",
    blue: "bg-blue-500/70",
    indigo: "bg-indigo-500/70",
    violet: "bg-violet-500/70",
};

import { NewBookingMenu } from "../new-booking-menu";
import { format } from "date-fns";

interface ColumnOneProps {
    availability: Availability;
    customers: Customer[];
    selectedCustomer: Customer | null;
    setSelectedCustomer: (c: Customer | null) => void;
    schedules: PricingSchedule[];
    selectedScheduleId: string | null;
    setSelectedScheduleId: (id: string) => void;
    tiers: PricingTier[];
    selectedTier: string;
    setSelectedTier: (tier: string) => void;
    currentRates: PricingRate[];
    paxCounts: Record<string, number>;
    setPaxCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
    // Note: setPaxCounts type might need to be simpler if I don't want to import React types explicitly or just use (v: ...)
    onCustomerCreated: (c: Customer) => void;
    onCustomerUpdated: (c: Customer) => void;
    isEditMode?: boolean;
    onAvailabilityChange?: (a: Availability) => void;
    // Check-in status for edit mode
    bookingId?: string;
    checkInStatusId?: string | null;
    onCheckInStatusChange?: (statusId: string | null) => void;
}

export function ColumnOne({
    availability,
    customers,
    selectedCustomer,
    setSelectedCustomer,
    schedules,
    selectedScheduleId,
    setSelectedScheduleId,
    tiers,
    selectedTier,
    setSelectedTier,
    currentRates,
    paxCounts,
    setPaxCounts,
    onCustomerCreated,
    onCustomerUpdated,
    isEditMode,
    onAvailabilityChange,
    bookingId,
    checkInStatusId,
    onCheckInStatusChange
}: ColumnOneProps) {

    // UI State (Local)
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
    const [checkInStatuses, setCheckInStatuses] = useState<{ id: string; status: string; color: string }[]>([]);
    const [localCheckInStatusId, setLocalCheckInStatusId] = useState<string | null>(checkInStatusId || null);

    // Fetch check-in statuses
    useEffect(() => {
        const fetchStatuses = async () => {
            const { data } = await supabase.from('check_in_statuses').select('id, status, color').order('created_at', { ascending: true });
            if (data) setCheckInStatuses(data);
        };
        if (isEditMode) fetchStatuses();
    }, [isEditMode]);

    // Sync local state with prop
    useEffect(() => {
        setLocalCheckInStatusId(checkInStatusId || null);
    }, [checkInStatusId]);

    const handleCheckInStatusChange = async (statusId: string | null) => {
        if (!bookingId) return;
        const { error } = await supabase.from('bookings').update({ check_in_status_id: statusId }).eq('id', bookingId);
        if (error) {
            toast.error("Failed to update check-in status");
        } else {
            setLocalCheckInStatusId(statusId);
            onCheckInStatusChange?.(statusId);
        }
    };

    const handlePaxChange = (typeId: string, delta: number) => {
        setPaxCounts(prev => {
            const current = prev[typeId] || 0;
            const next = Math.max(0, current + delta);
            return { ...prev, [typeId]: next };
        });
    };

    return (
        <div className="flex flex-col h-full bg-transparent animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Header & Session Info - Merged Sticky Container */}
            <div className="shrink-0 bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-10 w-full animate-in fade-in slide-in-from-top-2">
                {/* Title Row */}
                <div className="flex items-center gap-2 px-6 py-4">
                    <Users size={16} className="text-primary" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer & Pax</span>
                </div>

                {/* Session Info */}
                <div className="px-6 pb-6 space-y-3">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-wider pb-2">
                        {availability.experience_name || "Unknown Experience"}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Date</div>
                            <div className="text-foreground font-medium">
                                {(() => {
                                    const [y, m, d] = availability.start_date.split('-').map(Number);
                                    return format(new Date(y, m - 1, d), "EEE MMM d, yyyy");
                                })()}
                            </div>
                        </div>
                        <div>
                            <div className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Time</div>
                            <div className="text-foreground font-medium">
                                {availability.start_time ? new Date(`1970-01-01T${availability.start_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'All Day'}
                            </div>
                        </div>
                        <div className="col-span-2 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Capacity</div>
                                    <div className="text-foreground font-medium">
                                        {(Number(availability.booked_count) || 0) + Object.values(paxCounts).reduce((a, b) => a + (Number(b) || 0), 0)} / {availability.max_capacity} Pax
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Remaining</div>
                                    <div className={`font-medium ${Math.max(0, (Number(availability.max_capacity) || 0) - (Number(availability.booked_count) || 0) - Object.values(paxCounts).reduce((a, b) => a + (Number(b) || 0), 0)) <= 5 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {Math.max(0, (Number(availability.max_capacity) || 0) - (Number(availability.booked_count) || 0) - Object.values(paxCounts).reduce((a, b) => a + (Number(b) || 0), 0))} Pax
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-2 pt-2">
                            <div className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Availability ID</div>
                            <div className="text-muted-foreground font-mono text-[10px] truncate" title={availability.id}>{availability.id}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-8">

                    {/* Check-In Status (Edit Mode Only) */}
                    {isEditMode && checkInStatuses.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-base font-medium text-muted-foreground flex items-center gap-2">
                                <UserCheck size={18} className="text-primary" />
                                Check-In Status
                            </label>
                            <select
                                value={localCheckInStatusId || ""}
                                onChange={(e) => handleCheckInStatusChange(e.target.value || null)}
                                className={cn(
                                    "w-full h-10 px-3 rounded-md border border-border text-sm font-medium cursor-pointer [&>option]:bg-zinc-900 [&>option]:text-white",
                                    localCheckInStatusId
                                        ? cn("text-white", COLOR_MAP[checkInStatuses.find(s => s.id === localCheckInStatusId)?.color || "blue"])
                                        : "bg-muted/50 text-foreground"
                                )}
                            >
                                <option value="">Select Status</option>
                                {checkInStatuses.map(status => (
                                    <option key={status.id} value={status.id}>{status.status}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Rescheduling Field (Edit Mode Only) */}
                    {isEditMode && onAvailabilityChange && (
                        <div className="space-y-2">
                            <label className="text-base font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar size={18} className="text-primary" />
                                Reschedule
                            </label>
                            <NewBookingMenu
                                onSelectAvailability={onAvailabilityChange}
                                defaultExperienceId={availability.experience_id}
                            >
                                <button className="w-full flex items-center justify-between p-3 bg-muted/50 border border-border rounded-lg hover:border-primary/50 hover:bg-muted transition-all group group/btn">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-2 rounded-md group-hover/btn:bg-primary/20 text-primary">
                                            <Calendar size={16} />
                                        </div>
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span className="text-sm font-bold text-foreground group-hover/btn:text-primary transition-colors">
                                                {(() => {
                                                    const [y, m, d] = availability.start_date.split('-').map(Number);
                                                    return format(new Date(y, m - 1, d), "EEE MMM d, yyyy");
                                                })()}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {availability.start_time ? new Date(`1970-01-01T${availability.start_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'All Day'}
                                            </span>
                                        </div>
                                    </div>
                                    <Edit2 size={16} className="text-muted-foreground group-hover/btn:text-primary transition-colors" />
                                </button>
                            </NewBookingMenu>
                        </div>
                    )}

                    {/* Customer Search */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-base font-medium text-muted-foreground flex items-center gap-2">
                                <User size={18} className="text-primary" />
                                Customer
                            </label>
                        </div>

                        <div className="flex gap-2">
                            <Combobox
                                value={selectedCustomer?.id}
                                onChange={(val) => {
                                    const customer = customers.find(c => c.id === val);
                                    setSelectedCustomer(customer || null);
                                }}
                                options={customers.map(c => ({ label: c.name, value: c.id }))}
                                placeholder="Search customer..."
                                className="w-full"
                            />
                            {selectedCustomer && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0 bg-transparent border-border text-muted-foreground hover:text-primary hover:border-primary/50"
                                    onClick={() => {
                                        setCustomerToEdit(selectedCustomer);
                                        setShowAddCustomer(true);
                                    }}
                                >
                                    <Edit2 size={16} />
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="icon"
                                className="shrink-0 bg-transparent border-border text-muted-foreground hover:text-primary hover:border-primary/50"
                                onClick={() => {
                                    setCustomerToEdit(null);
                                    setShowAddCustomer(true);
                                }}
                            >
                                <Plus size={16} />
                            </Button>
                        </div>
                    </div>

                    <QuickAddCustomerDialog
                        isOpen={showAddCustomer}
                        onOpenChange={setShowAddCustomer}
                        onCustomerCreated={onCustomerCreated}
                        customerToEdit={customerToEdit}
                        onCustomerUpdated={onCustomerUpdated}
                    />

                    {/* Pricing Schedule Selector */}
                    <div className="space-y-2">
                        <label className="text-base font-medium text-muted-foreground flex items-center gap-2">
                            <Calendar size={18} className="text-primary" />
                            Pricing Schedule
                        </label>
                        <Combobox
                            value={selectedScheduleId || undefined}
                            onChange={(val) => setSelectedScheduleId(val)}
                            options={schedules.map(s => ({
                                label: s.name + (s.id === availability.pricing_schedule_id ? " (Default)" : ""),
                                value: s.id
                            }))}
                            placeholder="Select schedule..."
                        />
                    </div>

                    {/* Rate Tier Select */}
                    <div className="space-y-2">
                        <label className="text-base font-medium text-muted-foreground flex items-center gap-2">
                            <Search size={18} className="text-primary" />
                            Rate Tier
                        </label>
                        <Combobox
                            value={selectedTier}
                            onChange={(val) => setSelectedTier(val)}
                            options={tiers.map(t => ({
                                label: t.name + (t.name === 'Retail' ? " (Default)" : ""),
                                value: t.name
                            }))}
                            placeholder="Select tier..."
                            disabled={tiers.length === 0}
                        />
                    </div>


                    {/* Pax Selector */}
                    <div className="space-y-4">
                        <label className="text-base font-medium text-muted-foreground flex items-center gap-2">
                            <Users size={18} className="text-primary" />
                            Passengers
                        </label>

                        {currentRates.length > 0 ? (
                            <div className="grid gap-3">
                                {currentRates.map((rate) => {
                                    const count = paxCounts[rate.customer_type_id] || 0;
                                    return (
                                        <div key={`${selectedTier}-${rate.customer_type_id}`} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
                                            <div>
                                                <div className="text-base font-bold text-foreground">{rate.customer_type_name}</div>
                                                <div className="text-base text-primary font-mono">${rate.price.toFixed(2)}</div>
                                            </div>
                                            <div className="flex items-center gap-3 bg-background/50 rounded-md p-1 border border-border">
                                                <button
                                                    onClick={() => handlePaxChange(rate.customer_type_id, -1)}
                                                    className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                                    disabled={count === 0}
                                                >
                                                    -
                                                </button>
                                                <span className="w-6 text-center font-bold text-foreground tabular-nums">{count}</span>
                                                <button
                                                    onClick={() => handlePaxChange(rate.customer_type_id, 1)}
                                                    className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg text-sm">
                                No pricing rates found for <strong>{selectedTier}</strong> tier on this schedule.
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}
