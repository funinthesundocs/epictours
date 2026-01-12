import { cn } from "@/lib/utils";
import { CustomerStatus } from "../types";

const statusStyles: Record<string, string> = {
    "Customer": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "Lead": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    "Refund": "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "Problem": "bg-red-500/10 text-red-400 border-red-500/20",
};

export function StatusBadge({ status }: { status: string }) {
    // 1. Try exact match
    // 2. Fallback to Zinc (Gray)
    const style = statusStyles[status] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";

    return (
        <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium border",
            style
        )}>
            {status}
        </span>
    );
}
