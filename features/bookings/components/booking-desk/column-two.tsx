"use client";

import { BookingOption, BookingOptionSchedule } from "@/features/bookings/types";
import { Settings } from "lucide-react";

interface ColumnTwoProps {
    // Options
    optionSchedules: BookingOptionSchedule[];
    selectedOptionScheduleId: string | null;
    setSelectedOptionScheduleId: (id: string | null) => void;
    selectedVariation: string;
    setSelectedVariation: (v: string) => void;
    currentOptions: BookingOption[];
}

export function ColumnTwo({
    optionSchedules, selectedOptionScheduleId, setSelectedOptionScheduleId,
    selectedVariation, setSelectedVariation,
    currentOptions
}: ColumnTwoProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 delay-100 flex flex-col h-full">

            {/* Header */}
            <h3 className="text-sm font-medium text-red-500 flex items-center gap-2 bg-red-900/20 p-2 rounded">
                <Settings size={16} className="text-red-500" />
                DEBUG MODE ACTIVE
            </h3>
            {console.log("ColumnTwo Options Data:", currentOptions)}

            {/* Controls */}
            <div className="space-y-4">
                {/* Schedule Selector */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Option Schedule</label>
                    <div className="relative">
                        <select
                            value={selectedOptionScheduleId || ""}
                            onChange={(e) => setSelectedOptionScheduleId(e.target.value || null)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-white appearance-none focus:outline-none focus:border-cyan-500 transition-colors"
                        >
                            <option value="">-- No Options --</option>
                            {optionSchedules.map(sch => (
                                <option key={sch.id} value={sch.id}>{sch.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Variation Selector (Only show if schedule selected) */}
                {selectedOptionScheduleId && (
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Variation</label>
                        <select
                            value={selectedVariation}
                            onChange={(e) => setSelectedVariation(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-sm text-white appearance-none focus:outline-none focus:border-cyan-500 transition-colors"
                        >
                            <option value="retail">Retail</option>
                            <option value="online">Online</option>
                            <option value="special">Special</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {selectedOptionScheduleId && currentOptions.length === 0 && (
                    <div className="text-zinc-500 text-xs italic p-2 border border-dashed border-zinc-800 rounded">
                        No options configured for this variation.
                    </div>
                )}

                {currentOptions.map(opt => (
                    <div key={opt.id || Math.random()} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors">
                        {/* DEBUG: Show raw data to identify correct keys */}
                        <pre className="text-[10px] text-red-400 font-mono mb-2 whitespace-pre-wrap">
                            {JSON.stringify(opt, null, 2)}
                        </pre>

                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-sm font-medium text-white">{opt.label || (opt as any).name || (opt as any).title || "No Label"}</div>
                                {(opt.description || (opt as any).desc) && (
                                    <div className="text-xs text-zinc-500 mt-0.5">{opt.description || (opt as any).desc}</div>
                                )}
                            </div>
                            <div className="text-sm font-semibold text-cyan-400">
                                ${opt.price || (opt as any).cost || (opt as any).amount || 0}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
