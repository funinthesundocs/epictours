"use client";

import { useState, useEffect } from "react";
import { Availability } from "@/features/availability/components/availability-list-table";
import { Calendar, Check, ChevronsUpDown, Plus, Search, User, Users, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Customer, PricingSchedule, PricingTier, PricingRate } from "@/features/bookings/types";
import { Button } from "@/components/ui/button";
import { QuickAddCustomerDialog } from "./quick-add-customer-dialog";
import { Combobox } from "@/components/ui/combobox";



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
    onAvailabilityChange
}: ColumnOneProps) {

    // UI State (Local)
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

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
            <div className="shrink-0 bg-white/5 backdrop-blur-md border-b border-white/5 sticky top-0 z-10 w-full animate-in fade-in slide-in-from-top-2">
                {/* Title Row */}
                <div className="flex items-center gap-2 px-6 py-4">
                    <Users size={16} className="text-cyan-500" />
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Customer & Pax</span>
                </div>

                {/* Session Info */}
                <div className="px-6 pb-6 space-y-3">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-xs tracking-wider pb-2">
                        {availability.experience_name || "Unknown Experience"}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Date</div>
                            <div className="text-white font-medium">
                                {(() => {
                                    const [y, m, d] = availability.start_date.split('-').map(Number);
                                    return format(new Date(y, m - 1, d), "EEE MMM d, yyyy");
                                })()}
                            </div>
                        </div>
                        <div>
                            <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Time</div>
                            <div className="text-white font-medium">
                                {availability.start_time ? new Date(`1970-01-01T${availability.start_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'All Day'}
                            </div>
                        </div>
                        <div className="col-span-2 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Capacity</div>
                                    <div className="text-white font-medium">
                                        {(availability.booked_count || 0) + Object.values(paxCounts).reduce((a, b) => a + b, 0)} / {availability.max_capacity} Pax
                                    </div>
                                </div>
                                <div>
                                    <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Remaining</div>
                                    <div className={`font-medium ${Math.max(0, availability.max_capacity - (availability.booked_count || 0) - Object.values(paxCounts).reduce((a, b) => a + b, 0)) <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        {Math.max(0, availability.max_capacity - (availability.booked_count || 0) - Object.values(paxCounts).reduce((a, b) => a + b, 0))} Pax
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-2 pt-2">
                            <div className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Availability ID</div>
                            <div className="text-zinc-400 font-mono text-[10px] truncate" title={availability.id}>{availability.id}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-8">

                    {/* Rescheduling Field (Edit Mode Only) */}
                    {isEditMode && onAvailabilityChange && (
                        <div className="space-y-2">
                            <label className="text-base font-medium text-zinc-400 flex items-center gap-2">
                                <Calendar size={18} className="text-cyan-500" />
                                Reschedule
                            </label>
                            <NewBookingMenu
                                onSelectAvailability={onAvailabilityChange}
                                defaultExperienceId={availability.experience_id}
                            >
                                <button className="w-full flex items-center justify-between p-3 bg-zinc-900/80 border border-white/10 rounded-lg hover:border-cyan-500/50 hover:bg-zinc-900 transition-all group group/btn">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-cyan-500/10 p-2 rounded-md group-hover/btn:bg-cyan-500/20 text-cyan-400">
                                            <Calendar size={16} />
                                        </div>
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span className="text-sm font-bold text-white group-hover/btn:text-cyan-400 transition-colors">
                                                {(() => {
                                                    const [y, m, d] = availability.start_date.split('-').map(Number);
                                                    return format(new Date(y, m - 1, d), "EEE MMM d, yyyy");
                                                })()}
                                            </span>
                                            <span className="text-xs text-zinc-400">
                                                {availability.start_time ? new Date(`1970-01-01T${availability.start_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'All Day'}
                                            </span>
                                        </div>
                                    </div>
                                    <Edit2 size={16} className="text-zinc-600 group-hover/btn:text-cyan-500 transition-colors" />
                                </button>
                            </NewBookingMenu>
                        </div>
                    )}

                    {/* Customer Search */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-base font-medium text-zinc-400 flex items-center gap-2">
                                <User size={18} className="text-cyan-500" />
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
                                    className="shrink-0 bg-transparent border-white/10 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/50"
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
                                className="shrink-0 bg-transparent border-white/10 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/50"
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
                        <label className="text-base font-medium text-zinc-400 flex items-center gap-2">
                            <Calendar size={18} className="text-cyan-500" />
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
                        <label className="text-base font-medium text-zinc-400 flex items-center gap-2">
                            <Search size={18} className="text-cyan-500" />
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
                        <label className="text-base font-medium text-zinc-400 flex items-center gap-2">
                            <Users size={18} className="text-cyan-500" />
                            Passengers
                        </label>

                        {currentRates.length > 0 ? (
                            <div className="grid gap-3">
                                {currentRates.map((rate) => {
                                    const count = paxCounts[rate.customer_type_id] || 0;
                                    return (
                                        <div key={`${selectedTier}-${rate.customer_type_id}`} className="flex items-center justify-between p-3 bg-zinc-900/80 rounded-lg border border-white/10">
                                            <div>
                                                <div className="text-base font-bold text-white">{rate.customer_type_name}</div>
                                                <div className="text-base text-cyan-400 font-mono">${rate.price.toFixed(2)}</div>
                                            </div>
                                            <div className="flex items-center gap-3 bg-black/20 rounded-md p-1 border border-white/10">
                                                <button
                                                    onClick={() => handlePaxChange(rate.customer_type_id, -1)}
                                                    className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 rounded transition-colors"
                                                    disabled={count === 0}
                                                >
                                                    -
                                                </button>
                                                <span className="w-6 text-center font-bold text-white tabular-nums">{count}</span>
                                                <button
                                                    onClick={() => handlePaxChange(rate.customer_type_id, 1)}
                                                    className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 rounded transition-colors"
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
