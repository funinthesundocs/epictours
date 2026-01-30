"use client";

import { Search, X } from "lucide-react";
import { ColumnPicker } from "./column-picker";

interface CustomerToolbarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onReset: () => void;
    visibleColumns: string[];
    onToggleColumn: (columnKey: string) => void;
    onResetColumns: () => void;
}

export function CustomerToolbar({
    searchQuery,
    onSearchChange,
    onReset,
    visibleColumns,
    onToggleColumn,
    onResetColumns
}: CustomerToolbarProps) {

    const isFiltered = !!searchQuery;

    return (
        <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-2 flex-1 max-w-xl">
                {/* Search Field - Matching other tables */}
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search name, email, phone, hotel, status..."
                        className="w-full h-10 bg-muted border border-border rounded-lg pl-9 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground"
                    />
                </div>

                {/* Reset Button */}
                {isFiltered && (
                    <button
                        onClick={onReset}
                        className="h-10 px-3 flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-border whitespace-nowrap"
                    >
                        <X size={16} />
                        Reset
                    </button>
                )}
            </div>

            {/* Column Picker */}
            <ColumnPicker
                visibleColumns={visibleColumns}
                onToggle={onToggleColumn}
                onReset={onResetColumns}
            />
        </div>
    );
}
