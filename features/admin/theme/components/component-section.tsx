import { cn } from "@/lib/utils";

interface ComponentSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function ComponentSection({ title, description, children, className }: ComponentSectionProps) {
    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-xl font-bold text-foreground">{title}</h3>
                {description && <p className="text-muted-foreground text-sm">{description}</p>}
            </div>
            <div className={cn("p-6 rounded-xl border border-border bg-card/50", className)}>
                {children}
            </div>
        </div>
    );
}
