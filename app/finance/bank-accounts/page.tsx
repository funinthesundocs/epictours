import { PageShell } from "@/components/shell/page-shell";
import { Landmark, TrendingUp, CreditCard } from "lucide-react";

export default function BankPage() {
    return (
        <PageShell
            title="Bank Accounts"
            description="Treasury management and liquidity."
            stats={[
                { label: "Total Liquidity", value: "$245k", icon: Landmark },
                { label: "Cash Flow", value: "+$12k", icon: TrendingUp, trend: "Positive" },
                { label: "Cards Active", value: "4", icon: CreditCard },
            ]}
        />
    );
}
