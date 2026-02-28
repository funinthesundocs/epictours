"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { VoiceSelector } from "./VoiceSelector";
import { AvatarSelector } from "./AvatarSelector";
import {
    Loader2, Mic, User, Film, Play, RotateCcw,
    Check, X, ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Scene {
    id: string;
    scene_number: number;
    dialogue_line?: string;
    dialogue?: string;
    broll_description: string;
    duration_seconds: number;
    audio_status: string;
    avatar_status: string;
    broll_status: string;
}

interface ProjectData {
    id: string;
    status: string;
    settings?: {
        voice_id?: string | null;
        avatar_id?: string | null;
        aspect_ratio?: string;
    };
    remix_scripts?: {
        id: string;
        is_selected: boolean;
        tone: string;
        total_duration_seconds: number;
        scenes?: Scene[];
    }[];
}

interface GeneratePanelProps {
    project: ProjectData;
    orgId: string;
    onRefresh: () => void;
}

type AssetType = "audio" | "broll" | "avatar";

function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
        pending: {
            className: "bg-muted text-muted-foreground border-border",
            icon: null,
            label: "Pending",
        },
        processing: {
            className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            icon: <Loader2 className="h-2.5 w-2.5 animate-spin" />,
            label: "Processing",
        },
        complete: {
            className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            icon: <Check className="h-2.5 w-2.5" />,
            label: "Done",
        },
        error: {
            className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
            icon: <X className="h-2.5 w-2.5" />,
            label: "Error",
        },
    };

    const v = variants[status] || variants.pending;
    return (
        <span className={cn("inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border font-medium", v.className)}>
            {v.icon}
            {v.label}
        </span>
    );
}

function allComplete(scenes: Scene[], type: AssetType): boolean {
    return scenes.every((s) => s[`${type}_status`] === "complete");
}

function countByStatus(scenes: Scene[], type: AssetType, status: string): number {
    return scenes.filter((s) => s[`${type}_status` as keyof Scene] === status).length;
}

