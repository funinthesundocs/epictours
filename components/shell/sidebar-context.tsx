"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextType {
    isCollapsed: boolean;
    toggleCollapse: () => void;
    setCollapsed: (val: boolean) => void;
    // Zoom feature
    zoom: number;
    zoomIn: () => void;
    zoomOut: () => void;
    setZoom: (val: number) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
    // Default to false (expanded)
    const [isCollapsed, setIsCollapsed] = useState(false);
    // Zoom state: default 100%, range 50-150%
    const [zoom, setZoom] = useState(100);

    // Persist preferences
    useEffect(() => {
        const savedCollapsed = localStorage.getItem("sidebar-collapsed");
        if (savedCollapsed) {
            setIsCollapsed(savedCollapsed === "true");
        }
        const savedZoom = localStorage.getItem("app-zoom");
        if (savedZoom) {
            setZoom(Number(savedZoom));
        }
    }, []);

    // Set CSS custom property for fixed element positioning adjustment
    useEffect(() => {
        // Calculate the bottom offset needed for fixed elements when zoomed
        // At 100% zoom, offset is 0. At 150% zoom, offset adjusts for the extra height
        const zoomFactor = zoom / 100;
        const viewportHeight = window.innerHeight;
        const zoomedHeight = viewportHeight * zoomFactor;
        const bottomOffset = zoomedHeight - viewportHeight;

        document.documentElement.style.setProperty('--zoom-bottom-offset', `${bottomOffset}px`);
        document.documentElement.style.setProperty('--zoom-factor', `${zoomFactor}`);
    }, [zoom]);

    // Set Sidebar Width CSS Variable (Centralized source of truth)
    useEffect(() => {
        const baseWidth = isCollapsed ? 80 : 240;
        const scaledWidth = baseWidth * (zoom / 100);
        document.documentElement.style.setProperty('--sidebar-width', `${scaledWidth}px`);
    }, [zoom, isCollapsed]);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebar-collapsed", String(newState));
    };

    const setCollapsed = (val: boolean) => {
        setIsCollapsed(val);
        localStorage.setItem("sidebar-collapsed", String(val));
    };

    const zoomIn = () => {
        setZoom(prev => {
            const newZoom = Math.min(prev + 10, 150);
            localStorage.setItem("app-zoom", String(newZoom));
            return newZoom;
        });
    };

    const zoomOut = () => {
        setZoom(prev => {
            const newZoom = Math.max(prev - 10, 50);
            localStorage.setItem("app-zoom", String(newZoom));
            return newZoom;
        });
    };

    const setZoomValue = (val: number) => {
        const clamped = Math.min(150, Math.max(50, val));
        setZoom(clamped);
        localStorage.setItem("app-zoom", String(clamped));
        // Mark that zoom was changed for resize refresh
        sessionStorage.setItem("zoom-changed", "true");
    };

    // Detect resize and refresh page if zoom was recently changed
    useEffect(() => {
        let resizeTimeout: NodeJS.Timeout;

        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const zoomChanged = sessionStorage.getItem("zoom-changed");
                if (zoomChanged === "true") {
                    sessionStorage.removeItem("zoom-changed");
                    window.location.reload();
                }
            }, 250);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(resizeTimeout);
        };
    }, []);

    // Override Browser Zoom Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    zoomIn();
                } else if (e.key === '-') {
                    e.preventDefault();
                    zoomOut();
                } else if (e.key === '0') {
                    e.preventDefault();
                    setZoomValue(100);
                }
            }
        };

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    zoomIn();
                } else {
                    zoomOut();
                }
            }
        };

        // Note: wheel event with preventDefault needs { passive: false }
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('wheel', handleWheel);
        };
    }, [zoom]); // Re-bind if zoom logic needs fresh closure, though functional updates should be fine. Keep safe.

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleCollapse, setCollapsed, zoom, zoomIn, zoomOut, setZoom: setZoomValue }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
}
