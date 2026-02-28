"use client";

import { Mic, User, Film, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Scene {
    id: string;
    scene_number: number;
    dialogue_line?: string;
    dialogue?: string;
    on_screen_text?: string;
    duration_seconds: number;
    audio_status: string;
    avatar_status: string;
    broll_status: string;
}

interface SceneTimelineProps {
    scenes: Scene[];
    totalDurationSeconds?: number;
}

function StatusDot({ status }: { status: string }) {
    return (
        <span
            className={cn(
                "size-1.5 rounded-full inline-block",
                status === "complete" && "bg-cyan-400",
                status === "processing" && "bg-yellow-400 animate-pulse",
                status === "error" && "bg-red-400",
                status === "pending" && "bg-white/20",
            )}
        />
    );
}

function AssetBadge({
    icon: Icon,
    status,
    label,
}: {
    icon: React.FC<{ className?: string }>;
    status: string;
    label: string;
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-1 rounded-md px-2 py-0.5 text-xs",
                status === "complete" && "bg-cyan-500/15 text-cyan-300",
                status === "processing" && "bg-yellow-500/15 text-yellow-300",
                status === "error" && "bg-red-500/15 text-red-300",
                status === "pending" && "bg-white/5 text-white/30",
            )}
        >
            <Icon className="size-3" />
            <StatusDot status={status} />
            <span>{label}</span>
        </div>
    );
}

export function SceneTimeline({ scenes, totalDurationSeconds }: SceneTimelineProps) {
    const total = totalDurationSeconds ?? scenes.reduce((s, c) => s + c.duration_seconds, 0);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white/70">Scene Timeline</h4>
                {total > 0 && (
                    <span className="text-xs text-white/40">
                        {Math.floor(total / 60)}m {total % 60}s total
                    </span>
                )}
            </div>

            {/* Timeline bar */}
            <div className="flex h-2 rounded-full overflow-hidden gap-px mb-4">
                {scenes.map((scene) => {
                    const pct = total > 0 ? (scene.duration_seconds / total) * 100 : 100 / scenes.length;
                    const hasVideo =
                        scene.avatar_status === "complete" || scene.broll_status === "complete";
                    return (
                        <div
                            key={scene.id}
                            className={cn(
                                "h-full rounded-sm transition-all",
                                hasVideo ? "bg-cyan-500" : "bg-white/15",
                            )}
                            style={{ width: `${pct}%` }}
                            title={`Scene ${scene.scene_number} — ${scene.duration_seconds}s`}
                        />
                    );
                })}
            </div>

            {/* Scene list */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {scenes.map((scene) => {
                    const dialogue = scene.dialogue_line || scene.dialogue || "";
                    return (
                        <div
                            key={scene.id}
                            className="flex items-start gap-3 rounded-lg bg-white/5 px-3 py-2.5 text-sm"
                        >
                            <span className="text-xs text-white/30 tabular-nums w-5 pt-0.5 shrink-0">
                                {String(scene.scene_number).padStart(2, "0")}
                            </span>
                            <div className="flex-1 min-w-0 space-y-1.5">
                                {dialogue && (
                                    <p className="text-white/70 text-xs line-clamp-2">{dialogue}</p>
                                )}
                                <div className="flex flex-wrap gap-1.5">
                                    <AssetBadge icon={Mic} status={scene.audio_status} label="Audio" />
                                    <AssetBadge icon={User} status={scene.avatar_status} label="Avatar" />
                                    <AssetBadge icon={Film} status={scene.broll_status} label="B-Roll" />
                                </div>
                            </div>
                            <span className="text-xs text-white/25 tabular-nums shrink-0 pt-0.5">
                                {scene.duration_seconds}s
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
