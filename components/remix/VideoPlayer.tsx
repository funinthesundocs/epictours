"use client";

import { useRef, useState } from "react";
import { Play, Pause, Download, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
    signedUrl: string;
    title?: string;
    durationSeconds?: number;
}

function formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
}

export function VideoPlayer({ signedUrl, title, durationSeconds }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(durationSeconds ?? 0);

    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (playing) {
            v.pause();
        } else {
            v.play();
        }
        setPlaying(!playing);
    };

    const toggleMute = () => {
        const v = videoRef.current;
        if (!v) return;
        v.muted = !muted;
        setMuted(!muted);
    };

    const handleFullscreen = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.requestFullscreen) v.requestFullscreen();
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = videoRef.current;
        if (!v) return;
        const t = Number(e.target.value);
        v.currentTime = t;
        setCurrentTime(t);
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="rounded-xl border border-white/10 bg-black overflow-hidden group">
            {/* Video element */}
            <div className="relative aspect-video bg-black">
                <video
                    ref={videoRef}
                    src={signedUrl}
                    className="w-full h-full object-contain"
                    onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
                    onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? durationSeconds ?? 0)}
                    onEnded={() => setPlaying(false)}
                    onClick={togglePlay}
                />
                {/* Play overlay */}
                {!playing && (
                    <button
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                    >
                        <div className="size-16 rounded-full bg-cyan-500/90 flex items-center justify-center shadow-lg">
                            <Play className="size-7 text-white ml-1" />
                        </div>
                    </button>
                )}
            </div>

            {/* Controls */}
            <div className="bg-white/5 px-4 py-3 space-y-2">
                {title && (
                    <p className="text-sm font-medium text-white truncate">{title}</p>
                )}
                {/* Seekbar */}
                <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 accent-cyan-500 cursor-pointer"
                />
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-white/70 hover:text-white hover:bg-white/10"
                            onClick={togglePlay}
                        >
                            {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-white/70 hover:text-white hover:bg-white/10"
                            onClick={toggleMute}
                        >
                            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                        </Button>
                        <span className="text-xs text-white/40 ml-1 tabular-nums">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-white/70 hover:text-white hover:bg-white/10"
                            onClick={handleFullscreen}
                        >
                            <Maximize2 className="size-4" />
                        </Button>
                        <a href={signedUrl} download>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-white/70 hover:text-white hover:bg-white/10"
                            >
                                <Download className="size-4" />
                            </Button>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
