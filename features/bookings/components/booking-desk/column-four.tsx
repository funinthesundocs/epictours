"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Send, MessageSquare } from "lucide-react";

interface ColumnFourProps {
    onSave: () => void;
    isSaving: boolean;
    canSave: boolean;
}

export function ColumnFour({ onSave, isSaving, canSave }: ColumnFourProps) {
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
                <Button
                    onClick={onSave}
                    disabled={!canSave || isSaving}
                    className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-base"
                >
                    {isSaving ? "Creating Booking..." : "Create Booking"}
                </Button>
            </div>
        </div>
    );
}
