"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Check, RefreshCw, Loader2, Pencil, X, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TitleVariation {
    id: string;
    style: string;
    title: string;
    reasoning?: string;
    is_selected: boolean;
}

interface TitleVariationsProps {
    projectId: string;
    sourceId: string;
    orgId: string;
    titles: TitleVariation[];
    onTitlesChange: () => void;
    disabled?: boolean;
}

const STYLE_LABELS: Record<string, { label: string; color: string }> = {
    curiosity_gap: { label: "Curiosity Gap", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
    direct_value: { label: "Direct Value", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    contrarian: { label: "Contrarian", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
    listicle: { label: "Listicle", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    question: { label: "Question", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    emotional_hook: { label: "Emotional Hook", color: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
    tutorial: { label: "Tutorial", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
    story_driven: { label: "Story-Driven", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
};

export function TitleVariations({ projectId, sourceId, orgId, titles, onTitlesChange, disabled }: TitleVariationsProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");

    const selectedTitle = titles.find((t) => t.is_selected);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/remix/title", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sourceId, projectId, orgId }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Generated ${data.data.titlesGenerated} title variations`);
                onTitlesChange();
            } else {
                toast.error(data.error?.message || "Failed to generate titles");
            }
        } catch {
            toast.error("Failed to generate titles");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelect = async (titleId: string) => {
        try {
            // Deselect all, then select this one
            const res = await fetch(`/api/remix/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    selectTitle: titleId,
                    orgId,
                }),
            });
            if (res.ok) {
                onTitlesChange();
            }
        } catch {
            toast.error("Failed to select title");
        }
    };

    const startEditing = (title: TitleVariation) => {
        setEditingId(title.id);
        setEditValue(title.title);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditValue("");
    };

    const saveEdit = async (titleId: string) => {
        if (!editValue.trim()) return;
        try {
            const res = await fetch(`/api/remix/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    editTitle: { id: titleId, title: editValue.trim() },
                    orgId,
                }),
            });
            if (res.ok) {
                setEditingId(null);
                setEditValue("");
                onTitlesChange();
            }
        } catch {
            toast.error("Failed to update title");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium text-foreground">Title Variations</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {titles.length > 0
                            ? `${titles.length} variations generated. Select one for your remix.`
                            : "Generate AI title variations from your source content."}
                    </p>
                </div>
                <Button
                    size="sm"
                    variant={titles.length > 0 ? "outline" : "default"}
                    onClick={handleGenerate}
                    disabled={isGenerating || disabled}
                >
                    {isGenerating ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : titles.length > 0 ? (
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    ) : (
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {titles.length > 0 ? "Regenerate" : "Generate Titles"}
                </Button>
            </div>

            {isGenerating && (
                <div className="flex items-center justify-center py-8 gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Generating title variations with AI...</span>
                </div>
            )}

            {!isGenerating && titles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {titles.map((title) => {
                        const style = STYLE_LABELS[title.style] || { label: title.style, color: "bg-muted text-muted-foreground border-border" };
                        const isEditing = editingId === title.id;

                        return (
                            <div
                                key={title.id}
                                className={cn(
                                    "border rounded-lg p-3 space-y-2 transition-all",
                                    title.is_selected
                                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                        : "border-border bg-card hover:border-primary/30"
                                )}
                            >
                                {/* Style badge */}
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                                        style.color
                                    )}>
                                        {style.label}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {!isEditing && (
                                            <button
                                                onClick={() => startEditing(title)}
                                                className="p-1 rounded hover:bg-muted transition-colors"
                                                title="Edit title"
                                            >
                                                <Pencil className="h-3 w-3 text-muted-foreground" />
                                            </button>
                                        )}
                                        {title.is_selected && (
                                            <Check className="h-4 w-4 text-primary" />
                                        )}
                                    </div>
                                </div>

                                {/* Title text or edit input */}
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="h-8 text-sm"
                                            maxLength={100}
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") saveEdit(title.id);
                                                if (e.key === "Escape") cancelEditing();
                                            }}
                                        />
                                        <button
                                            onClick={() => saveEdit(title.id)}
                                            className="p-1 rounded hover:bg-primary/10 transition-colors"
                                        >
                                            <Check className="h-4 w-4 text-primary" />
                                        </button>
                                        <button
                                            onClick={cancelEditing}
                                            className="p-1 rounded hover:bg-muted transition-colors"
                                        >
                                            <X className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                    </div>
                                ) : (
                                    <p
                                        className="text-sm font-medium text-foreground cursor-pointer"
                                        onClick={() => handleSelect(title.id)}
                                    >
                                        {title.title}
                                    </p>
                                )}

                                {/* Reasoning */}
                                {title.reasoning && !isEditing && (
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                                        {title.reasoning}
                                    </p>
                                )}

                                {/* Select button */}
                                {!title.is_selected && !isEditing && (
                                    <button
                                        onClick={() => handleSelect(title.id)}
                                        className="text-[10px] text-primary hover:text-primary/80 font-medium transition-colors"
                                    >
                                        Select this title
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Selected title summary */}
            {selectedTitle && !isGenerating && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs text-foreground">
                        Selected: <strong>{selectedTitle.title}</strong>
                    </span>
                </div>
            )}
        </div>
    );
}
