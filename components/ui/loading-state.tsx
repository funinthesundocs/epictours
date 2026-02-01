"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
    message?: string;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function LoadingState({ message, className, size = "md" }: LoadingStateProps) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12"
    };

    const glowSizeClasses = {
        sm: "w-8 h-8 -inset-2",
        md: "w-16 h-16 -inset-4",
        lg: "w-24 h-24 -inset-6"
    };

    return (
        <div className={cn("flex-1 h-full flex flex-col items-center justify-center gap-4", className)}>
            <div className="relative flex items-center justify-center">
                <div className={cn("absolute bg-primary/30 blur-2xl rounded-full", glowSizeClasses[size])} />
                <Loader2 className={cn(sizeClasses[size], "text-primary animate-spin relative z-10")} />
            </div>
            {message && <span className="text-sm text-muted-foreground">{message}</span>}
        </div>
    );
}
