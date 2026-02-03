"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Landmark, TrendingUp, CreditCard, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";

export default function BankPage() {
    const { effectiveOrganizationId } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate fetch
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, [effectiveOrganizationId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <PageShell
            title="Bank Accounts"
            description="Treasury management and liquidity."
            stats={[
                { label: "Total Liquidity", value: "$0.00", icon: Landmark },
                { label: "Cash Flow", value: "+$0.00", icon: TrendingUp, trend: "Positive" },
                { label: "Cards Active", value: "0", icon: CreditCard },
            ]}
        />
    );
}
