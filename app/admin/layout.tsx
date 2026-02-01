"use client";

import { useAuth } from "@/features/auth/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingState } from "@/components/ui/loading-state";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!user?.isPlatformAdmin) {
                router.push("/");
            }
        }
    }, [user, isLoading, router]);

    if (isLoading || !user?.isPlatformAdmin) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <LoadingState />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {children}
        </div>
    );
}
