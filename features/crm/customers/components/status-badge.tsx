import { cn } from "@/lib/utils";
import { CustomerStatus } from "../types";

const statusStyles: Record<CustomerStatus, string> = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    lead: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    inactive: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    archived: "bg-red-500/10 text-red-400 border-red-500/20",
};

export function StatusBadge({ status }: { status: CustomerStatus }) {
    return (
        <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium border",
            statusStyles[status]
        )}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}
