"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
    message?: string;
    className?: string;
}

export function LoadingState({ message = "Loading...", className }: LoadingStateProps) {
    return (
        <div className={cn("flex-1 flex items-center justify-center text-zinc-500 gap-2", className)}>
            <Loader2 size={24} className="animate-spin" />
            {message}
        </div>
    );
}
