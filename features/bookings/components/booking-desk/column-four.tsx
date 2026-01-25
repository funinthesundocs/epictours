"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Send, MessageSquare, Trash2, AlertTriangle } from "lucide-react";

interface ColumnFourProps {
    onSave: () => void;
    isSaving: boolean;
    canSave: boolean;
    isEditMode?: boolean;
    onDelete?: () => void;
    isDeleting?: boolean;
}

export function ColumnFour({ onSave, isSaving, canSave, isEditMode, onDelete, isDeleting }: ColumnFourProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 delay-300 h-full flex flex-col">
            <h3 className="text-base font-medium text-zinc-400 flex items-center gap-2">
                <Send size={18} className="text-cyan-500" />
                Actions
            </h3>

            <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3 p-4 bg-black/20 border border-white/10 rounded-lg">
                    <div className="bg-zinc-800 p-2 rounded-full">
                        <Mail size={16} className="text-zinc-400" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-white">Email Confirmation</div>
                        <div className="text-xs text-zinc-500">Send automatic receipt to customer</div>
                    </div>
                    {/* Toggle Placeholder */}
                    <div className="ml-auto w-8 h-4 bg-cyan-900 rounded-full relative">
                        <div className="absolute right-0 top-0 w-4 h-4 bg-cyan-500 rounded-full" />
                    </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-black/20 border border-white/10 rounded-lg">
                    <div className="bg-zinc-800 p-2 rounded-full">
                        <MessageSquare size={16} className="text-zinc-400" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-white">SMS Notifications</div>
                        <div className="text-xs text-zinc-500">Send text updates to customer</div>
                    </div>
                    {/* Toggle Placeholder */}
                    <div className="ml-auto w-8 h-4 bg-cyan-900 rounded-full relative">
                        <div className="absolute right-0 top-0 w-4 h-4 bg-cyan-500 rounded-full" />
                    </div>
                </div>
            </div>

            <div className="mt-auto space-y-3">
                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                    <div className="p-4 bg-red-950/50 border border-red-500/30 rounded-lg space-y-3">
                        <div className="flex items-center gap-2 text-red-400">
                            <AlertTriangle size={18} />
                            <span className="font-bold">Delete this booking?</span>
                        </div>
                        <p className="text-sm text-zinc-400">This action cannot be undone.</p>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setShowDeleteConfirm(false)}
                                variant="outline"
                                className="flex-1 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={onDelete}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold"
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Delete Button - Only in Edit Mode */}
                {isEditMode && !showDeleteConfirm && (
                    <Button
                        onClick={() => setShowDeleteConfirm(true)}
                        variant="outline"
                        className="w-full h-10 border-red-500/30 text-red-400 hover:bg-red-950/30 hover:text-red-300"
                    >
                        <Trash2 size={16} className="mr-2" />
                        Delete Booking
                    </Button>
                )}

                <Button
                    onClick={onSave}
                    disabled={!canSave || isSaving}
                    className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-base"
                >
                    {isSaving ? (isEditMode ? "Updating..." : "Creating Booking...") : (isEditMode ? "Update Booking" : "Create Booking")}
                </Button>
            </div>
        </div>
    );
}
