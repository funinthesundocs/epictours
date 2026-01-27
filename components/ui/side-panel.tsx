"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useSidebar } from "@/components/shell/sidebar-context";

import { cn } from "@/lib/utils";

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    width?: string; // Allow custom width, default to 'max-w-md'. Pass "full-content" for main area coverage.
    contentClassName?: string;
    titleClassName?: string;
}

export function SidePanel({
    isOpen,
    onClose,
    title,
    description,
    children,
    width = "max-w-md",
    contentClassName = "p-6",
    titleClassName
}: SidePanelProps) {
    // Access sidebar state to determine offset for "full-content" mode
    const { isCollapsed } = useSidebar();

    // Check if we are in "full-content" mode
    const isFullContent = width === "full-content";

    // Dynamic styles
    const sidebarWidth = isCollapsed ? "80px" : "240px";

    // Position classes
    // Standard: Fixed right, explicit width
    // Full Content: Fixed right, top, bottom. Left depends on sidebar.
    const positionClassName = isFullContent
        ? `fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-zinc-950/80 border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-[left] duration-300 ease-in-out`
        : `fixed right-0 top-0 z-50 h-full w-full ${width} bg-zinc-950/80 border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col`;

    // Inline styles for dynamic values
    const panelStyle = isFullContent
        ? { left: sidebarWidth, width: "auto", backdropFilter: "blur(20px)" }
        : { backdropFilter: "blur(20px)" };

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => { document.body.style.overflow = "unset"; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop - Only show if NOT full content mode */}
                    {!isFullContent && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed right-0 top-0 bottom-0 z-40 bg-zinc-950/60 backdrop-blur-sm transition-[left] duration-300 ease-in-out"
                            style={{ left: sidebarWidth }}
                        />
                    )}

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={positionClassName}
                        style={panelStyle}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-white/5 bg-transparent">
                            <div>
                                <h2 className={cn("text-xl font-bold text-white tracking-tight", titleClassName)}>{title}</h2>
                                {description && (
                                    <p className="text-sm text-zinc-400 mt-1">{description}</p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content - Scrollable */}
                        <div className={cn("flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-800 scrollbar-track-transparent", contentClassName)}>
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
