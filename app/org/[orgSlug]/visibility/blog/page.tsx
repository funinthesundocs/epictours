"use client";

import { PageShell } from "@/components/shell/page-shell";
import { PenTool, Plus, TrendingUp, FileText, Clock, Globe } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Mock data
const summaryStats = [
    { label: "Active Topics", value: "12", icon: FileText, trend: "+3 this month" },
    { label: "Posts This Month", value: "47", icon: TrendingUp, trend: "+12 from last month" },
    { label: "Pending Jobs", value: "5", icon: Clock, trend: "3 running now" },
    { label: "Connected Sites", value: "2", icon: Globe, trend: "WordPress, Custom" },
];

const recentActivities = [
    { action: "Generated post for 'Hawaii eco tours'", status: "success", time: "2 minutes ago" },
    { action: "Scheduled scrape for 'Honolulu food guides'", status: "pending", time: "15 minutes ago" },
    { action: "Generated post for 'Oahu sunset tours'", status: "success", time: "1 hour ago" },
    { action: "Failed scrape for 'Maui activities'", status: "failed", time: "2 hours ago" },
    { action: "Generated post for 'Waikiki dining'", status: "success", time: "3 hours ago" },
    { action: "Reviewed and approved 'Pearl Harbor history'", status: "success", time: "5 hours ago" },
];

export default function BlogOverviewPage() {
    const params = useParams();
    const orgSlug = params.orgSlug as string;

    const getStatusBadge = (status: string) => {
        const styles = {
            success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
            pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
            failed: "bg-red-500/10 text-red-500 border-red-500/20",
        };
        const labels = { success: "Success", pending: "Pending", failed: "Failed" };

        return (
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    return (
        <PageShell
            title="Blog Manager"
            description="Scrape the web, generate SEO-friendly blog posts, and prepare them for publishing."
            icon={PenTool}
            action={
                <Link href={`/org/${orgSlug}/visibility/blog/topics`}>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm transition-colors">
                        <Plus size={16} /> New Topic & Job
                    </button>
                </Link>
            }
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col"
        >
            <div className="h-full flex flex-col space-y-6 overflow-auto p-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {summaryStats.map((stat, index) => (
                        <div key={index} className="bg-card border border-border rounded-xl p-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <stat.icon className="text-primary" size={24} />
                                <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">{stat.label}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Activity */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-border">
                        <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
                        <p className="text-sm text-muted-foreground">Latest actions and system events</p>
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 backdrop-blur-sm">
                                <tr className="border-b border-border">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {recentActivities.map((activity, index) => (
                                    <tr key={index} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-foreground">{activity.action}</td>
                                        <td className="px-6 py-4">{getStatusBadge(activity.status)}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{activity.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}
