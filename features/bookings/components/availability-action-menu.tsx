"use client";

import { useRef, useEffect, useState } from "react";
import { Plus, Settings, FileText, Users } from "lucide-react";
import { Availability } from "@/features/availability/components/availability-list-table";

interface AvailabilityActionMenuProps {
    availability: Availability;
    triggerRect: DOMRect;
    zoom: number;
    onClose: () => void;
    onNewBooking: () => void;
    onActionsSettings: () => void;
    onManifest: () => void;
}

export function AvailabilityActionMenu({
    availability,
    triggerRect,
    zoom,
    onClose,
    onNewBooking,
    onActionsSettings,
    onManifest
}: AvailabilityActionMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number, y: number } | null>(null);

    // Calculate position on mount/resize
    useEffect(() => {
        if (!menuRef.current || !triggerRect) return;

        const menu = menuRef.current;
        const width = menu.offsetWidth;
        const height = menu.offsetHeight;
        const zoomFactor = zoom / 100;

        // Work in Visual/Viewport Pixels for collision detection
        const menuVisualWidth = width * zoomFactor;
        const menuVisualHeight = height * zoomFactor;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Horizontal: Default to right of trigger (Visual)
        let visualX = triggerRect.right;

        // Right Collision Check
        if (visualX + menuVisualWidth > viewportWidth) {
            // Flip to Left (Visual position: Left edge of trigger - menu visual width)
            visualX = triggerRect.left - menuVisualWidth;
        }

        // Vertical: Default to top of trigger (Visual)
        let visualY = triggerRect.top;

        // Bottom Collision Check
        if (visualY + menuVisualHeight > viewportHeight) {
            // Align bottom with trigger bottom (Visual)
            visualY = triggerRect.bottom - menuVisualHeight;
        }

        // Convert Visual Coordinates back to CSS Style Coordinates (Scaled)
        setMenuPosition({
            x: visualX / zoomFactor,
            y: visualY / zoomFactor
        });

    }, [triggerRect, zoom]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    // Close on Escape
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden min-w-[280px]"
            style={{
                left: menuPosition?.x ?? 0,
                top: menuPosition?.y ?? 0,
                opacity: menuPosition ? 1 : 0, // Hide until positioned
                pointerEvents: menuPosition ? "auto" : "none",
            }}
        >
            {/* Header with Experience Info */}
            <div className="px-4 py-3 bg-white/5 border-b border-white/10">
                <div className="text-cyan-400 font-bold text-sm">{availability.experience_name || "Experience"}</div>
                <div className="text-white text-xs mt-0.5">
                    {(() => {
                        const [y, m, d] = availability.start_date.split('-');
                        return `${m}-${d}-${y}`;
                    })()}
                    {availability.start_time && (
                        <span className="ml-2">
                            {new Date(`1970-01-01T${availability.start_time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="py-1">
                <button
                    onClick={() => { onNewBooking(); }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-cyan-400/10 transition-colors text-left"
                >
                    <Plus size={18} className="text-cyan-400" />
                    <span className="text-white font-medium">New Booking</span>
                </button>
                <button
                    onClick={() => { onActionsSettings(); }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-cyan-400/10 transition-colors text-left"
                >
                    <Settings size={18} className="text-zinc-400" />
                    <span className="text-white font-medium">Actions & Settings</span>
                </button>
                <button
                    onClick={() => { onManifest(); }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-cyan-400/10 transition-colors text-left"
                >
                    <FileText size={18} className="text-zinc-400" />
                    <span className="text-white font-medium">Manifest</span>
                </button>
            </div>

            {/* Capacity Summary */}
            <div className="px-4 py-3 bg-white/5 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Users size={14} />
                    <span className="text-cyan-400 font-bold">{availability.booked_count || 0}</span>
                    <span>booked</span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-emerald-400 font-bold">{(availability.max_capacity || 0) - (availability.booked_count || 0)}</span>
                    <span>available</span>
                </div>
            </div>
        </div>
    );
}
