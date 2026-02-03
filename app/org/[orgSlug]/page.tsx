"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowUpRight, DollarSign, Users, Activity, Ticket, Eye, Settings2 } from "lucide-react";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { useAuth } from "@/features/auth/auth-context";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

/**
 * Organization overview page - uses the Command Center dashboard
 * when viewing an organization via /org/[orgSlug]
 */
export default function OrgOverviewPage() {
    const router = useRouter();
    const params = useParams();
    const orgSlug = params.orgSlug as string;
    const { user, isPlatformAdmin, adminSelectedOrg, effectiveOrganizationId, isLoading } = useAuth();

    // Show nothing while loading
    if (isLoading) {
        return null;
    }

    // Live Stats State
    const [stats, setStats] = useState({
        revenue: 0,
        activeTours: 0,
        pendingBookings: 0,
        waitlist: 0 // Placeholder
    });

    useEffect(() => {
        const fetchStats = async () => {
            if (!effectiveOrganizationId) return;

            try {
                // 1. Revenue & Pending Bookings & Waitlist
                const { data: bookings } = await supabase
                    .from("bookings")
                    .select("total_amount, status")
                    .eq("organization_id", effectiveOrganizationId);

                let revenue = 0;
                let pending = 0;
                let waiting = 0;

                bookings?.forEach((b: any) => {
                    if (b.status !== 'cancelled') {
                        revenue += (b.total_amount || 0);
                    }
                    if (b.status === 'pending') pending++;
                    if (b.status === 'waitlist') waiting++;
                });

                // 2. Active Tours (Experiences)
                const { count: tourCount } = await supabase
                    .from("experiences")
                    .select("*", { count: 'exact', head: true })
                    .eq("organization_id", effectiveOrganizationId)
                    .eq("is_active", true);

                setStats({
                    revenue,
                    activeTours: tourCount || 0,
                    pendingBookings: pending,
                    waitlist: waiting
                });

            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">
                        Command Center
                    </h1>
                    <p className="text-muted-foreground">
                        Welcome back, {user?.name?.split(' ')[0] || 'User'}.
                        {adminSelectedOrg && (
                            <span> Viewing <span className="text-primary font-medium">{adminSelectedOrg.name}</span></span>
                        )}
                    </p>
                </div>
                <div className="flex gap-3">
                    {/* Admin switch button - only visible to platform admins */}
                    {isPlatformAdmin() && adminSelectedOrg && (
                        <Link
                            href={`/admin/organizations/${orgSlug}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors"
                        >
                            <Settings2 size={16} />
                            Admin View
                        </Link>
                    )}
                    <button className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm text-foreground transition-colors">
                        Customize Layout
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-6 rounded-xl hover:border-primary/30 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
                        <DollarSign size={18} className="text-primary group-hover:drop-shadow-[0_0_8px_rgba(var(--color-primary),0.5)] transition-all" />
                    </div>
                    <div className="space-y-1">
                        <span className="text-2xl font-bold text-foreground">{formatCurrency(stats.revenue)}</span>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            Gross volume
                        </p>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-xl hover:border-primary/30 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Active Tours</span>
                        <Activity size={18} className="text-primary group-hover:drop-shadow-[0_0_8px_rgba(var(--color-primary),0.5)] transition-all" />
                    </div>
                    <div className="space-y-1">
                        <span className="text-2xl font-bold text-foreground">{stats.activeTours}</span>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            Live experiences
                        </p>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-xl hover:border-primary/30 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Pending Bookings</span>
                        <Ticket size={18} className="text-primary group-hover:drop-shadow-[0_0_8px_rgba(var(--color-primary),0.5)] transition-all" />
                    </div>
                    <div className="space-y-1">
                        <span className="text-2xl font-bold text-foreground">{stats.pendingBookings}</span>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            Requires action
                        </p>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-xl hover:border-primary/30 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Waitlist</span>
                        <Users size={18} className="text-primary group-hover:drop-shadow-[0_0_8px_rgba(var(--color-primary),0.5)] transition-all" />
                    </div>
                    <div className="space-y-1">
                        <span className="text-2xl font-bold text-foreground">{stats.waitlist}</span>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            Potential customers
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content / Revenue Chart Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card rounded-xl p-6 h-[400px] flex flex-col">
                    <h3 className="text-lg font-semibold text-foreground mb-6">Revenue & Traffic</h3>
                    <div className="flex-1 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50">
                        <p className="text-muted-foreground font-mono text-sm">CHART_VISUALIZATION_MODULE::LOADING</p>
                    </div>
                </div>

                <div className="glass-card rounded-xl p-6 h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                        <a
                            href={`/org/${orgSlug}/settings/activity-log`}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Eye size={14} />
                            View All
                        </a>
                    </div>
                    <RecentActivity />
                </div>
            </div>
        </div>
    );
}
