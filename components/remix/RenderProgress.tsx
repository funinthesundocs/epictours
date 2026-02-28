"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RenderProgressProps {
    jobId: string;
    onComplete: (signedUrl: string) => void;
}

type JobStatus = "queued" | "processing" | "complete" | "error" | "cancelled";

interface JobState {
    status: JobStatus;
    progress: number;
    errorMessage: string | null;
    signedUrl: string | null;
    startedAt: string | null;
}

const POLL_INTERVAL_MS = 3000;

export function RenderProgress({ jobId, onComplete }: RenderProgressProps) {
    const [job, setJob] = useState<JobState>({
        status: "queued",
        progress: 0,
        errorMessage: null,
        signedUrl: null,
        startedAt: null,
    });
    const [polling, setPolling] = useState(true);

    const poll = useCallback(async () => {
        try {
            const res = await fetch(`/api/remix/render/status/${jobId}`);
            const data = await res.json();
            if (!data.success) return;

            const j = data.job;
            setJob({
                status: j.status,
                progress: j.progress ?? 0,
                errorMessage: j.errorMessage ?? null,
                signedUrl: j.signedUrl ?? null,
                startedAt: j.startedAt ?? null,
            });

            if (j.status === "complete") {
                setPolling(false);
                if (j.signedUrl) onComplete(j.signedUrl);
            } else if (j.status === "error") {
                setPolling(false);
                toast.error(`Render failed: ${j.errorMessage || "Unknown error"}`);
            }
        } catch {
            // swallow poll errors — retry next interval
        }
    }, [jobId, onComplete]);

    useEffect(() => {
        if (!polling) return;
        poll();
        const id = setInterval(poll, POLL_INTERVAL_MS);
        return () => clearInterval(id);
    }, [polling, poll]);

    const elapsedSeconds = job.startedAt
        ? Math.round((Date.now() - new Date(job.startedAt).getTime()) / 1000)
        : 0;

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
                {job.status === "complete" ? (
                    <CheckCircle className="size-5 text-cyan-400" />
                ) : job.status === "error" ? (
                    <XCircle className="size-5 text-red-400" />
                ) : (
                    <Film className="size-5 text-cyan-400" />
                )}
                <h3 className="font-semibold text-white">
                    {job.status === "queued" && "Render queued…"}
                    {job.status === "processing" && `Rendering… ${job.progress}%`}
                    {job.status === "complete" && "Render complete"}
                    {job.status === "error" && "Render failed"}
                </h3>
            </div>

            {/* Progress bar */}
            {(job.status === "queued" || job.status === "processing") && (
                <div className="space-y-1.5">
                    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                            style={{ width: `${job.progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-white/40">
                        <span>{job.progress}% complete</span>
                        {elapsedSeconds > 0 && <span>{elapsedSeconds}s elapsed</span>}
                    </div>
                </div>
            )}

            {job.status === "error" && job.errorMessage && (
                <p className="text-sm text-red-400/90 bg-red-500/10 rounded-lg px-3 py-2">
                    {job.errorMessage}
                </p>
            )}

            {job.status === "processing" && (
                <div className="flex items-center gap-2 text-sm text-white/50">
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Assembling video with ffmpeg…</span>
                </div>
            )}
        </div>
    );
}
