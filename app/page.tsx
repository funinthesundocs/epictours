"use client";

import { ArrowUpRight, DollarSign, Users, Activity, Ticket, Eye } from "lucide-react";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { NewBookingMenu } from "@/features/bookings/components/new-booking-menu";

export default function Home() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
                        Command Center
                    </h1>
                    <p className="text-zinc-400">
                        Welcome back, Operator. System status is <span className="text-cyan-400 font-medium">Nominal</span>.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors">
                        Customize Layout
                    </button>
                    <NewBookingMenu onSelectAvailability={() => { }}>
                        <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-lg text-sm transition-colors shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                            Create Booking
                        </button>
                    </NewBookingMenu>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Revenue", value: "$45,231.89", sub: "+20.1% from last month", icon: DollarSign },
                    { label: "Active Tours", value: "12", sub: "+2 starting today", icon: Activity },
                    { label: "Pending Bookings", value: "24", sub: "Action required", icon: Ticket },
                    { label: "Waitlist", value: "+573", sub: "Since last hour", icon: Users },
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-6 rounded-xl hover:border-cyan-500/30 transition-colors group">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-zinc-400">{stat.label}</span>
                            <stat.icon size={18} className="text-cyan-500 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] transition-all" />
                        </div>
                        <div className="space-y-1">
                            <span className="text-2xl font-bold text-white">{stat.value}</span>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                {stat.sub}
                                <ArrowUpRight size={10} className="text-emerald-400" />
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content / Revenue Chart Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card rounded-xl p-6 h-[400px] flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-6">Revenue & Traffic</h3>
                    <div className="flex-1 border-2 border-dashed border-zinc-800 rounded-lg flex items-center justify-center bg-black/20">
                        <p className="text-zinc-600 font-mono text-sm">CHART_VISUALIZATION_MODULE::LOADING</p>
                    </div>
                </div>

                <div className="glass-card rounded-xl p-6 h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                        <a
                            href="/settings/activity-log"
                            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
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
