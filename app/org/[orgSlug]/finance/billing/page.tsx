"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Receipt, DollarSign, AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { supabase } from "@/lib/supabase";

export default function BillingPage() {
    const { effectiveOrganizationId } = useAuth();
    const [stats, setStats] = useState({
        outstanding: 0,
        collected: 0,
        invoiceCount: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!effectiveOrganizationId) return;

            try {
                const { data, error } = await supabase
                    .from("bookings")
                    .select("total_amount, amount_paid, payment_status")
                    .eq("organization_id", effectiveOrganizationId);

                if (error) throw error;

                let outstanding = 0;
                let collected = 0;
                let count = 0;

                data?.forEach(booking => {
                    const total = booking.total_amount || 0;
                    const paid = booking.amount_paid || 0;
                    outstanding += (total - paid);
                    collected += paid;
                    count++;
                });

                setStats({ outstanding, collected, invoiceCount: count });
            } catch (err) {
                console.error("Failed to fetch billing stats:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [effectiveOrganizationId]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <PageShell
            title="Billing & Invoices"
            description="Accounts receivable and payable."
            stats={[
                {
                    label: "Outstanding",
                    value: formatCurrency(stats.outstanding),
                    icon: AlertCircle,
                    trend: stats.outstanding > 0 ? "Balance Due" : "All Clear"
                },
                {
                    label: "Collected",
                    value: formatCurrency(stats.collected),
                    icon: DollarSign
                },
                {
                    label: "Invoices Sent",
                    value: stats.invoiceCount.toString(),
                    icon: Receipt
                },
            ]}
        />
    );
}
