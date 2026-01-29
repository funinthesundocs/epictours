"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";

import { useSidebar } from "@/components/shell/sidebar-context";

interface AlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    isLoading?: boolean;
}

export function AlertDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    isDestructive = false,
    isLoading = false
}: AlertDialogProps) {
    const { isCollapsed } = useSidebar();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    if (!isOpen) return null;

    const content = (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-[left] duration-300 ease-in-out"
            style={{ left: isCollapsed ? "80px" : "240px" }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={isLoading ? undefined : onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-[#09090b] border border-white/10 rounded-xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full shrink-0 ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-cyan-400/10 text-cyan-400'}`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-white leading-none tracking-tight">
                            {title}
                        </h3>
                        <p className="text-sm text-zinc-400">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50
                            ${isDestructive
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 ring-1 ring-red-500/20'
                                : 'bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20 ring-1 ring-cyan-400/20'
                            }`}
                    >
                        {isLoading && <Loader2 size={14} className="animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
}
