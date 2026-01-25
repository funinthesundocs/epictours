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
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 delay-300 h-full flex flex-col">
            <h3 className="text-base font-medium text-zinc-400 flex items-center gap-2">
                <Send size={18} className="text-cyan-500" />
                Actions
            </h3>

            <div className="flex-1 space-y-4">
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

            {/* Save Button at Bottom */}
            <div className="mt-auto space-y-3">
                <Button
                    onClick={onSave}
                    disabled={!hasChanges || isSaving}
                    className={cn(
                        "w-full h-12 font-bold text-base",
                        hasChanges && !isSaving
                            ? "bg-cyan-500 hover:bg-cyan-400 text-black"
                            : "bg-zinc-900 text-zinc-600 border border-white/10"
                    )}
                >
                    {isSaving ? (
                        <>
                            <Loader2 size={18} className="animate-spin mr-2" />
                            Saving...
                        </>
                    ) : hasChanges ? (
                        <>
                            <Save size={18} className="mr-2" />
                            Save Changes
                        </>
                    ) : (
                        "No Changes"
                    )}
                </Button>
            </div>
        </div>
    );
}
