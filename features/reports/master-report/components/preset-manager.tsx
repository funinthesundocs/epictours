"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronDown, Save, Check, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SortCriteria } from "./sort-manager";
import { ColumnFilters } from "./report-table";

// Preset settings structure
export interface PresetSettings {
    startDate: string;  // ISO date string
    endDate: string;
    dateFilterType: "activity" | "booking";
    searchQuery: string;
    visibleColumns: string[];
    sortCriteria: SortCriteria[];
    columnFilters: { [key: string]: string[] };  // Serialized from Set
}

interface ReportPreset {
    id: string;
    name: string;
    settings: PresetSettings;
    created_at: string;
}

interface PresetManagerProps {
    // Current settings to save
    currentSettings: PresetSettings;
    // Callback when a preset is loaded
    onLoadPreset: (settings: PresetSettings) => void;
}

export function PresetManager({ currentSettings, onLoadPreset }: PresetManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [presets, setPresets] = useState<ReportPreset[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [newPresetName, setNewPresetName] = useState("");
    const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Store the user's settings before loading a preset (for "Current Report" restore)
    const savedCurrentSettingsRef = useRef<PresetSettings | null>(null);
    const [hasSavedCurrentSettings, setHasSavedCurrentSettings] = useState(false);

    // Fetch presets on mount
    useEffect(() => {
        fetchPresets();
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

    const fetchPresets = async () => {
        try {
            const { data, error } = await supabase
                .from("report_presets")
                .select("*")
                .order("name");

            if (error) throw error;
            setPresets(data || []);
        } catch (err) {
            console.error("Error fetching presets:", err);
        }
    };

    const handleSavePreset = async () => {
        if (!newPresetName.trim()) return;

        setIsLoading(true);
        try {
            const { data: userData } = await supabase.auth.getUser();

            const { error } = await supabase
                .from("report_presets")
                .insert({
                    name: newPresetName.trim(),
                    user_id: userData.user?.id,
                    settings: currentSettings
                });

            if (error) {
                console.error("Supabase error:", error.message, error.details, error.hint);
                throw new Error(error.message || "Failed to save preset");
            }

            await fetchPresets();
            setNewPresetName("");
            setIsSaveDialogOpen(false);
        } catch (err: any) {
            console.error("Error saving preset:", err?.message || err);
            alert(`Failed to save preset: ${err?.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadPreset = (preset: ReportPreset) => {
        // Save current settings before loading preset (only if not already saved)
        if (!hasSavedCurrentSettings) {
            savedCurrentSettingsRef.current = { ...currentSettings };
            setHasSavedCurrentSettings(true);
        }

        setSelectedPresetId(preset.id);
        onLoadPreset(preset.settings);
        setIsOpen(false);
    };

    const handleLoadCurrentReport = () => {
        if (savedCurrentSettingsRef.current) {
            onLoadPreset(savedCurrentSettingsRef.current);
            setSelectedPresetId(null);
            setIsOpen(false);
        }
    };

    const handleDeletePreset = async (e: React.MouseEvent, presetId: string) => {
        e.stopPropagation();
        if (!confirm("Delete this preset?")) return;

        try {
            const { error } = await supabase
                .from("report_presets")
                .delete()
                .eq("id", presetId);

            if (error) throw error;

            await fetchPresets();
            if (selectedPresetId === presetId) {
                setSelectedPresetId(null);
            }
        } catch (err) {
            console.error("Error deleting preset:", err);
        }
    };

    return (
        <>
            <div ref={dropdownRef} className="relative">
                {/* Dropdown Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "h-8 px-3 flex items-center gap-2 rounded-lg text-sm font-medium transition-all",
                        "bg-white/5 border border-white/10 hover:bg-white/10",
                        selectedPresetId ? "text-cyan-400" : "text-zinc-300"
                    )}
                >
                    {selectedPresetId
                        ? presets.find(p => p.id === selectedPresetId)?.name || "Select / Save a Preset"
                        : "Select / Save a Preset"
                    }
                    <ChevronDown size={16} className={cn("transition-transform", isOpen && "rotate-180")} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                    <div className="absolute top-full right-0 mt-1 w-72 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                        {/* Save Current Settings Option */}
                        <button
                            onClick={() => {
                                setIsSaveDialogOpen(true);
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-cyan-400/10 text-cyan-400 transition-colors border-b border-white/10"
                        >
                            <Save size={16} />
                            <span className="font-medium">Save Current Settings</span>
                        </button>

                        {/* Current Report Option - shows when user has modified settings after loading a preset */}
                        {hasSavedCurrentSettings && (
                            <button
                                onClick={handleLoadCurrentReport}
                                className={cn(
                                    "w-full flex items-center gap-2 px-4 py-2.5 transition-colors border-b border-white/10",
                                    selectedPresetId === null
                                        ? "bg-cyan-400/10 text-cyan-400"
                                        : "hover:bg-white/5 text-white"
                                )}
                            >
                                {selectedPresetId === null && <Check size={14} className="text-cyan-400" />}
                                <span className="text-sm font-medium">Current Report</span>
                            </button>
                        )}

                        {/* Presets List */}
                        {presets.length === 0 && !hasSavedCurrentSettings ? (
                            <div className="px-4 py-3 text-sm text-zinc-500 text-center">
                                No saved presets
                            </div>
                        ) : (
                            <div className="max-h-64 overflow-y-auto">
                                {presets.map((preset) => (
                                    <div
                                        key={preset.id}
                                        onClick={() => handleLoadPreset(preset)}
                                        className={cn(
                                            "flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors group",
                                            selectedPresetId === preset.id
                                                ? "bg-cyan-400/10 text-cyan-400"
                                                : "hover:bg-white/5 text-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            {selectedPresetId === preset.id && (
                                                <Check size={14} className="text-cyan-400" />
                                            )}
                                            <span className="text-sm">{preset.name}</span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeletePreset(e, preset.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                                        >
                                            <Trash2 size={14} className="text-red-400" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Save Dialog Modal */}
            {isSaveDialogOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <h3 className="text-lg font-semibold text-white">Save Preset</h3>
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
                            <label className="block text-sm text-zinc-400 mb-2">Preset Name</label>
                            <input
                                type="text"
                                value={newPresetName}
                                onChange={(e) => setNewPresetName(e.target.value)}
                                placeholder="e.g., Weekly Summary"
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
                                {isLoading ? "Saving..." : "Save Preset"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
