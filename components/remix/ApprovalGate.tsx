"use client";

import { Button } from "@/components/ui/button";
import {
    Check, X, AlertCircle, ShieldCheck, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

interface ApprovalCheckItem {
    label: string;
    satisfied: boolean;
    detail?: string;
}

interface ApprovalGateProps {
    projectId: string;
    orgId: string;
    checks: ApprovalCheckItem[];
    onApproved: () => void;
    disabled?: boolean;
}

/**
 * Approval Gate — Hard stop before generation.
 * Must select title + thumbnail + approve script before proceeding.
 */
export function ApprovalGate({ projectId, orgId, checks, onApproved, disabled }: ApprovalGateProps) {
    const [isApproving, setIsApproving] = useState(false);
    const allSatisfied = checks.every((c) => c.satisfied);

    const handleApprove = async () => {
        if (!allSatisfied) return;
        setIsApproving(true);
        try {
            const res = await fetch(`/api/remix/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "awaiting_approval",
                    approved: true,
                    orgId,
                }),
            });
            if (res.ok) {
                toast.success("Remix approved! Ready for generation.");
                onApproved();
            } else {
                toast.error("Failed to approve");
            }
        } catch {
            toast.error("Failed to approve");
        } finally {
            setIsApproving(false);
        }
    };

    return (
        <div className="border border-border rounded-lg bg-card overflow-hidden">
            {/* Header */}
            <div className={cn(
                "px-4 py-3 flex items-center gap-3 border-b border-border",
                allSatisfied ? "bg-primary/5" : "bg-muted/30"
            )}>
                <ShieldCheck className={cn(
                    "h-5 w-5",
                    allSatisfied ? "text-primary" : "text-muted-foreground"
                )} />
                <div>
                    <h3 className="text-sm font-medium text-foreground">Approval Gate</h3>
                    <p className="text-[10px] text-muted-foreground">
                        All items must be checked before proceeding to asset generation.
                    </p>
                </div>
            </div>

            {/* Checklist */}
            <div className="p-4 space-y-2">
                {checks.map((check, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                            check.satisfied ? "bg-primary/5" : "bg-muted/20"
                        )}
                    >
                        {check.satisfied ? (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                        ) : (
                            <X className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className={cn(
                                "text-xs font-medium",
                                check.satisfied ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {check.label}
                            </p>
                            {check.detail && (
                                <p className="text-[10px] text-muted-foreground truncate">{check.detail}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Action */}
            <div className="px-4 pb-4 pt-1">
                {!allSatisfied && (
                    <div className="flex items-center gap-2 text-xs text-amber-500 mb-3">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>Complete all items above to proceed to asset generation.</span>
                    </div>
                )}
                <Button
                    onClick={handleApprove}
                    disabled={!allSatisfied || isApproving || disabled}
                    className="w-full"
                >
                    {isApproving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <ShieldCheck className="h-4 w-4 mr-2" />
                    )}
                    Approve & Continue to Generation
                </Button>
            </div>
        </div>
    );
}
