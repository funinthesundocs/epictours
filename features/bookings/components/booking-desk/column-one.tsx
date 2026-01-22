"use client";

import { useState } from "react";
import { Availability } from "@/features/availability/components/availability-list-table";
import { Calendar, Check, ChevronsUpDown, Plus, Search, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { QuickAddCustomerDialog } from "./quick-add-customer-dialog";

// Duplicated interfaces to avoid circular dependency with BookingDesk.tsx
interface Customer {
    id: string;
    name: string;
    email: string;
}
interface PricingSchedule {
    id: string;
    name: string;
}
interface PricingTier {
    name: string;
    sort_order: number;
}
interface PricingRate {
    customer_type_id: string;
    price: number;
    tax_percentage: number;
    tier: string;
    customer_type_name?: string;
}

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
    onCustomerCreated
}: ColumnOneProps) {

    // UI State (Local)
    const [openCustomerSearch, setOpenCustomerSearch] = useState(false);
    const [showAddCustomer, setShowAddCustomer] = useState(false); // New state

    const handlePaxChange = (typeId: string, delta: number) => {
        setPaxCounts(prev => {
            const current = prev[typeId] || 0;
            const next = Math.max(0, current + delta);
            return { ...prev, [typeId]: next };
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* Header Info */}
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase text-xs tracking-wider">
                    {availability.experience_name || "Unknown Experience"}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-zinc-500 text-xs uppercase font-bold">Date</div>
                        <div className="text-white font-medium">{availability.start_date}</div>
                    </div>
                    <div>
                        <div className="text-zinc-500 text-xs uppercase font-bold">Time</div>
                        <div className="text-white font-medium">
                            {availability.start_time ? new Date(`1970-01-01T${availability.start_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'All Day'}
                        </div>
                    </div>
                    <div className="col-span-2 border-t border-zinc-800 pt-2 mt-1">
                        <div className="text-zinc-500 text-xs uppercase font-bold">Vehicle</div>
                        <div className="text-white font-medium truncate">{availability.vehicle_name || 'Unassigned'}</div>
                    </div>
                </div>
            </div>

            {/* Customer Search */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                        <User size={16} className="text-cyan-500" />
                        Customer
                    </label>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-cyan-500 hover:text-cyan-400 hover:bg-cyan-950/30 -mr-2"
                        onClick={() => setShowAddCustomer(true)}
                    >
                        <Plus size={12} className="mr-1" />
                        New Customer
                    </Button>
                </div>

                <div className="flex gap-2"> {/* Optional wrapper if I want button inline with input, but label header is cleaner */}
                    <Popover open={openCustomerSearch} onOpenChange={setOpenCustomerSearch}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCustomerSearch}
                                className="w-full justify-between bg-black border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white"
                            >
                                {selectedCustomer ? selectedCustomer.name : "Select customer..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 bg-zinc-950 border-zinc-800">
                            <Command className="bg-transparent">
                                <CommandInput placeholder="Search customers..." className="h-9" />
                                <CommandList>
                                    <CommandEmpty>No customer found.</CommandEmpty>
                                    <CommandGroup>
                                        {customers.map((customer) => (
                                            <CommandItem
                                                key={customer.id}
                                                value={customer.name}
                                                onSelect={() => {
                                                    setSelectedCustomer(customer);
                                                    setOpenCustomerSearch(false);
                                                }}
                                                className="text-white hover:bg-cyan-500/20"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {customer.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <QuickAddCustomerDialog
                isOpen={showAddCustomer}
                onOpenChange={setShowAddCustomer}
                onCustomerCreated={onCustomerCreated}
            />

            {/* Pricing Schedule Selector */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Calendar size={16} className="text-cyan-500" />
                    Pricing Schedule
                </label>
                <select
                    value={selectedScheduleId || ""}
                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                >
                    <option value="" disabled>Select a schedule...</option>
                    {schedules.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            {/* Rate Tier Select */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Search size={16} className="text-cyan-500" />
                    Rate Tier
                </label>
                <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    disabled={tiers.length === 0}
                >
                    {tiers.map(t => (
                        <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                </select>
            </div>


            {/* Pax Selector */}
            <div className="space-y-4">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Users size={16} className="text-cyan-500" />
                    Passengers
                </label>

                {currentRates.length > 0 ? (
                    <div className="grid gap-3">
                        {currentRates.map((rate) => {
                            const count = paxCounts[rate.customer_type_id] || 0;
                            return (
                                <div key={`${selectedTier}-${rate.customer_type_id}`} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                                    <div>
                                        <div className="text-sm font-bold text-white">{rate.customer_type_name}</div>
                                        <div className="text-xs text-cyan-400 font-mono">${rate.price.toFixed(2)}</div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-black rounded-md p-1 border border-zinc-800">
                                        <button
                                            onClick={() => handlePaxChange(rate.customer_type_id, -1)}
                                            className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                                            disabled={count === 0}
                                        >
                                            -
                                        </button>
                                        <span className="w-6 text-center font-bold text-white tabular-nums">{count}</span>
                                        <button
                                            onClick={() => handlePaxChange(rate.customer_type_id, 1)}
                                            className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
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
    );
}
