"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronDown, Save, Check, Trash2, X, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    addDays,
    addWeeks,
    addMonths,
    addYears,
    subDays,
    subWeeks,
    subMonths,
    subYears,
    format
} from "date-fns";

interface DateRangePreset {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
}

interface DateRangeManagerProps {
    startDate: Date;
    endDate: Date;
    onRangeChange: (start: Date, end: Date) => void;
    className?: string;
}

// Built-in preset definitions
const getBuiltInPresets = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [
        {
            name: "Today",
            getRange: () => ({ start: today, end: today })
        },
        {
            name: "Tomorrow",
            getRange: () => ({ start: addDays(today, 1), end: addDays(today, 1) })
        },
        {
            name: "Yesterday",
            getRange: () => ({ start: subDays(today, 1), end: subDays(today, 1) })
        },
        { divider: true },
        {
            name: "Next Week",
            getRange: () => ({
                start: startOfWeek(addWeeks(today, 1), { weekStartsOn: 0 }),
                end: endOfWeek(addWeeks(today, 1), { weekStartsOn: 0 })
            })
        },
        {
            name: "Next Month",
            getRange: () => ({
                start: startOfMonth(addMonths(today, 1)),
                end: endOfMonth(addMonths(today, 1))
            })
        },
        {
            name: "Last Week",
            getRange: () => ({
                start: startOfWeek(subWeeks(today, 1), { weekStartsOn: 0 }),
                end: endOfWeek(subWeeks(today, 1), { weekStartsOn: 0 })
            })
        },
        {
            name: "Last Month",
            getRange: () => ({
                start: startOfMonth(subMonths(today, 1)),
                end: endOfMonth(subMonths(today, 1))
            })
        },
        { divider: true },
        {
            name: "Month to Date",
            getRange: () => ({ start: startOfMonth(today), end: today })
        },
        {
            name: "Year to Date",
            getRange: () => ({ start: startOfYear(today), end: today })
        },
        {
            name: "Today to End of Month",
            getRange: () => ({ start: today, end: endOfMonth(today) })
        },
        {
            name: "Today to End of Year",
            getRange: () => ({ start: today, end: endOfYear(today) })
        },
        { divider: true },
        {
            name: "Last Year",
            getRange: () => ({
                start: startOfYear(subYears(today, 1)),
                end: endOfYear(subYears(today, 1))
            })
        },
        {
            name: "This Year",
            getRange: () => ({
                start: startOfYear(today),
                end: endOfYear(today)
            })
        },
        {
            name: "Next Year",
            getRange: () => ({
                start: startOfYear(addYears(today, 1)),
                end: endOfYear(addYears(today, 1))
            })
        }
    ];
};

