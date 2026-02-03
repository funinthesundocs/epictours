"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Handshake, Users, Award, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { supabase } from "@/lib/supabase";

export default function PartnersPage() {
    const { effectiveOrganizationId } = useAuth();
    const [stats, setStats] = useState({
        activePartners: 0,
        referrals: 0,
        topPartner: "-"
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!effectiveOrganizationId) return;

            try {
                // Count active partners from cross_organization_access
                const { count: partnerCount, error } = await supabase
                    .from("cross_organization_access")
                    .select("*", { count: 'exact', head: true })
                    .eq("host_organization_id", effectiveOrganizationId)
                    .eq("relationship_type", "partner")
                    .eq("status", "active");

                if (error) throw error;

                setStats({
                    activePartners: partnerCount || 0,
                    referrals: 0, // Placeholder - need referral system
                    topPartner: "None" // Placeholder
                });
            } catch (err) {
                console.error("Failed to fetch partner stats:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
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
            title="Partners & Affiliates"
            description="Manage strategic relationships."
            stats={[
                { label: "Active Partners", value: stats.activePartners.toString(), icon: Handshake },
                { label: "Referrals", value: stats.referrals.toString(), icon: Users },
                { label: "Top Partner", value: stats.topPartner, icon: Award },
            ]}
        />
    );
}
