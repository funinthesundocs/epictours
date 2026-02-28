"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Check, RefreshCw, Loader2, Sparkles, Clock,
    Film, Type, ChevronDown, ChevronUp, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Scene {
    id: string;
    scene_number: number;
    dialogue_line: string;
    broll_description: string;
    on_screen_text?: string;
    duration_seconds: number;
    audio_status: string;
    avatar_status: string;
    broll_status: string;
}

interface Script {
    id: string;
    full_script: string;
    tone: string;
    total_duration_seconds: number;
    is_selected: boolean;
    scenes?: Scene[];
}

interface ScriptEditorProps {
    projectId: string;
    sourceId: string;
    orgId: string;
    scripts: Script[];
    onScriptsChange: () => void;
    disabled?: boolean;
}

const TONE_OPTIONS = [
    { value: "professional", label: "Professional" },
    { value: "casual", label: "Casual" },
    { value: "energetic", label: "Energetic" },
    { value: "educational", label: "Educational" },
    { value: "storytelling", label: "Storytelling" },
];

function formatDuration(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    if (min === 0) return `${sec}s`;
    return `${min}m ${sec}s`;
}

export function ScriptEditor({ projectId, sourceId, orgId, scripts, onScriptsChange, disabled }: ScriptEditorProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedTone, setSelectedTone] = useState("professional");
    const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());

    const selectedScript = scripts.find((s) => s.is_selected);
    const activeScript = selectedScript || scripts[0];

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/remix/script", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceId,
                    projectId,
                    orgId,
                    tone: selectedTone,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Script generated: ${data.data.sceneCount} scenes, ${formatDuration(data.data.totalDurationSeconds)}`);
                onScriptsChange();
            } else {
                toast.error(data.error?.message || "Failed to generate script");
            }
        } catch {
            toast.error("Failed to generate script");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelect = async (scriptId: string) => {
        try {
            const res = await fetch(`/api/remix/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    selectScript: scriptId,
                    orgId,
                }),
            });
            if (res.ok) {
                onScriptsChange();
            }
        } catch {
            toast.error("Failed to select script");
        }
    };

    const toggleScene = (sceneId: string) => {
        setExpandedScenes((prev) => {
            const next = new Set(prev);
            if (next.has(sceneId)) {
                next.delete(sceneId);
            } else {
                next.add(sceneId);
            }
            return next;
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium text-foreground">Script</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {scripts.length > 0
                            ? `${scripts.length} script${scripts.length > 1 ? "s" : ""} generated. Review scenes and approve.`
                            : "Generate a scene-based script from your source transcript."}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Tone selector */}
                    <select
                        value={selectedTone}
                        onChange={(e) => setSelectedTone(e.target.value)}
                        className="text-xs bg-muted border border-border rounded-md px-2 py-1.5 text-foreground"
                    >
                        {TONE_OPTIONS.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                    <Button
                        size="sm"
                        variant={scripts.length > 0 ? "outline" : "default"}
                        onClick={handleGenerate}
                        disabled={isGenerating || disabled}
                    >
                        {isGenerating ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : scripts.length > 0 ? (
                            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        ) : (
                            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {scripts.length > 0 ? "Regenerate" : "Generate Script"}
                    </Button>
                </div>
            </div>

            {isGenerating && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Rewriting transcript into scene-based script...</span>
                    <span className="text-[10px] text-muted-foreground">This may take 15-30 seconds</span>
                </div>
            )}

            {!isGenerating && activeScript && (
                <div className="space-y-3">
                    {/* Script summary */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground border border-border rounded-lg px-4 py-2.5 bg-card">
                        <span className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" />
                            {activeScript.scenes?.length ?? 0} scenes
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDuration(activeScript.total_duration_seconds)}
                        </span>
                        <span className="capitalize">{activeScript.tone} tone</span>
                        {activeScript.is_selected && (
                            <span className="flex items-center gap-1 text-primary font-medium ml-auto">
                                <Check className="h-3.5 w-3.5" />
                                Selected
                            </span>
                        )}
                        {!activeScript.is_selected && (
                            <button
                                onClick={() => handleSelect(activeScript.id)}
                                className="text-primary hover:text-primary/80 font-medium ml-auto transition-colors"
                            >
                                Select this script
                            </button>
                        )}
                    </div>

                    {/* Scene list */}
                    <div className="space-y-2">
                        {(activeScript.scenes || [])
                            .sort((a, b) => a.scene_number - b.scene_number)
                            .map((scene) => {
                                const isExpanded = expandedScenes.has(scene.id);

                                return (
                                    <div
                                        key={scene.id}
                                        className="border border-border rounded-lg bg-card overflow-hidden"
                                    >
                                        {/* Scene header */}
                                        <button
                                            onClick={() => toggleScene(scene.id)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
                                        >
                                            <span className="text-xs font-medium text-primary w-8">
                                                #{scene.scene_number}
                                            </span>
                                            <span className="text-xs text-foreground flex-1 text-left truncate">
                                                {scene.dialogue_line.slice(0, 80)}...
                                            </span>
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                                                <Clock className="h-2.5 w-2.5" />
                                                {scene.duration_seconds}s
                                            </span>
                                            {isExpanded ? (
                                                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            ) : (
                                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            )}
                                        </button>

                                        {/* Expanded content */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border">
                                                {/* Dialogue */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                        <Type className="h-2.5 w-2.5" /> Dialogue
                                                    </label>
                                                    <Textarea
                                                        value={scene.dialogue_line}
                                                        readOnly
                                                        className="text-xs min-h-[80px] resize-none bg-muted/20"
                                                    />
                                                </div>

                                                {/* B-roll */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                                        <Film className="h-2.5 w-2.5" /> B-Roll Description
                                                    </label>
                                                    <Textarea
                                                        value={scene.broll_description}
                                                        readOnly
                                                        className="text-xs min-h-[60px] resize-none bg-muted/20"
                                                    />
                                                </div>

                                                {/* On-screen text */}
                                                {scene.on_screen_text && (
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                                            On-Screen Text
                                                        </label>
                                                        <p className="text-xs text-foreground px-3 py-2 rounded bg-muted/20 border border-border">
                                                            {scene.on_screen_text}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Scene metadata */}
                                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
                                                    <span>{scene.dialogue_line.split(/\s+/).length} words</span>
                                                    <span>~{scene.duration_seconds}s spoken</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}
        </div>
    );
}
