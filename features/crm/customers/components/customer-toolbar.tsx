"use client";

import { Search, X } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";

interface CustomerToolbarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;

    statusFilter: string;
    onStatusChange: (value: string) => void;

    onReset: () => void;
}

export function CustomerToolbar({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusChange,
    onReset
}: CustomerToolbarProps) {

    // Check if any filter is active
    const isFiltered = (statusFilter && statusFilter !== "All Statuses") || searchQuery;

    // Status Options (including "All")
    const STATUS_CHOICES = ["All Statuses", "Lead", "Customer", "Refund", "Problem"];

    return (
        <div className="flex flex-col md:flex-row items-center gap-3 w-full bg-white/5 border border-white/10 p-2 rounded-xl">

            {/* 1. Search (Grow to fill space) */}
            <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search name, email, phone, hotel, source..."
                    className="w-full h-10 bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-zinc-600"
                />
            </div>

            {/* 2. Filters (Fixed widths or auto) */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">

                {/* Status */}
                <div className="w-40 shrink-0">
                    <CustomSelect
                        value={statusFilter || "All Statuses"}
                        onChange={onStatusChange}
                        options={STATUS_CHOICES}
                        placeholder="Status"
                        className="h-10"
                    />
                </div>

                {/* Reset Button */}
                {isFiltered && (
                    <button
                        onClick={onReset}
                        className="h-10 px-3 flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-white/10 whitespace-nowrap"
                    >
                        <X size={16} />
                        Reset
                    </button>
                )}
            </div>
        </div>
    );
}
