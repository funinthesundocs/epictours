"use client";

import { Button } from "@/components/ui/button";
import { Send, Mail, MessageSquare, XCircle, Trash2, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColumnThreeProps {
    onSave: () => void;
    isSaving: boolean;
    hasChanges: boolean;
    bookingCount: number; // Total bookings (active + cancelled)
    onCancelTour: () => void;
    onDeleteAvailability: () => void;
    onEmailTour: () => void;
    onSmsTour: () => void;
}

export function ColumnThree({
    onSave,
    isSaving,
    hasChanges,
    bookingCount,
    onCancelTour,
    onDeleteAvailability,
    onEmailTour,
    onSmsTour
}: ColumnThreeProps) {
    const canDelete = bookingCount === 0;

    return (
        <div className="flex flex-col h-full bg-[#0b1115] animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
            {/* Fixed Header */}
            <div className="shrink-0 flex items-center gap-2 px-6 py-4 bg-white/5 backdrop-blur-md border-b border-white/5 sticky top-0 z-10">
                <div className="h-8 flex items-center gap-2">
                    <Send size={16} className="text-cyan-400" />
                    <span className="text-sm font-bold text-white uppercase tracking-wider">Actions</span>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                <div className="space-y-4">
                    {/* Email Entire Tour */}
                    <button
                        onClick={onEmailTour}
                        className="w-full flex items-center gap-3 p-4 bg-black/20 border border-white/10 rounded-lg hover:border-cyan-500/30 transition-all text-left"
                    >
                        <div className="bg-zinc-800 p-2 rounded-full">
                            <Mail size={16} className="text-zinc-400" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-white">Email Entire Tour</div>
                            <div className="text-xs text-zinc-500">Send update to all participants</div>
                        </div>
                    </button>

                    {/* SMS Entire Tour */}
                    <button
                        onClick={onSmsTour}
                        className="w-full flex items-center gap-3 p-4 bg-black/20 border border-white/10 rounded-lg hover:border-cyan-500/30 transition-all text-left"
                    >
                        <div className="bg-zinc-800 p-2 rounded-full">
                            <MessageSquare size={16} className="text-zinc-400" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-white">SMS Entire Tour</div>
                            <div className="text-xs text-zinc-500">Send text to all participants</div>
                        </div>
                    </button>

                    {/* Cancel Tour */}
                    <button
                        onClick={onCancelTour}
                        className="w-full flex items-center gap-3 p-4 bg-black/20 border border-white/10 rounded-lg hover:border-amber-500/30 transition-all text-left"
                    >
                        <div className="bg-zinc-800 p-2 rounded-full">
                            <XCircle size={16} className="text-amber-500" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-white">Cancel Tour</div>
                            <div className="text-xs text-zinc-500">Cancel all reservations at once</div>
                        </div>
                    </button>

                    {/* Delete Availability - only shows when no bookings */}
                    {canDelete && (
                        <button
                            onClick={onDeleteAvailability}
                            className="w-full flex items-center gap-3 p-4 bg-black/20 border border-red-500/20 rounded-lg hover:border-red-500/50 transition-all text-left"
                        >
                            <div className="bg-zinc-800 p-2 rounded-full">
                                <Trash2 size={16} className="text-red-500" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-red-400">Delete Availability</div>
                                <div className="text-xs text-zinc-500">Permanently remove this slot</div>
                            </div>
                        </button>
                    )}
                </div>

            </div>
        </div>

    );
}
