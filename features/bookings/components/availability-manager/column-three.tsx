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
        <div className="flex flex-col h-full bg-transparent animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
            {/* Fixed Header */}
            <div className="shrink-0 flex items-center gap-2 px-6 py-4 bg-background/95 backdrop-blur border-b border-border sticky top-0 z-10 supports-[backdrop-filter]:bg-background/60">
                <div className="h-8 flex items-center gap-2">
                    <Send size={16} className="text-primary" />
                    <span className="text-base font-bold text-foreground uppercase tracking-wider">Actions</span>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                <div className="space-y-4">
                    {/* Email Entire Tour */}
                    <button
                        onClick={onEmailTour}
                        className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all text-left shadow-sm"
                    >
                        <div className="bg-muted p-2 rounded-full">
                            <Mail size={16} className="text-muted-foreground" />
                        </div>
                        <div>
                            <div className="text-base font-medium text-foreground">Email Entire Tour</div>
                            <div className="text-sm text-muted-foreground">Send update to all participants</div>
                        </div>
                    </button>

                    {/* SMS Entire Tour */}
                    <button
                        onClick={onSmsTour}
                        className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-all text-left shadow-sm"
                    >
                        <div className="bg-muted p-2 rounded-full">
                            <MessageSquare size={16} className="text-muted-foreground" />
                        </div>
                        <div>
                            <div className="text-base font-medium text-foreground">SMS Entire Tour</div>
                            <div className="text-sm text-muted-foreground">Send text to all participants</div>
                        </div>
                    </button>

                    {/* Cancel Tour */}
                    <button
                        onClick={onCancelTour}
                        className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-lg hover:border-amber-500/50 transition-all text-left shadow-sm"
                    >
                        <div className="bg-muted p-2 rounded-full">
                            <XCircle size={16} className="text-amber-500 dark:text-amber-400" />
                        </div>
                        <div>
                            <div className="text-base font-medium text-foreground">Cancel Tour</div>
                            <div className="text-sm text-muted-foreground">Cancel all reservations at once</div>
                        </div>
                    </button>

                    {/* Delete Availability - only shows when no bookings */}
                    {canDelete && (
                        <button
                            onClick={onDeleteAvailability}
                            className="w-full flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg hover:border-destructive/50 transition-all text-left shadow-sm"
                        >
                            <div className="bg-destructive/20 p-2 rounded-full">
                                <Trash2 size={16} className="text-destructive" />
                            </div>
                            <div>
                                <div className="text-base font-medium text-destructive">Delete Availability</div>
                                <div className="text-sm text-muted-foreground">Permanently remove this slot</div>
                            </div>
                        </button>
                    )}
                </div>

            </div>
        </div>

    );
}