export function DateRangeManager({ startDate, endDate, onRangeChange, className }: DateRangeManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [customPresets, setCustomPresets] = useState<DateRangePreset[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [newPresetName, setNewPresetName] = useState("");
    const [selectedPresetName, setSelectedPresetName] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const builtInPresets = getBuiltInPresets();

    // Fetch custom presets on mount
    useEffect(() => {
        fetchCustomPresets();
    }, []);

    // Close dropdown when clicking outside
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

    const fetchCustomPresets = async () => {
        try {
            const { data, error } = await supabase
                .from("date_range_presets")
                .select("*")
                .order("name");

            if (error) throw error;
            setCustomPresets(data || []);
        } catch (err) {
            console.error("Error fetching date range presets:", err);
        }
    };

    const handleSavePreset = async () => {
        if (!newPresetName.trim()) return;

        setIsLoading(true);
        try {
            const { data: userData } = await supabase.auth.getUser();

            const { error } = await supabase
                .from("date_range_presets")
                .insert({
                    name: newPresetName.trim(),
                    user_id: userData.user?.id,
                    start_date: format(startDate, "yyyy-MM-dd"),
                    end_date: format(endDate, "yyyy-MM-dd")
                });

            if (error) throw error;

            await fetchCustomPresets();
            setNewPresetName("");
            setIsSaveDialogOpen(false);
            setSelectedPresetName(newPresetName.trim());
        } catch (err) {
            console.error("Error saving date range preset:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectBuiltIn = (preset: { name: string; getRange: () => { start: Date; end: Date } }) => {
        const range = preset.getRange();
        onRangeChange(range.start, range.end);
        setSelectedPresetName(preset.name);
        setIsOpen(false);
    };

    const handleSelectCustom = (preset: DateRangePreset) => {
        onRangeChange(new Date(preset.start_date), new Date(preset.end_date));
        setSelectedPresetName(preset.name);
        setIsOpen(false);
    };

    const handleDeletePreset = async (e: React.MouseEvent, presetId: string) => {
        e.stopPropagation();
        if (!confirm("Delete this date range preset?")) return;

        try {
            const { error } = await supabase
                .from("date_range_presets")
                .delete()
                .eq("id", presetId);

            if (error) throw error;

            await fetchCustomPresets();
            if (customPresets.find(p => p.id === presetId)?.name === selectedPresetName) {
                setSelectedPresetName(null);
            }
        } catch (err) {
            console.error("Error deleting date range preset:", err);
        }
    };

    return (
        <>
            <div ref={dropdownRef} className={cn("relative", className || "w-full")}>
                {/* Dropdown Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "w-full h-8 flex items-center justify-between gap-2 px-3 rounded-lg text-sm font-medium transition-all",
                        "bg-white/5 border border-white/10 hover:bg-white/10",
                        selectedPresetName && selectedPresetName !== "Custom Range" ? "text-cyan-400" : "text-zinc-400"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Calendar size={12} />
                        {selectedPresetName || "Custom Range"}
                    </div>
                    <ChevronDown size={12} className={cn("transition-transform", isOpen && "rotate-180")} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                        {/* Custom Range Option */}
                        <button
                            onClick={() => {
                                setSelectedPresetName("Custom Range");
                                setIsOpen(false);
                            }}
                            className={cn(
                                "w-full flex items-center justify-between px-4 py-2 text-sm transition-colors border-b border-white/10",
                                selectedPresetName === "Custom Range" || !selectedPresetName
                                    ? "bg-cyan-400/10 text-cyan-400"
                                    : "hover:bg-white/5 text-white"
                            )}
                        >
                            <span>Custom Range</span>
                            {(selectedPresetName === "Custom Range" || !selectedPresetName) && <Check size={14} className="text-cyan-400" />}
                        </button>

                        {/* Save Current Range Option */}
                        <button
                            onClick={() => {
                                setIsSaveDialogOpen(true);
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-cyan-400/10 text-cyan-400 transition-colors border-b border-white/10"
                        >
                            <Save size={14} />
                            <span className="font-medium text-sm">Save Current Range</span>
                        </button>

                        {/* Built-in Presets */}
                        <div className="max-h-72 overflow-y-auto">
                            {builtInPresets.map((preset, idx) => {
                                if ('divider' in preset) {
                                    return <div key={`div-${idx}`} className="border-t border-white/10 my-1" />;
                                }
                                const isSelected = selectedPresetName === preset.name;
                                return (
                                    <button
                                        key={preset.name}
                                        onClick={() => handleSelectBuiltIn(preset as any)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-2 text-sm transition-colors",
                                            isSelected
                                                ? "bg-cyan-400/10 text-cyan-400"
                                                : "hover:bg-white/5 text-white"
                                        )}
                                    >
                                        <span>{preset.name}</span>
                                        {isSelected && <Check size={14} className="text-cyan-400" />}
                                    </button>
                                );
                            })}

                            {/* Custom Presets */}
                            {customPresets.length > 0 && (
                                <>
                                    <div className="border-t border-white/10 my-1" />
                                    <div className="px-4 py-1.5 text-xs text-zinc-500 uppercase tracking-wider">
                                        Saved Ranges
                                    </div>
                                    {customPresets.map((preset) => {
                                        const isSelected = selectedPresetName === preset.name;
                                        return (
                                            <div
                                                key={preset.id}
                                                onClick={() => handleSelectCustom(preset)}
                                                className={cn(
                                                    "flex items-center justify-between px-4 py-2 text-sm cursor-pointer transition-colors group",
                                                    isSelected
                                                        ? "bg-cyan-400/10 text-cyan-400"
                                                        : "hover:bg-white/5 text-white"
                                                )}
                                            >
                                                <span>{preset.name}</span>
                                                <div className="flex items-center gap-2">
                                                    {isSelected && <Check size={14} className="text-cyan-400" />}
                                                    <button
                                                        onClick={(e) => handleDeletePreset(e, preset.id)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                                                    >
                                                        <Trash2 size={12} className="text-red-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Save Dialog Modal */}
            {isSaveDialogOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <h3 className="text-lg font-semibold text-white">Save Date Range</h3>
                            <button
                                onClick={() => {
                                    setIsSaveDialogOpen(false);
                                    setNewPresetName("");
                                }}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                            >
                                <X size={20} className="text-zinc-400" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-6">
                            <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                                <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Current Range</div>
                                <div className="text-white font-medium">
                                    {format(startDate, "MMM d, yyyy")} → {format(endDate, "MMM d, yyyy")}
                                </div>
                            </div>
                            <label className="block text-sm text-zinc-400 mb-2">Preset Name</label>
                            <input
                                type="text"
                                value={newPresetName}
                                onChange={(e) => setNewPresetName(e.target.value)}
                                placeholder="e.g., Q1 2025"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && newPresetName.trim()) {
                                        handleSavePreset();
                                    }
                                }}
                            />
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/5">
                            <button
                                onClick={() => {
                                    setIsSaveDialogOpen(false);
                                    setNewPresetName("");
                                }}
                                className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePreset}
                                disabled={!newPresetName.trim() || isLoading}
                                className={cn(
                                    "px-6 py-2 rounded-lg text-sm font-medium transition-all",
                                    newPresetName.trim() && !isLoading
                                        ? "bg-cyan-400 text-black hover:bg-cyan-300"
                                        : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                                )}
                            >
                                {isLoading ? "Saving..." : "Save Range"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
