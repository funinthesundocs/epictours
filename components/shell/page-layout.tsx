"use client";

import { Sidebar } from "@/components/shell/sidebar";
import { SidebarProvider, useSidebar } from "@/components/shell/sidebar-context";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

// Inner component to consume the context
function PageLayoutContent({ children }: { children: ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <>
            <Sidebar />
            <main
                className={cn(
                    "min-h-screen p-4 lg:p-8 transition-all duration-300 ease-in-out",
                    isCollapsed ? "lg:ml-[80px]" : "lg:ml-[240px]"
                )}
            >
                <div className="w-full space-y-6">
                    {children}
                </div>
            </main>
        </>
    );
}

// Public wrapper that includes the Provider
export function PageLayout({ children }: { children: ReactNode }) {
    return (
        <SidebarProvider>
            <PageLayoutContent>{children}</PageLayoutContent>
        </SidebarProvider>
    );
}
