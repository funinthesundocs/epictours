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

    if (!isOpen) return null;

    const sidebarWidth = isCollapsed ? "80px" : "240px";

    const content = (
        <>
            {/* Backdrop - z-40 (Behind Sidebar) */}
            <div
                className="fixed inset-0 z-[40] bg-background/80 backdrop-blur-sm transition-opacity"
                onClick={isLoading ? undefined : onClose}
            />

            {/* Modal Container - z-60 (Above Sidebar) */}
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="relative w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto"

                >
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full shrink-0 ${isDestructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                            <AlertTriangle size={24} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-foreground leading-none tracking-tight">
                                {title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50
                                ${isDestructive
                                    ? 'bg-destructive/10 text-destructive hover:bg-destructive/20 ring-1 ring-destructive/20'
                                    : 'bg-primary/10 text-primary hover:bg-primary/20 ring-1 ring-primary/20'
                                }`}
                        >
                            {isLoading && <Loader2 size={14} className="animate-spin" />}
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(content, document.body);
}
