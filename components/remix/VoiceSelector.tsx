"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Square, Check, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Voice {
    voice_id: string;
    name: string;
    category: string;
    labels?: Record<string, string>;
    preview_url?: string;
}

interface VoiceSelectorProps {
    selectedVoiceId: string | null;
    onSelect: (voiceId: string) => void;
    previewText?: string;
}

export function VoiceSelector({ selectedVoiceId, onSelect, previewText }: VoiceSelectorProps) {
    const [voices, setVoices] = useState<Voice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [previewingId, setPreviewingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        fetch("/api/remix/audio/voices")
            .then((r) => r.json())
            .then((data) => {
                if (data.success) setVoices(data.data);
            })
            .catch(() => toast.error("Failed to load voices"))
            .finally(() => setIsLoading(false));
    }, []);

    const handlePreview = async (voice: Voice, e: React.MouseEvent) => {
        e.stopPropagation();

        // Stop any existing preview
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        if (previewingId === voice.voice_id) {
            setPreviewingId(null);
            return;
        }

        // Use ElevenLabs preview_url if available
        if (voice.preview_url) {
            setPreviewingId(voice.voice_id);
            const audio = new Audio(voice.preview_url);
            audioRef.current = audio;
            audio.onended = () => setPreviewingId(null);
            audio.onerror = () => setPreviewingId(null);
            audio.play().catch(() => setPreviewingId(null));
            return;
        }

        // Fall back to our preview endpoint
        if (!previewText) {
            toast.error("No preview text available");
            return;
        }

        setPreviewingId(voice.voice_id);
        try {
            const res = await fetch("/api/remix/audio/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: previewText.slice(0, 200), voiceId: voice.voice_id }),
            });

            if (!res.ok) throw new Error("Preview failed");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => {
                setPreviewingId(null);
                URL.revokeObjectURL(url);
            };
            audio.onerror = () => {
                setPreviewingId(null);
                URL.revokeObjectURL(url);
            };
            audio.play().catch(() => setPreviewingId(null));
        } catch {
            toast.error("Failed to preview voice");
            setPreviewingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading voices...</span>
            </div>
        );
    }

    const grouped = voices.reduce<Record<string, Voice[]>>((acc, v) => {
        const cat = v.category || "other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(v);
        return acc;
    }, {});

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-medium text-foreground">Select Voice</h4>
                {selectedVoiceId && (
                    <span className="text-[10px] text-primary ml-auto flex items-center gap-1">
                        <Check className="h-3 w-3" /> Selected
                    </span>
                )}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                {Object.entries(grouped).map(([category, catVoices]) => (
                    <div key={category} className="space-y-1.5">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1">
                            {category}
                        </p>
                        {catVoices.map((voice) => {
                            const isSelected = voice.voice_id === selectedVoiceId;
                            const isPreviewing = previewingId === voice.voice_id;

                            return (
                                <div
                                    key={voice.voice_id}
                                    onClick={() => onSelect(voice.voice_id)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                                        isSelected
                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                            : "border-border bg-card hover:border-primary/30"
                                    )}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-xs font-medium truncate",
                                            isSelected ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {voice.name}
                                        </p>
                                        {voice.labels && Object.keys(voice.labels).length > 0 && (
                                            <p className="text-[10px] text-muted-foreground truncate">
                                                {Object.values(voice.labels).slice(0, 3).join(" · ")}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        onClick={(e) => handlePreview(voice, e)}
                                        className={cn(
                                            "p-1.5 rounded-md transition-colors shrink-0",
                                            isPreviewing
                                                ? "bg-primary/10 text-primary"
                                                : "hover:bg-muted text-muted-foreground"
                                        )}
                                        title={isPreviewing ? "Stop preview" : "Preview voice"}
                                    >
                                        {isPreviewing ? (
                                            <Square className="h-3 w-3" />
                                        ) : (
                                            <Play className="h-3 w-3" />
                                        )}
                                    </button>

                                    {isSelected && (
                                        <Check className="h-4 w-4 text-primary shrink-0" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
