"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ActivityLog = {
    id: string;
    action: string;
    table_name: string;
    record_id: string;
    old_data: any;
    new_data: any;
    created_at: string;
};

export function RecentActivity() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        const { data, error } = await supabase
            .from("activity_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(12);

        if (error) {
            console.error("Error fetching logs:", error);
        } else {
            setLogs(data as ActivityLog[]);
        }
        setLoading(false);
    };

    // Action Icon component
    const ActionIcon = ({ action }: { action: string }) => {
        if (action === 'INSERT') {
            return <Plus size={14} className="text-emerald-400" />;
        }
        if (action === 'UPDATE') {
            return <Pencil size={14} className="text-cyan-400" />;
        }
        return <Trash2 size={14} className="text-red-400" />;
    };

    // Map action to human-readable text
    const getActionText = (action: string) => {
        if (action === 'INSERT') return 'Created';
        if (action === 'UPDATE') return 'Updated';
        return 'Deleted';
    };

    // Get content type from table name
    const getContentType = (tableName: string) => {
        return tableName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .replace(/s$/, ''); // Remove trailing 's' for singular
    };

    // Get record name from data
    const getRecordName = (log: ActivityLog) => {
        const data = log.new_data || log.old_data || {};
        return data.label || data.title || data.name || data.email || 'Unknown';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-500 gap-2">
                <Loader2 size={16} className="animate-spin" />
                Loading...
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-zinc-500">
                No recent activity
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex-1 min-h-0 space-y-2 overflow-y-auto">
                {logs.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                            <ActionIcon action={log.action} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                                <span className="text-zinc-400">{getContentType(log.table_name)}</span>
                                {' '}
                                <span className="font-medium">{getRecordName(log)}</span>
                                {' '}
                                <span className={
                                    log.action === 'INSERT' ? 'text-emerald-400' :
                                        log.action === 'UPDATE' ? 'text-cyan-400' :
                                            'text-red-400'
                                }>
                                    {getActionText(log.action)}
                                </span>
                            </p>
                            <p className="text-xs text-zinc-500 truncate">
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
