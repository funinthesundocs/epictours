import { LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value: string;
    icon?: LucideIcon;
    trend?: string;
}

interface PageShellProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    stats?: StatCardProps[];
    children?: React.ReactNode;
    action?: React.ReactNode;
}

export function PageShell({ title, description, icon: Icon, stats, children, action }: PageShellProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex items-start gap-4">
                    {Icon && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-cyan-400">
                            <Icon size={32} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
                        <p className="text-zinc-400 text-sm mt-1">{description}</p>
                    </div>
                </div>
                {action && <div>{action}</div>}
            </div>

            {/* Stats Grid */}
            {stats && stats.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="glass-card p-4 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-zinc-500 uppercase">{stat.label}</span>
                                {stat.icon && <stat.icon size={16} className="text-cyan-500" />}
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-xl font-bold text-white">{stat.value}</span>
                                {stat.trend && <span className="text-xs text-emerald-400">{stat.trend}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Content Area */}
            <div className="min-h-[400px] glass-card rounded-xl border border-white/5 p-6 relative overflow-hidden">
                {children ? children : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                        <div className="text-center">
                            <h3 className="text-4xl font-bold text-zinc-800 uppercase tracking-widest">{title}</h3>
                            <p className="text-sm text-zinc-700 font-mono mt-2">MODULE::INITIALIZED</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
