"use client";

import { MessageSquare } from "lucide-react";

interface ColumnTwoProps {
    notes: string;
    setNotes: (notes: string) => void;
}

export function ColumnTwo({ notes, setNotes }: ColumnTwoProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 delay-100 flex flex-col h-full">
            <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <MessageSquare size={16} className="text-cyan-500" />
                Notes & Requests
            </h3>

            <div className="space-y-2 flex-1">
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any special requests, dietary restrictions, or notes here..."
                    className="w-full h-full min-h-[200px] bg-black border border-zinc-800 rounded-lg p-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500 resize-none"
                />
            </div>
        </div>
    );
}
