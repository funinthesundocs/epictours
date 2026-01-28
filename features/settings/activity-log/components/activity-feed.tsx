"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Activity, Clock, ArrowRight, Loader2, Search, X, Plus, Pencil, Trash2, AlertTriangle, Trash } from "lucide-react";
import { differenceInDays, subDays } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useVirtualizer } from "@tanstack/react-virtual";

type ActivityLog = {
    id: string;
    action: string;
    table_name: string;
    record_id: string;
    old_data: any;
    new_data: any;
    created_at: string;
    user_id: string;
    user?: { email: string };
};

// Helper to format phone numbers
const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
};

export function ActivityFeed() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [oldestLogDate, setOldestLogDate] = useState<Date | null>(null);
    const [purging, setPurging] = useState(false);
    const [showPurgeDialog, setShowPurgeDialog] = useState(false);
    const THRESHOLD_DAYS = 120;
    const KEEP_DAYS = 30;
    const MAX_RECORDS = 5000;

    // Debounce Ref
    const searchTimeoutRef = useRef<NodeJS.Timeout>(null);
    const parentRef = useRef<HTMLDivElement>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);

        let query = supabase
            .from("activity_logs")
            .select("*", { count: 'exact' })
            .order("created_at", { ascending: false });

        // Apply search filter - searches Item (table_name), Action, and Record Name (in JSONB)
        if (searchQuery) {
            const q = searchQuery.toLowerCase().replace(/[(),]/g, " ").trim();

            // Map user-friendly terms to action values (all variations)
            const actionKeywords: Record<string, string> = {
                // INSERT variations
                'create': 'INSERT',
                'created': 'INSERT',
                'new': 'INSERT',
                'add': 'INSERT',
                'added': 'INSERT',
                'insert': 'INSERT',
                // DELETE variations
                'delete': 'DELETE',
                'deleted': 'DELETE',
                'remove': 'DELETE',
                'removed': 'DELETE',
                // UPDATE variations
                'update': 'UPDATE',
                'updated': 'UPDATE',
                'edit': 'UPDATE',
                'edited': 'UPDATE',
                'change': 'UPDATE',
                'changed': 'UPDATE',
                'modify': 'UPDATE',
                'modified': 'UPDATE',
            };

            // Check if search term matches or STARTS any action keyword (smart partial match)
            const matchingAction = Object.entries(actionKeywords).find(([keyword]) =>
                keyword.startsWith(q) || q === keyword
            );

            if (matchingAction) {
                query = query.eq('action', matchingAction[1]);
            } else if (q) {
                // Search across table_name, action, and name fields in JSONB data
                query = query.or(`table_name.ilike.%${q}%,action.ilike.%${q}%,new_data->>name.ilike.%${q}%,old_data->>name.ilike.%${q}%,new_data->>label.ilike.%${q}%,old_data->>label.ilike.%${q}%,new_data->>title.ilike.%${q}%,old_data->>title.ilike.%${q}%`);
            }
        }

        // Limit for virtual scrolling
        query = query.limit(MAX_RECORDS);

        const { data, error, count } = await query;

        if (error) {
            console.error("Error fetching logs:", error);
        } else {
            // Filter out pricing_variations UPDATE logs (sort order changes)
            const filteredData = (data as any[]).filter(log =>
                !(log.table_name === 'pricing_variations' && log.action === 'UPDATE')
            );
            setLogs(filteredData);
            if (count !== null) {
                setTotalItems(count);
            }
        }
        setLoading(false);
    }, [searchQuery]);

    // Effect: Trigger Fetch on changes (Debounced Search)
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        searchTimeoutRef.current = setTimeout(() => {
            fetchLogs();
        }, 500); // 500ms debounce

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [fetchLogs]);

    // Fetch oldest log date for purge countdown
    const fetchOldestLog = useCallback(async () => {
        const { data } = await supabase
            .from("activity_logs")
            .select("created_at")
            .order("created_at", { ascending: true })
            .limit(1)
            .single();

        if (data?.created_at) {
            setOldestLogDate(new Date(data.created_at));
        }
    }, []);

    useEffect(() => {
        fetchOldestLog();
    }, [fetchOldestLog]);

    // Purge old logs (keep only last 30 days)
    const handlePurge = async () => {
        setShowPurgeDialog(false);

        setPurging(true);
        const cutoffDate = subDays(new Date(), KEEP_DAYS);

        const { error, count } = await supabase
            .from("activity_logs")
            .delete()
            .lt("created_at", cutoffDate.toISOString());

        setPurging(false);

        if (error) {
            toast.error("Failed to purge logs: " + error.message);
        } else {
            toast.success(`Purged old activity logs`);
            fetchLogs();
            fetchOldestLog();
        }
    };

    // Calculate purge status
    const getPurgeStatus = () => {
        if (!oldestLogDate) return null;

        const daysSinceOldest = differenceInDays(new Date(), oldestLogDate);
        const daysUntilThreshold = THRESHOLD_DAYS - daysSinceOldest;

        if (daysUntilThreshold <= 0) {
            return { overdue: true, days: Math.abs(daysUntilThreshold) };
        }
        return { overdue: false, days: daysUntilThreshold };
    };

    const purgeStatus = getPurgeStatus();

    const handleReset = () => {
        setSearchQuery("");
    };

    const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
        return Object.keys(obj || {}).reduce((acc: Record<string, any>, k) => {
            const pre = prefix.length ? prefix + '.' : '';
            if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
                Object.assign(acc, flattenObject(obj[k], pre + k));
            } else {
                acc[pre + k] = obj[k];
            }
            return acc;
        }, {});
    };

    const renderDiff = (log: ActivityLog) => {
        // Humanize table name for display
        const contentType = log.table_name
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .replace(/s$/, ''); // Remove trailing 's' for singular

        if (log.action === 'DELETE' && log.old_data) {
            return <span className="text-red-400">{contentType} Deleted</span>;
        }
        if (log.action === 'INSERT') {
            return <span className="text-emerald-400">{contentType} Created</span>;
        }
        if (!log.old_data || !log.new_data) return <span className="text-zinc-500">-</span>;

        const flatOld = flattenObject(log.old_data);
        const flatNew = flattenObject(log.new_data);

        const allKeys = Array.from(new Set([...Object.keys(flatOld), ...Object.keys(flatNew)]));

        // Map technical field names to human-readable labels
        const humanizeFieldName = (key: string): string => {
            // Common field mappings
            const fieldMap: Record<string, string> = {
                // Settings fields
                'settings.min': 'Minimum',
                'settings.max': 'Maximum',
                'settings.start': 'Start',
                'settings.end': 'End',
                'settings.default': 'Default Value',
                'settings.required': 'Required',
                'settings.multi_select_style': 'Layout Style',
                'settings.multi_select_visual': 'Visual Style',
                'settings.multi_select_columns': 'Columns',
                'settings.binary_mode': 'Binary Mode',
                'settings.allow_multiselect': 'Allow Multiple',
                // Metadata fields
                'metadata.hotel': 'Hotel',
                'metadata.source': 'Referral Source',
                'metadata.dietary': 'Dietary Restrictions',
                // Preferences fields
                'preferences.preferred_messaging_app': 'Messaging App',
                'preferences.sms_notifications': 'SMS Notifications',
                'preferences.email_notifications': 'Email Notifications',
                'preferences.whatsapp_notifications': 'WhatsApp Notifications',
                // Common fields
                'source': 'Referral Source',
                'field_type': 'Field Type',
                'is_required': 'Required',
                'is_active': 'Active',
                'display_order': 'Display Order',
                'total_value': 'Total Value',
                'created_at': 'Created',
                'updated_at': 'Updated',
                // Customer fields
                'phone': 'Phone Number',
                'email': 'Email Address',
                'status': 'Status',
                'name': 'Name',
                'dietary': 'Dietary Restrictions',
                'sms': 'SMS Notifications',
                'whatsapp': 'WhatsApp Notifications',
                // Vendor/Booking fields
                'vendor_id': 'Vendor',
                'experience_id': 'Experience',
                'customer_id': 'Customer',
                'booking_date': 'Booking Date',
                'pickup_time': 'Pickup Time',
                'pickup_location': 'Pickup Location',
            };

            // Check direct mapping first
            if (fieldMap[key]) return fieldMap[key];

            // Clean up the key for display
            const lastPart = key.includes('.') ? key.split('.').pop()! : key;

            // Convert snake_case to Title Case
            return lastPart
                .replace(/_/g, ' ')
                .replace(/\b\w/g, char => char.toUpperCase());
        };

        // Helper to normalize empty values for comparison
        const normalizeValue = (val: any) => {
            if (val === null || val === undefined || val === '') return null;
            return val;
        };

        // Filter to only show fields that actually changed
        const changes = allKeys
            .filter(key => {
                // Skip system fields
                if (key === 'updated_at' || key === 'created_at' || key === 'id') return false;

                const oldVal = normalizeValue(flatOld[key]);
                const newVal = normalizeValue(flatNew[key]);

                // Skip if both are empty (no real change)
                if (oldVal === null && newVal === null) return false;

                // Only include if values actually differ
                return JSON.stringify(oldVal) !== JSON.stringify(newVal);
            })
            .map(key => {
                const oldVal = flatOld[key];
                const newVal = flatNew[key];
                const normalizedOld = normalizeValue(oldVal);
                const normalizedNew = normalizeValue(newVal);
                const fieldLabel = humanizeFieldName(key);

                // If changed to empty, show as cleared
                if (normalizedNew === null && normalizedOld !== null) {
                    return (
                        <div key={key} className="flex items-center gap-2">
                            <span className="text-zinc-500">{fieldLabel}:</span>
                            <span className="text-zinc-500 italic">(cleared)</span>
                        </div>
                    );
                }

                // Format phone numbers
                const isPhoneField = key === 'phone' || key.includes('phone');
                let displayValue = String(newVal);
                if (isPhoneField && displayValue) {
                    displayValue = formatPhoneNumber(displayValue);
                }

                return (
                    <div key={key} className="flex items-center gap-2">
                        <span className="text-zinc-500">{fieldLabel}:</span>
                        <span className="text-white font-medium">
                            {displayValue.length > 40 ? displayValue.substring(0, 40) + '...' : displayValue}
                        </span>
                    </div>
                );
            })
            .filter(Boolean);

        if (changes.length === 0) return <span className="text-zinc-500 text-xs italic">No significant changes</span>;

        return (
            <div className="flex flex-col gap-1 text-base">
                {changes}
            </div>
        );
    };

    // Action Icon component
    const ActionIcon = ({ action }: { action: string }) => {
        if (action === 'INSERT') {
            return <Plus size={16} className="text-emerald-400" />;
        }
        if (action === 'UPDATE') {
            return <Pencil size={16} className="text-cyan-400" />;
        }
        return <Trash2 size={16} className="text-red-400" />;
    };

    const getRecordName = (log: ActivityLog) => {
        const data = log.new_data || log.old_data || {};
        const name = data.label || data.title || data.name || data.email;
        return name ? <span className="text-white font-medium">{name}</span> : <span className="font-mono text-xs opacity-50">{log.record_id.substring(0, 8)}...</span>;
    };

    const isFiltered = !!searchQuery;

    // Initial Loading State
    if (loading && totalItems === 0 && !searchQuery) {
        return (
            <div className="flex-1 flex items-center justify-center text-zinc-500 gap-2">
                <Loader2 size={24} className="animate-spin" />
                Loading...
            </div>
        );
    }

    return (
        <>
            {/* Search Toolbar (Matching CustomerToolbar) */}
            <div className="flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-2 flex-1 max-w-xl">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search table, action, record..."
                            className="w-full h-10 bg-[#0b1115] border border-white/10 rounded-lg pl-9 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder:text-zinc-600"
                        />
                    </div>

                    {/* Reset Button */}
                    {isFiltered && (
                        <button
                            onClick={handleReset}
                            className="h-10 px-3 flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-white/10 whitespace-nowrap"
                        >
                            <X size={16} />
                            Reset
                        </button>
                    )}
                </div>

                {/* Purge Button with Countdown */}
                {purgeStatus && (
                    <button
                        onClick={() => setShowPurgeDialog(true)}
                        disabled={purging}
                        className={cn(
                            "h-10 px-4 flex items-center gap-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap border",
                            purgeStatus.overdue
                                ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        {purging ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : purgeStatus.overdue ? (
                            <AlertTriangle size={16} />
                        ) : (
                            <Trash size={16} />
                        )}
                        {purgeStatus.overdue
                            ? `Overdue by ${purgeStatus.days} days`
                            : `Purge in ${purgeStatus.days} days`
                        }
                    </button>
                )}
            </div>

            {/* Table Container (Matching CustomersPage Structure) */}
            <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-white/5 bg-[#09090b]">
                <div className={cn("h-full", loading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity")}>
                    <div className="h-full overflow-auto relative">
                        {/* Desktop Table */}
                        <table className="w-full text-left hidden md:table">
                            <thead className="bg-white/5 backdrop-blur-sm text-zinc-400 text-xs uppercase tracking-wider font-semibold sticky top-0 z-20 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">What Changed</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Changes</th>
                                    <th className="px-6 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-base text-zinc-300">
                                {logs.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-20 text-zinc-500">
                                            {searchQuery ? "No results matching your search." : "No activity recorded yet."}
                                        </td>
                                    </tr>
                                ) : logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <ActionIcon action={log.action} />
                                                <div>
                                                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{log.table_name.replace(/_/g, ' ')}</div>
                                                    <div>{getRecordName(log)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400">
                                            {log.user_id ? `${log.user_id.substring(0, 8)}...` : <span className="text-zinc-500 italic">System</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {renderDiff(log)}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400 whitespace-nowrap text-sm">
                                            {format(new Date(log.created_at), "MMM d, h:mm a")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4 p-4">
                            {logs.length === 0 && !loading ? (
                                <div className="text-center py-20 text-zinc-500">
                                    {searchQuery ? "No results matching your search." : "No activity recorded yet."}
                                </div>
                            ) : logs.map((log) => {
                                const contentType = log.table_name
                                    .replace(/_/g, ' ')
                                    .replace(/\b\w/g, c => c.toUpperCase())
                                    .replace(/s$/, '');
                                const recordName = log.new_data?.label || log.new_data?.name || log.old_data?.label || log.old_data?.name || 'Unknown';
                                const actionText = log.action === 'INSERT' ? 'Created' : log.action === 'UPDATE' ? 'Updated' : 'Deleted';

                                return (
                                    <div key={log.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                                        {/* Header: Icon + Name + Action Badge */}
                                        <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                                    <ActionIcon action={log.action} />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-zinc-500 uppercase tracking-wider">{contentType}</div>
                                                    <h3 className="text-lg font-bold text-white leading-tight">{recordName}</h3>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-medium shrink-0 ${log.action === 'INSERT' ? 'text-emerald-400' :
                                                log.action === 'UPDATE' ? 'text-cyan-400' :
                                                    'text-red-400'
                                                }`}>
                                                {actionText}
                                            </span>
                                        </div>

                                        {/* Body: Changes */}
                                        <div className="text-zinc-300">{renderDiff(log)}</div>

                                        {/* Footer: By User + Date (right-justified) */}
                                        <div className="flex items-center justify-between text-zinc-500 pt-2 border-t border-white/5">
                                            <span>By <span className="text-white">{log.user_id ? log.user_id.substring(0, 8) + '...' : 'System'}</span></span>
                                            <span>{format(new Date(log.created_at), "MMM d, h:mm a")}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Record Count Footer */}
            <div className="shrink-0 flex items-center justify-center px-2 pt-2 text-sm text-zinc-500 border-t border-white/10">
                <span>{totalItems.toLocaleString()} {totalItems === 1 ? 'activity log' : 'activity logs'}</span>
            </div>

            {/* Purge Confirmation Dialog */}
            <AlertDialog
                isOpen={showPurgeDialog}
                onClose={() => setShowPurgeDialog(false)}
                onConfirm={handlePurge}
                isDestructive={true}
                title="Purge Activity Logs?"
                description="This will permanently delete all activity logs older than 30 days. This action cannot be undone."
                confirmLabel="Purge Logs"
            />
        </>
    );
}
