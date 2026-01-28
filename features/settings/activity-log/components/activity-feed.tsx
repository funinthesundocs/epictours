"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Activity, User, Database, Clock, ArrowRight } from "lucide-react";

type ActivityLog = {
    id: string;
    action: string;
    table_name: string;
    record_id: string;
    old_data: any;
    new_data: any;
    created_at: string;
    user_id: string;
    user?: { email: string }; // Joined manually or via view if needed
};

export function ActivityFeed() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        // Basic fetch, in production you'd want pagination
        const { data, error } = await supabase
            .from("activity_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            console.error("Error fetching logs:", error);
        } else {
            setLogs(data as any[]);
        }
        setLoading(false);
    };

    if (loading) {
        return <div className="text-zinc-500 text-sm">Loading activity history...</div>;
    }

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-zinc-500 space-y-4">
                <Activity size={48} className="opacity-20" />
                <p>No recent activity recorded.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {logs.map((log) => (
                <div key={log.id} className="bg-zinc-900/50 border border-white/5 rounded-lg p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                ${log.action === 'INSERT' ? 'bg-emerald-500/20 text-emerald-400' :
                                    log.action === 'UPDATE' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-red-500/20 text-red-400'
                                }`}>
                                {log.action.substring(0, 1)}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white flex items-center gap-2">
                                    <span className="capitalize">{log.action.toLowerCase()}</span>
                                    <span className="text-zinc-500">on</span>
                                    <span className="font-mono text-cyan-400">{log.table_name}</span>
                                </p>
                                <p className="text-xs text-zinc-500 font-mono mt-0.5">
                                    ID: {log.record_id}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-zinc-500 flex items-center gap-1 justify-end">
                                <Clock size={12} />
                                {format(new Date(log.created_at), "MMM d, h:mm a")}
                            </p>
                            <p className="text-xs text-zinc-600 mt-1">
                                User: {log.user_id ? `${log.user_id.substring(0, 8)}...` : 'System'}
                            </p>
                        </div>
                    </div>

                    {/* Diff Preview (Simplified) */}
                    {log.action === 'UPDATE' && log.old_data && log.new_data && (
                        <div className="mt-3 pl-11">
                            <div className="text-xs bg-black/40 rounded p-2 font-mono text-zinc-400 overflow-x-auto">
                                {Object.keys(log.new_data).map(key => {
                                    const oldVal = log.old_data[key];
                                    const newVal = log.new_data[key];
                                    if (JSON.stringify(oldVal) !== JSON.stringify(newVal) && key !== 'updated_at') {
                                        return (
                                            <div key={key} className="flex items-center gap-2">
                                                <span className="text-zinc-500">{key}:</span>
                                                <span className="text-red-900/50 line-through">{String(oldVal).substring(0, 20)}</span>
                                                <ArrowRight size={10} className="text-zinc-600" />
                                                <span className="text-emerald-400">{String(newVal).substring(0, 20)}</span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
