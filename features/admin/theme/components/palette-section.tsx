import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface PaletteSectionProps {
    title: string;
    colors: { name: string; class: string; hex?: string }[];
    defaultCollapsed?: boolean;
    minimal?: boolean; // For Semantic simplification
    onColorSelect?: (hex: string) => void;
    activeHex?: string | null;
    alwaysOpen?: boolean;
    showHex?: boolean;
    showClass?: boolean;
}

export function PaletteSection({
    title,
    colors,
    defaultCollapsed = true,
    minimal = false,
    onColorSelect,
    activeHex,
    alwaysOpen = false,
    showHex = true,
    showClass = true
}: PaletteSectionProps) {
    const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);

    if (minimal) {
        return (
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground">{title}</h3>
                <div className="flex flex-wrap gap-4">
                    {colors.map((color) => (
                        <div key={color.name} className="flex items-center gap-3 px-3 py-2 bg-muted border border-border rounded-lg">
                            <div className={cn("w-4 h-4 rounded-full shadow-sm", color.class)} />
                            <div className="text-sm font-medium text-foreground">{color.name}</div>
                            {color.class.includes('text-') && (
                                <div className={cn("text-xs font-bold", color.class)}>Abc</div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Find the "middle" color (approx 500 weight) for the collapsed view
    const middleIndex = Math.floor(colors.length / 2);
    const middleColor = colors.find(c => c.name.includes("500")) || colors[middleIndex] || colors[0];

    const content = (
        <div className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-8 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {colors.map((color) => {
                const isActive = activeHex && color.hex && activeHex.toLowerCase() === color.hex.toLowerCase();
                return (
                    <button
                        key={color.name}
                        onClick={() => color.hex && onColorSelect?.(color.hex)}
                        className="space-y-2 group text-center w-full disabled:cursor-default"
                        disabled={!color.hex || !onColorSelect}
                    >
                        <div className={cn(
                            "h-12 w-full rounded-lg shadow-lg border border-border transition-all duration-200",
                            "group-hover:scale-105",
                            isActive ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-105" : "",
                            color.class
                        )} />
                        <div>
                            <p className={cn("text-sm font-normal transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")}>{color.name}</p>
                            {showHex && color.hex && <p className="text-xs text-muted-foreground/70 font-mono">{color.hex}</p>}
                            {showClass && <p className="text-xs text-muted-foreground/60 font-mono truncate">{color.class.split(' ').find(c => c.startsWith('bg-'))}</p>}
                        </div>
                    </button>
                );
            })}
        </div>
    );

    if (alwaysOpen) {
        return (
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-foreground mb-4">{title}</h3>
                {content}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-4">
                    {title}
                    {/* Collapsed Preview Swatch */}
                    {!isExpanded && (
                        <div className="flex items-center gap-3 bg-muted/50 px-3 py-1.5 rounded-full border border-border animate-in fade-in slide-in-from-left-2 duration-300">
                            <div className={cn("w-6 h-6 rounded-full shadow-lg border border-border", middleColor.class)} />
                            <span className="text-xs text-muted-foreground font-mono">{middleColor.name}</span>
                        </div>
                    )}
                </h3>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>

            {isExpanded && content}
        </div>
    );
}