export function GeneratePanel({ project, orgId, onRefresh }: GeneratePanelProps) {
    const selectedScript = project.remix_scripts?.find((s) => s.is_selected);
    const scenes: Scene[] = selectedScript?.scenes || [];

    const [voiceId, setVoiceId] = useState<string | null>(project.settings?.voice_id || null);
    const [avatarId, setAvatarId] = useState<string | null>(project.settings?.avatar_id || null);
    const [expandedScene, setExpandedScene] = useState<string | null>(null);
    const [generatingScenes, setGeneratingScenes] = useState<Set<string>>(new Set());
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);
    const abortRef = useRef(false);

    const getDialogue = (scene: Scene) => scene.dialogue_line || scene.dialogue || "";

    const generateAudio = useCallback(async (scene: Scene): Promise<boolean> => {
        if (!voiceId) { toast.error("Select a voice first"); return false; }

        try {
            const res = await fetch("/api/remix/audio/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sceneId: scene.id,
                    voiceId,
                    projectId: project.id,
                    orgId,
                }),
            });
            const data = await res.json();
            if (!data.success) {
                toast.error(`Scene ${scene.scene_number} audio: ${data.error?.message}`);
                return false;
            }
            return true;
        } catch {
            toast.error(`Scene ${scene.scene_number} audio failed`);
            return false;
        }
    }, [voiceId, project.id, orgId]);

    const generateBroll = useCallback(async (scene: Scene): Promise<boolean> => {
        try {
            const res = await fetch("/api/remix/broll/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sceneId: scene.id,
                    provider: "auto",
                    durationSeconds: Math.min(scene.duration_seconds, 8),
                    projectId: project.id,
                    orgId,
                }),
            });
            const data = await res.json();
            if (!data.success) {
                toast.error(`Scene ${scene.scene_number} B-roll: ${data.error?.message}`);
                return false;
            }
            return true;
        } catch {
            toast.error(`Scene ${scene.scene_number} B-roll failed`);
            return false;
        }
    }, [project.id, orgId]);

    const generateAvatar = useCallback(async (scene: Scene): Promise<boolean> => {
        if (!avatarId) { toast.error("Select an avatar first"); return false; }
        if (scene.audio_status !== "complete") {
            toast.error(`Scene ${scene.scene_number}: generate audio first`);
            return false;
        }

        try {
            const res = await fetch("/api/remix/avatar/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sceneId: scene.id,
                    avatarId,
                    background: { type: "color", value: "#0A0A0B" },
                    aspectRatio: project.settings?.aspect_ratio || "16:9",
                    projectId: project.id,
                    orgId,
                }),
            });
            const data = await res.json();
            if (!data.success) {
                toast.error(`Scene ${scene.scene_number} avatar: ${data.error?.message}`);
                return false;
            }
            return true;
        } catch {
            toast.error(`Scene ${scene.scene_number} avatar failed`);
            return false;
        }
    }, [avatarId, project.id, project.settings?.aspect_ratio, orgId]);

    const handleGenerateScene = async (scene: Scene, type: AssetType) => {
        setGeneratingScenes((prev) => new Set(prev).add(scene.id));
        try {
            let ok = false;
            if (type === "audio") ok = await generateAudio(scene);
            if (type === "broll") ok = await generateBroll(scene);
            if (type === "avatar") ok = await generateAvatar(scene);
            if (ok) onRefresh();
        } finally {
            setGeneratingScenes((prev) => {
                const next = new Set(prev);
                next.delete(scene.id);
                return next;
            });
        }
    };

    const handleGenerateAll = async () => {
        if (!voiceId) { toast.error("Select a voice first"); return; }
        if (!avatarId) { toast.error("Select an avatar first"); return; }

        abortRef.current = false;
        setIsGeneratingAll(true);
        toast.info(`Starting generation for ${scenes.length} scenes...`);

        try {
            // Phase 1: Audio + B-roll in parallel per scene
            for (const scene of scenes) {
                if (abortRef.current) break;
                if (scene.audio_status === "complete" && scene.broll_status === "complete") continue;

                setGeneratingScenes((prev) => new Set(prev).add(scene.id));

                const tasks: Promise<boolean>[] = [];
                if (scene.audio_status !== "complete") tasks.push(generateAudio(scene));
                if (scene.broll_status !== "complete") tasks.push(generateBroll(scene));
                await Promise.all(tasks);

                setGeneratingScenes((prev) => {
                    const next = new Set(prev);
                    next.delete(scene.id);
                    return next;
                });
                onRefresh();
            }

            // Phase 2: Avatar (needs audio complete — poll after refresh)
            onRefresh();
            toast.success("Audio & B-roll complete! Avatar jobs submitted.");

            for (const scene of scenes) {
                if (abortRef.current) break;
                if (scene.avatar_status === "complete") continue;

                setGeneratingScenes((prev) => new Set(prev).add(scene.id));
                await generateAvatar(scene);
                setGeneratingScenes((prev) => {
                    const next = new Set(prev);
                    next.delete(scene.id);
                    return next;
                });
                onRefresh();
            }

            toast.success("All generation jobs submitted! Avatar videos are rendering in the background.");
        } catch {
            toast.error("Generation interrupted");
        } finally {
            setIsGeneratingAll(false);
            abortRef.current = false;
            onRefresh();
        }
    };

    const audioComplete = countByStatus(scenes, "audio", "complete");
    const brollComplete = countByStatus(scenes, "broll", "complete");
    const avatarComplete = countByStatus(scenes, "avatar", "complete");
    const total = scenes.length;

    if (!selectedScript) {
        return (
            <div className="border border-border rounded-lg bg-card p-6 text-center text-sm text-muted-foreground">
                No script selected. Go back to the remix step and select a script.
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Progress summary */}
            <div className="border border-border rounded-lg bg-card p-4 grid grid-cols-3 gap-4 text-center">
                {[
                    { label: "Audio", done: audioComplete, icon: Mic, color: "text-cyan-400" },
                    { label: "B-Roll", done: brollComplete, icon: Film, color: "text-violet-400" },
                    { label: "Avatar", done: avatarComplete, icon: User, color: "text-emerald-400" },
                ].map(({ label, done, icon: Icon, color }) => (
                    <div key={label} className="space-y-1">
                        <Icon className={cn("h-4 w-4 mx-auto", color)} />
                        <p className="text-lg font-semibold text-foreground">{done}<span className="text-muted-foreground text-sm">/{total}</span></p>
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                    </div>
                ))}
            </div>

            {/* Voice + Avatar selectors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border border-border rounded-lg bg-card p-4">
                    <VoiceSelector
                        selectedVoiceId={voiceId}
                        onSelect={setVoiceId}
                        previewText={scenes[0] ? getDialogue(scenes[0]).slice(0, 200) : undefined}
                    />
                </div>
                <div className="border border-border rounded-lg bg-card p-4">
                    <AvatarSelector
                        selectedAvatarId={avatarId}
                        onSelect={setAvatarId}
                    />
                </div>
            </div>

            {/* Generate All button */}
            <div className="flex items-center gap-3">
                <Button
                    onClick={handleGenerateAll}
                    disabled={isGeneratingAll || !voiceId || !avatarId}
                    className="gap-2"
                >
                    {isGeneratingAll ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Zap className="h-4 w-4" />
                    )}
                    {isGeneratingAll ? "Generating..." : "Generate All Scenes"}
                </Button>
                {isGeneratingAll && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { abortRef.current = true; }}
                        className="text-muted-foreground"
                    >
                        Cancel
                    </Button>
                )}
                {!voiceId && <p className="text-xs text-amber-500">Select a voice to continue</p>}
                {voiceId && !avatarId && <p className="text-xs text-amber-500">Select an avatar to continue</p>}
            </div>

            {/* Scene-by-scene list */}
            <div className="space-y-2">
                {scenes
                    .sort((a, b) => a.scene_number - b.scene_number)
                    .map((scene) => {
                        const isExpanded = expandedScene === scene.id;
                        const isGenerating = generatingScenes.has(scene.id);
                        const dialogue = getDialogue(scene);

                        return (
                            <div key={scene.id} className="border border-border rounded-lg bg-card overflow-hidden">
                                {/* Scene row */}
                                <div className="flex items-center gap-3 px-4 py-2.5">
                                    <span className="text-xs font-medium text-primary w-6 shrink-0">
                                        #{scene.scene_number}
                                    </span>

                                    <button
                                        onClick={() => setExpandedScene(isExpanded ? null : scene.id)}
                                        className="flex-1 text-left min-w-0"
                                    >
                                        <span className="text-xs text-muted-foreground truncate block">
                                            {dialogue.slice(0, 70)}...
                                        </span>
                                    </button>

                                    {/* Status badges */}
                                    <div className="flex items-center gap-1 shrink-0">
                                        <StatusBadge status={scene.audio_status} />
                                        <StatusBadge status={scene.broll_status} />
                                        <StatusBadge status={scene.avatar_status} />
                                    </div>

                                    {isGenerating && (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                                    )}

                                    <button
                                        onClick={() => setExpandedScene(isExpanded ? null : scene.id)}
                                        className="text-muted-foreground shrink-0"
                                    >
                                        {isExpanded ? (
                                            <ChevronUp className="h-3.5 w-3.5" />
                                        ) : (
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>

                                {/* Expanded controls */}
                                {isExpanded && (
                                    <div className="border-t border-border px-4 py-3 space-y-3">
                                        <p className="text-xs text-foreground">{dialogue}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            <span className="font-medium">B-Roll:</span> {scene.broll_description}
                                        </p>

                                        {/* Per-asset generate buttons */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {(["audio", "broll", "avatar"] as AssetType[]).map((type) => {
                                                const status = scene[`${type}_status` as keyof Scene] as string;
                                                const icons = { audio: Mic, broll: Film, avatar: User };
                                                const labels = { audio: "Audio", broll: "B-Roll", avatar: "Avatar" };
                                                const Icon = icons[type];

                                                return (
                                                    <Button
                                                        key={type}
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={isGenerating || (type === "avatar" && scene.audio_status !== "complete")}
                                                        onClick={() => handleGenerateScene(scene, type)}
                                                        className={cn(
                                                            "h-7 text-[11px] gap-1.5",
                                                            status === "complete" && "border-emerald-500/30 text-emerald-400"
                                                        )}
                                                    >
                                                        {status === "complete" ? (
                                                            <Check className="h-3 w-3" />
                                                        ) : status === "error" ? (
                                                            <RotateCcw className="h-3 w-3" />
                                                        ) : (
                                                            <Icon className="h-3 w-3" />
                                                        )}
                                                        {status === "complete" ? `${labels[type]} ✓` : `Gen ${labels[type]}`}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
