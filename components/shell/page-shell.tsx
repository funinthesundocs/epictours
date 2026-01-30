import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
    className?: string; // Root container override
    style?: React.CSSProperties; // Inline styles for root container
    contentClassName?: string; // Content wrapper override
}

export function PageShell({ title, description, icon: Icon, stats, children, action, className, style, contentClassName }: PageShellProps) {
    return (
        <div className={cn("space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500", className)} style={style}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 shrink-0">
                <div className="flex items-start gap-4">
                    {Icon && (
                        <div className="p-3 rounded-xl bg-muted/40 border border-border text-primary">
                            <Icon size={32} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
                        <p className="text-muted-foreground text-sm mt-1">{description}</p>
                    </div>
                </div>
                {action && <div className="self-end md:self-auto">{action}</div>}
            </div>

            {/* Stats Grid */}
            {stats && stats.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                    {stats.map((stat, i) => (
                        <div key={i} className="glass-card p-4 rounded-xl border border-border hover:border-primary/30 transition-colors bg-card/40">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">{stat.label}</span>
                                {stat.icon && <stat.icon size={16} className="text-primary" />}
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-xl font-bold text-foreground">{stat.value}</span>
                                {stat.trend && <span className="text-xs text-emerald-500">{stat.trend}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Content Area */}
            {children ? (
                <div className={cn("min-h-[400px]", contentClassName)}>
                    {children}
                </div>
            ) : (
                <div className="min-h-[400px] border border-border relative flex items-center justify-center opacity-20 pointer-events-none">
                    <div className="text-center">
                        <h3 className="text-4xl font-bold text-muted-foreground uppercase tracking-widest">{title}</h3>
                        <p className="text-sm text-muted-foreground font-mono mt-2">MODULE::INITIALIZED</p>
                    </div>
                </div>
            )}
        </div>
    );
}
