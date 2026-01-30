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

    // Dynamic styles - use base sidebar width for backdrop, zoomed width for panel positioning
    // const zoomedSidebarWidth = isCollapsed ? `${80 * zoom / 100}px` : `${240 * zoom / 100}px`;

    // Position classes
    // Standard: Fixed right, explicit width
    // Full Content: Fixed right, top, bottom. Left depends on sidebar.
    const positionClassName = isFullContent
        ? `fixed right-0 top-0 bottom-0 z-[60] flex flex-col bg-background/80 border-l border-border shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-[left] duration-300 ease-in-out`
        : `fixed right-0 top-0 z-[60] h-full w-full ${width} bg-background/80 border-l border-border shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col`;

    // Inline styles for dynamic values
    const panelStyle = isFullContent
        ? { left: "var(--sidebar-width)", width: "auto", backdropFilter: "blur(20px)" }
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
                    {/* Backdrop - Cover entire screen, sidebar overlaps with higher z-index (50) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[40] bg-background/80 backdrop-blur-sm"
                    />

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
                        <div className="flex items-start justify-between p-6 border-b border-border bg-transparent">
                            <div>
                                <h2 className={cn("text-xl font-bold text-foreground tracking-tight", titleClassName)}>{title}</h2>
                                {description && (
                                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content - Scrollable */}
                        <div className={cn("flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent", contentClassName)}>
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
