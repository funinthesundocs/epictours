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

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleCollapse, setCollapsed, zoom, zoomIn, zoomOut }}>
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
