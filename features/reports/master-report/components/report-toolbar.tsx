"use client";

import { Search, X, RotateCcw } from "lucide-react";
import { ColumnPicker } from "./column-picker";
import { cn } from "@/lib/utils";
import { CustomSelect } from "@/components/ui/custom-select";

interface ReportToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onReset: () => void;
    visibleColumns: string[];
    onToggleColumn: (columnKey: string) => void;
    onResetColumns: () => void;
    onReorderColumns?: (newOrder: string[]) => void;
    totalRecords: number;
    filteredRecords: number;
    // Date range filter props
    startDate: Date;
    endDate: Date;
    onStartDateChange: (date: Date) => void;
    onEndDateChange: (date: Date) => void;
    // Date filter type
    dateFilterType: "activity" | "booking";
    onDateFilterTypeChange: (type: "activity" | "booking") => void;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const years = [2024, 2025, 2026, 2027];

export function ReportToolbar({
    searchQuery,
    onSearchChange,
    onReset,
    visibleColumns,
    onToggleColumn,
    onResetColumns,
    onReorderColumns,
    totalRecords,
    filteredRecords,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    dateFilterType,
    onDateFilterTypeChange
}: ReportToolbarProps) {
    const hasActiveFilters = searchQuery.trim().length > 0;

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                {/* Date Range Selectors - Double Decker */}
                <div className="flex flex-col gap-1 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-bold uppercase tracking-wider w-12">From</span>
                        <CustomSelect value={startDate.getMonth()} options={monthNames.map((m, i) => ({ label: m, value: i }))} onChange={(val) => { const d = new Date(startDate); d.setMonth(val); onStartDateChange(d); }} className="w-[80px] text-sm" />
                        <CustomSelect value={startDate.getDate()} options={Array.from({ length: new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map((d) => ({ label: d.toString(), value: d }))} onChange={(val) => { const d = new Date(startDate); d.setDate(val); onStartDateChange(d); }} className="w-[60px] text-sm" />
                        <CustomSelect value={startDate.getFullYear()} options={years.map((y) => ({ label: y.toString(), value: y }))} onChange={(val) => { const d = new Date(startDate); d.setFullYear(val); onStartDateChange(d); }} className="w-[80px] text-sm text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-white font-bold uppercase tracking-wider w-12">To</span>
                        <CustomSelect value={endDate.getMonth()} options={monthNames.map((m, i) => ({ label: m, value: i }))} onChange={(val) => { const d = new Date(endDate); d.setMonth(val); onEndDateChange(d); }} className="w-[80px] text-sm" />
                        <CustomSelect value={endDate.getDate()} options={Array.from({ length: new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map((d) => ({ label: d.toString(), value: d }))} onChange={(val) => { const d = new Date(endDate); d.setDate(val); onEndDateChange(d); }} className="w-[60px] text-sm" />
                        <CustomSelect value={endDate.getFullYear()} options={years.map((y) => ({ label: y.toString(), value: y }))} onChange={(val) => { const d = new Date(endDate); d.setFullYear(val); onEndDateChange(d); }} className="w-[80px] text-sm text-white" />
                    </div>
                </div>
                {/* Date Filter Type Radio Buttons */}
                <div className="flex flex-col gap-1 shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="dateFilterType"
                            checked={dateFilterType === "activity"}
                            onChange={() => onDateFilterTypeChange("activity")}
                            className="w-4 h-4 accent-cyan-400"
                        />
                        <span className="text-sm text-white">Start Date</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="dateFilterType"
                            checked={dateFilterType === "booking"}
                            onChange={() => onDateFilterTypeChange("booking")}
                            className="w-4 h-4 accent-cyan-400"
                        />
                        <span className="text-sm text-white">Booking Date</span>
                    </label>
                </div>
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search all fields..."
                        className="w-full h-10 pl-10 pr-10 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 text-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Record Count */}
                <div className="text-sm text-zinc-400 whitespace-nowrap">
                    {filteredRecords === totalRecords ? (
                        <span>{totalRecords.toLocaleString()} records</span>
                    ) : (
                        <span>
                            <span className="text-cyan-400">{filteredRecords.toLocaleString()}</span>
                            {" / "}
                            {totalRecords.toLocaleString()} records
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
                {/* Reset Button */}
                {hasActiveFilters && (
                    <button
                        onClick={onReset}
                        className="h-10 px-3 flex items-center gap-2 rounded-lg text-sm font-medium transition-colors bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
                    >
                        <RotateCcw size={14} />
                        Clear
                    </button>
                )}

                {/* Column Picker */}
                <ColumnPicker
                    visibleColumns={visibleColumns}
                    onToggle={onToggleColumn}
                    onReset={onResetColumns}
                    onReorder={onReorderColumns}
                />
            </div>
        </div>
    );
}
