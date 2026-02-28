"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/shell/page-shell";
import { PipelineStepper, type PipelineStep } from "@/components/remix/PipelineStepper";
import { TitleVariations } from "@/components/remix/TitleVariations";
import { ThumbnailGrid } from "@/components/remix/ThumbnailGrid";
import { ScriptEditor } from "@/components/remix/ScriptEditor";
import { ApprovalGate } from "@/components/remix/ApprovalGate";
import { GeneratePanel } from "@/components/remix/GeneratePanel";
import { RenderProgress } from "@/components/remix/RenderProgress";
import { VideoPlayer } from "@/components/remix/VideoPlayer";
import { SceneTimeline } from "@/components/remix/SceneTimeline";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { supabase } from "@/lib/supabase";
import {
    Clapperboard, ArrowLeft, Loader2, Play, Film,
    FileText, DollarSign, Settings, Layers,
} from "lucide-react";
import { toast } from "sonner";

interface ProjectDetail {
    id: string;
    name: string;
    description?: string;
    status: string;
    settings: any;
    created_at: string;
    remix_sources: {
        id: string;
        scraper_item_id: string;
        cached_title?: string;
        cached_transcript?: string;
        cached_description?: string;
        is_primary: boolean;
    }[];
    remix_titles: { id: string; style: string; title: string; reasoning?: string; is_selected: boolean }[];
    remix_thumbnails: { id: string; prompt: string; file_path: string; is_selected: boolean; signed_url?: string; analysis?: any }[];
    remix_scripts: {
        id: string;
        full_script: string;
        tone: string;
        total_duration_seconds: number;
        is_selected: boolean;
        scenes?: {
            id: string;
            scene_number: number;
            dialogue_line: string;
            broll_description: string;
            on_screen_text?: string;
            duration_seconds: number;
            audio_status: string;
            avatar_status: string;
            broll_status: string;
        }[];
    }[];
    remix_jobs: { id: string; type: string; status: string; progress: number; error_message?: string }[];
}

function getActiveStep(project: ProjectDetail): PipelineStep {
    if (project.status === "complete") return "review";
    if (project.status === "assembling") return "review";
    if (project.status === "generating") return "generate";
    if (project.status === "awaiting_approval") return "approve";
    if (project.status === "remixing") return "remix";
    if (project.remix_titles.length > 0 || project.remix_thumbnails.length > 0 || project.remix_scripts.length > 0) return "remix";
    return "source";
}

