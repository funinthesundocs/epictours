"use client";

import { useState, useRef, useEffect } from "react";
import { Columns3, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type ColumnConfig = {
    key: string;
    label: string;
    sortKey?: string;
    alwaysVisible?: boolean; // Name and Actions should always be visible
};

// Default column configuration for customers table
export const CUSTOMER_COLUMNS: ColumnConfig[] = [
    { key: "name", label: "Full Name", sortKey: "name", alwaysVisible: true },
    { key: "email", label: "Email", sortKey: "email" },
    { key: "phone", label: "Cell", sortKey: "phone" },
    { key: "hotel", label: "Hotel", sortKey: "hotel" },
    { key: "app", label: "App", sortKey: "app" },
    { key: "source", label: "Source", sortKey: "source" },
    { key: "status", label: "Status", sortKey: "status" },
    { key: "total_value", label: "AP", sortKey: "total_value" },
];

// Default visible columns
export const DEFAULT_VISIBLE_COLUMNS = ["name", "email", "phone", "hotel", "status", "total_value"];

const STORAGE_KEY = "customer-visible-columns";

export function useColumnVisibility() {
    const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Always ensure 'name' is included
                    if (!parsed.includes("name")) {
                        parsed.unshift("name");
                    }
                    setVisibleColumns(parsed);
                }
            } catch (e) {
                // Invalid JSON, use defaults
            }
        }
    }, []);

    // Save to localStorage on change
    const updateVisibleColumns = (columns: string[]) => {
        // Always ensure 'name' is included
        if (!columns.includes("name")) {
            columns = ["name", ...columns];
        }
        setVisibleColumns(columns);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
    };

    const toggleColumn = (columnKey: string) => {
        if (columnKey === "name") return; // Can't toggle name off

        if (visibleColumns.includes(columnKey)) {
            updateVisibleColumns(visibleColumns.filter(c => c !== columnKey));
        } else {
            updateVisibleColumns([...visibleColumns, columnKey]);
        }
    };

    const resetToDefault = () => {
        updateVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
    };

    const isColumnVisible = (columnKey: string) => visibleColumns.includes(columnKey);

    return { visibleColumns, toggleColumn, resetToDefault, isColumnVisible };
}

interface ColumnPickerProps {
    visibleColumns: string[];
    onToggle: (columnKey: string) => void;
    onReset: () => void;
}

export function ColumnPicker({ visibleColumns, onToggle, onReset }: ColumnPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const isDefault = JSON.stringify([...visibleColumns].sort()) === JSON.stringify([...DEFAULT_VISIBLE_COLUMNS].sort());

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-10 px-3 flex items-center gap-2 rounded-lg text-sm font-medium transition-colors border whitespace-nowrap",
                    isOpen
                        ? "bg-white/10 border-white/20 text-white"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
                )}
            >
                <Columns3 size={16} />
                Columns
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#0b1115] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-2 space-y-1">
                        {CUSTOMER_COLUMNS.map((column) => (
                            <button
                                key={column.key}
                                onClick={() => onToggle(column.key)}
                                disabled={column.alwaysVisible}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                                    column.alwaysVisible
                                        ? "text-zinc-500 cursor-not-allowed"
                                        : "text-zinc-300 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                    visibleColumns.includes(column.key)
                                        ? "bg-cyan-500 border-cyan-500"
                                        : "border-white/20"
                                )}>
                                    {visibleColumns.includes(column.key) && (
                                        <Check size={12} className="text-white" />
                                    )}
                                </div>
                                {column.label}
                            </button>
                        ))}
                    </div>

                    {!isDefault && (
                        <>
                            <div className="border-t border-white/10" />
                            <div className="p-2">
                                <button
                                    onClick={() => {
                                        onReset();
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    <RotateCcw size={14} />
                                    Reset to Default
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
