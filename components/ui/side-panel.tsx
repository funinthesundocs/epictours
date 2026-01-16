"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    width?: string; // Allow custom width, default to 'max-w-md'
}

export function SidePanel({
    isOpen,
    onClose,
    title,
    description,
    children,
    width = "max-w-md"
}: SidePanelProps) {

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
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={`fixed right-0 top-0 z-50 h-full w-full ${width} bg-[#0b1115]/90 border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col`}
                        style={{ backdropFilter: "blur(20px)" }}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between p-6 border-b border-white/5">
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
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
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-cyan-800 scrollbar-track-transparent">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
