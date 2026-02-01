"use client";

import { Sidebar } from "@/components/shell/sidebar";
import { SidebarProvider, useSidebar } from "@/components/shell/sidebar-context";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LoadingState } from "@/components/ui/loading-state";

// Inner component to consume the context
function PageLayoutContent({ children }: { children: ReactNode }) {
    const { isCollapsed, zoom } = useSidebar();
    const { isAuthenticated, isLoading } = useAuth();
    const pathname = usePathname();

    const isLoginPage = pathname === "/login";

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <LoadingState message="Loading..." />
            </div>
        );
    }

    // Login page - no sidebar
    if (isLoginPage) {
        return <>{children}</>;
    }

    // Not authenticated and not on login - auth-context will handle redirect
    if (!isAuthenticated) {
        return null;
    }

    return (
        <>
            <Sidebar />
            <main
                className="min-h-screen p-4 lg:p-8 transition-all duration-300 ease-in-out"
                style={{ marginLeft: "var(--sidebar-width)" }}
            >
                <div
                    className="w-full space-y-6"
                    style={{ zoom: zoom / 100 }}
                >
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
