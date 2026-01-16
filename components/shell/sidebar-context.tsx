"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextType {
    isCollapsed: boolean;
    toggleCollapse: () => void;
    setCollapsed: (val: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
    // Default to false (expanded)
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Persist preference (Optional, good UX)
    useEffect(() => {
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved) {
            setIsCollapsed(saved === "true");
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

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleCollapse, setCollapsed }}>
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