export default function RemixProjectPage() {
    const params = useParams();
    const router = useRouter();
    const { effectiveOrganizationId } = useAuth();
    const projectId = params.projectId as string;

    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);
    const [isStartingRender, setIsStartingRender] = useState(false);

    const fetchProject = useCallback(async () => {
        try {
            const res = await fetch(`/api/remix/projects/${projectId}`);
            const data = await res.json();
            if (data.success) {
                setProject(data.data);
            }
        } catch {
            toast.error("Failed to load project");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchProject();
    }, [fetchProject]);

    // Realtime subscription for job updates
    useEffect(() => {
        if (!projectId) return;

        const channel = supabase
            .channel(`remix-jobs-${projectId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "remix_jobs",
                    filter: `project_id=eq.${projectId}`,
                },
                () => {
                    fetchProject();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId, fetchProject]);

    if (isLoading) {
        return (
            <PageShell title="Loading..." description="" icon={Clapperboard}>
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </PageShell>
        );
    }

    if (!project) {
        return (
            <PageShell title="Not Found" description="" icon={Clapperboard}>
                <div className="text-center py-16 text-muted-foreground">Project not found</div>
            </PageShell>
        );
    }

    const activeStep = getActiveStep(project);
    const primarySource = project.remix_sources.find((s) => s.is_primary);
    const hasTranscript = !!primarySource?.cached_transcript && primarySource.cached_transcript.length > 50;
    const selectedTitle = project.remix_titles.find((t) => t.is_selected);
    const selectedThumbnail = project.remix_thumbnails.find((t) => t.is_selected);
    const selectedScript = project.remix_scripts.find((s) => s.is_selected);
    const activeJobs = project.remix_jobs.filter((j) => ["queued", "processing"].includes(j.status));
    const renderJob = project.remix_jobs.find((j) => j.type === "render");
    const selectedScenes = selectedScript?.scenes ?? [];
    const readyScenesCount = selectedScenes.filter(
        (s) => s.avatar_status === "complete" || s.broll_status === "complete"
    ).length;

    const handleStartRemix = async () => {
        if (!primarySource || !hasTranscript) return;
        // Kick off title generation to start the remix pipeline
        try {
            const res = await fetch("/api/remix/title", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceId: primarySource.id,
                    projectId: project.id,
                    orgId: effectiveOrganizationId,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Remix pipeline started! Generating title variations...");
                fetchProject();
            } else {
                toast.error(data.error?.message || "Failed to start remix");
            }
        } catch {
            toast.error("Failed to start remix");
        }
    };

    // Approval gate checks
    const approvalChecks = [
        {
            label: "Title selected",
            satisfied: !!selectedTitle,
            detail: selectedTitle?.title,
        },
        {
            label: "Thumbnail selected",
            satisfied: !!selectedThumbnail,
            detail: selectedThumbnail ? "1 thumbnail selected" : undefined,
        },
        {
            label: "Script approved",
            satisfied: !!selectedScript,
            detail: selectedScript
                ? `${(selectedScript.scenes?.length ?? 0)} scenes, ${Math.round(selectedScript.total_duration_seconds / 60)}m`
                : undefined,
        },
    ];

    const handleStartRender = async () => {
        if (!effectiveOrganizationId) return;
        setIsStartingRender(true);
        try {
            const res = await fetch("/api/remix/render", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId: project.id, orgId: effectiveOrganizationId }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Render started!");
                fetchProject();
            } else {
                toast.error(data.error?.message || "Failed to start render");
            }
        } catch {
            toast.error("Failed to start render");
        } finally {
            setIsStartingRender(false);
        }
    };

    return (
        <PageShell
            title={project.name}
            description={project.description || "Remix project"}
            icon={Clapperboard}
            action={
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.push("../remix")}>
                        <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                        All Projects
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Pipeline stepper */}
                <PipelineStepper
                    currentStep={activeStep}
                    projectStatus={project.status}
                />

                {/* Source overview */}
                <div className="border border-border rounded-lg bg-card p-4 space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Source Material</h3>
                    {project.remix_sources.map((source) => (
                        <div key={source.id} className="flex items-center gap-3 text-sm">
                            <Film className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">{source.cached_title || "Untitled Source"}</span>
                            {source.cached_transcript && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {source.cached_transcript.split(/\s+/).length.toLocaleString()} words
                                </span>
                            )}
                            {source.is_primary && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Primary</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Step: Source — Ready to start */}
                {activeStep === "source" && (
                    <div className="border border-border rounded-lg bg-card p-6 space-y-4">
                        <div className="text-center space-y-2">
                            <h3 className="text-sm font-medium text-foreground">Ready to Remix</h3>
                            <p className="text-xs text-muted-foreground">
                                {hasTranscript
                                    ? "Source material is loaded with transcript. Start the remix pipeline to generate titles, thumbnails, and a new script."
                                    : "Source material is loaded but no transcript was found. A transcript is needed for full remixing."}
                            </p>
                        </div>
                        <div className="flex justify-center">
                            <Button disabled={!hasTranscript} onClick={handleStartRemix}>
                                <Play className="h-4 w-4 mr-2" />
                                Start Remix
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step: Remix — Title, Thumbnail, Script */}
                {activeStep === "remix" && primarySource && (
                    <div className="space-y-6">
                        {/* Titles */}
                        <div className="border border-border rounded-lg bg-card p-5">
                            <TitleVariations
                                projectId={project.id}
                                sourceId={primarySource.id}
                                orgId={effectiveOrganizationId || ""}
                                titles={project.remix_titles}
                                onTitlesChange={fetchProject}
                            />
                        </div>

                        {/* Thumbnails */}
                        <div className="border border-border rounded-lg bg-card p-5">
                            <ThumbnailGrid
                                projectId={project.id}
                                sourceId={primarySource.id}
                                orgId={effectiveOrganizationId || ""}
                                thumbnails={project.remix_thumbnails}
                                onThumbnailsChange={fetchProject}
                                disabled={project.remix_titles.length === 0}
                            />
                        </div>

                        {/* Script */}
                        <div className="border border-border rounded-lg bg-card p-5">
                            <ScriptEditor
                                projectId={project.id}
                                sourceId={primarySource.id}
                                orgId={effectiveOrganizationId || ""}
                                scripts={project.remix_scripts}
                                onScriptsChange={fetchProject}
                                disabled={project.remix_titles.length === 0}
                            />
                        </div>

                        {/* Approval gate (shown when all three have content) */}
                        {project.remix_titles.length > 0 &&
                         project.remix_thumbnails.length > 0 &&
                         project.remix_scripts.length > 0 && (
                            <ApprovalGate
                                projectId={project.id}
                                orgId={effectiveOrganizationId || ""}
                                checks={approvalChecks}
                                onApproved={fetchProject}
                            />
                        )}
                    </div>
                )}

                {/* Step: Approve */}
                {activeStep === "approve" && (
                    <div className="space-y-6">
                        <ApprovalGate
                            projectId={project.id}
                            orgId={effectiveOrganizationId || ""}
                            checks={approvalChecks}
                            onApproved={fetchProject}
                        />

                        {/* Summary of selections */}
                        <div className="border border-border rounded-lg bg-card p-5 space-y-4">
                            <h3 className="text-sm font-medium text-foreground">Selected Remix</h3>

                            {selectedTitle && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Title</p>
                                    <p className="text-sm text-foreground">{selectedTitle.title}</p>
                                </div>
                            )}

                            {selectedScript && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Script</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(selectedScript.scenes?.length ?? 0)} scenes, ~{Math.round(selectedScript.total_duration_seconds / 60)}m duration, {selectedScript.tone} tone
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step: Generate */}
                {activeStep === "generate" && (
                    <div className="space-y-4">
                        <GeneratePanel
                            project={project}
                            orgId={effectiveOrganizationId || ""}
                            onRefresh={fetchProject}
                        />
                        {readyScenesCount > 0 && (
                            <div className="border border-border rounded-lg bg-card p-5 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium text-foreground">Ready to Assemble</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {readyScenesCount} of {selectedScenes.length} scenes have video assets. You can start rendering now.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleStartRender}
                                    disabled={isStartingRender}
                                >
                                    {isStartingRender ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Layers className="h-4 w-4 mr-2" />
                                    )}
                                    Render Video
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Step: Assemble + Review */}
                {activeStep === "review" && (
                    <div className="space-y-4">
                        {/* Scene timeline — always visible in review */}
                        {selectedScript && selectedScenes.length > 0 && (
                            <div className="border border-border rounded-lg bg-card p-5">
                                <SceneTimeline
                                    scenes={selectedScenes}
                                    totalDurationSeconds={selectedScript.total_duration_seconds}
                                />
                            </div>
                        )}

                        {/* No render job yet */}
                        {!renderJob && (
                            <div className="border border-border rounded-lg bg-card p-6 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium text-foreground">Assemble Final Video</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        ffmpeg will normalize and concatenate all scene clips into a single 1080p MP4.
                                    </p>
                                </div>
                                <Button onClick={handleStartRender} disabled={isStartingRender}>
                                    {isStartingRender ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Layers className="h-4 w-4 mr-2" />
                                    )}
                                    Start Render
                                </Button>
                            </div>
                        )}

                        {/* Render in progress */}
                        {renderJob && renderJob.status !== "complete" && renderJob.status !== "error" && (
                            <RenderProgress
                                jobId={renderJob.id}
                                onComplete={(url) => setRenderedVideoUrl(url)}
                            />
                        )}

                        {/* Render error */}
                        {renderJob?.status === "error" && (
                            <div className="border border-border rounded-lg bg-card p-6 space-y-3">
                                <p className="text-sm font-medium text-destructive">Render failed</p>
                                <p className="text-xs text-muted-foreground">
                                    {renderJob.error_message || "An error occurred during rendering."}
                                </p>
                                <Button variant="outline" size="sm" onClick={handleStartRender} disabled={isStartingRender}>
                                    Retry Render
                                </Button>
                            </div>
                        )}

                        {/* Rendered video player */}
                        {(renderJob?.status === "complete" || project.status === "complete") && renderedVideoUrl && (
                            <div className="border border-border rounded-lg bg-card p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-medium text-foreground">Final Video</h3>
                                    {selectedTitle && (
                                        <span className="text-xs text-muted-foreground">{selectedTitle.title}</span>
                                    )}
                                </div>
                                <VideoPlayer
                                    signedUrl={renderedVideoUrl}
                                    title={selectedTitle?.title}
                                    durationSeconds={selectedScript?.total_duration_seconds}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Cost estimate */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>Estimated cost will appear here once remix pipeline starts.</span>
                </div>
            </div>
        </PageShell>
    );
}
