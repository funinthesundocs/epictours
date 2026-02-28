"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/shell/page-shell";
import { UrlInput } from "@/components/scraper/UrlInput";
import { BatchUrlInput } from "@/components/scraper/BatchUrlInput";
import { JobCard } from "@/components/scraper/JobCard";
import { useAuth } from "@/features/auth/auth-context";
import { supabase } from "@/lib/supabase";
import { Scan, Loader2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Job {
    id: string;
    source_url: string;
    source_type: string;
    status: string;
    progress: number;
    items_found: number;
    assets_found: number;
    error_message?: string;
    created_at: string;
    started_at?: string;
    completed_at?: string;
    item_title?: string | null;
    thumbnail_signed_url?: string | null;
}

export default function ScraperPage() {
    const { user, effectiveOrganizationId } = useAuth();
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBatchMode, setIsBatchMode] = useState(false);

    const fetchJobs = useCallback(async () => {
        if (!effectiveOrganizationId) return;
        try {
            const res = await fetch(`/api/scraper/jobs?orgId=${effectiveOrganizationId}&pageSize=50`);
            const data = await res.json();
            if (data.success) {
                setJobs(data.data || []);
            }
        } catch {
            // Silent fail
        } finally {
            setIsLoading(false);
        }
    }, [effectiveOrganizationId]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Realtime subscription for job updates
    useEffect(() => {
        if (!effectiveOrganizationId) return;

        const channel = supabase
            .channel("scraper-jobs")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "scraper_jobs",
                    filter: `org_id=eq.${effectiveOrganizationId}`,
                },
                () => {
                    fetchJobs();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [effectiveOrganizationId, fetchJobs]);

    const handleSubmit = async (url: string, config: Record<string, any>) => {
        if (!effectiveOrganizationId || !user) return;
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/scraper/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url,
                    config,
                    orgId: effectiveOrganizationId,
                    userId: user.id,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Scrape job started");
                fetchJobs();
            } else {
                toast.error(data.error?.message || "Failed to start scrape");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to submit");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBatchSubmit = async (urls: string[], config: Record<string, any>) => {
        if (!effectiveOrganizationId || !user) return;
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/scraper/scrape/batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    urls,
                    config,
                    orgId: effectiveOrganizationId,
                    userId: user.id,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Started ${data.data.succeeded} of ${data.data.total} scrape jobs`);
                fetchJobs();
            } else {
                toast.error(data.error?.message || "Failed to start batch");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to submit batch");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async (jobId: string) => {
        try {
            const res = await fetch(`/api/scraper/jobs/${jobId}/cancel`, { method: "POST" });
            const data = await res.json();
            if (data.success) {
                toast.success("Job cancelled");
                fetchJobs();
            } else {
                toast.error(data.error?.message || "Failed to cancel");
            }
        } catch {
            toast.error("Failed to cancel job");
        }
    };

    const handleDeleteJob = async (jobId: string) => {
        try {
            const res = await fetch(`/api/scraper/jobs/${jobId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                toast.success("Job deleted");
                fetchJobs();
            } else {
                toast.error(data.error?.message || "Failed to delete");
            }
        } catch {
            toast.error("Failed to delete job");
        }
    };

    const handleJobClick = (jobId: string) => {
        const job = jobs.find((j) => j.id === jobId);
        if (job?.status === "complete" && job.items_found > 0) {
            router.push(`library`);
        }
    };

    const activeJobs = jobs.filter((j) => ["queued", "detecting", "scraping", "processing"].includes(j.status));
    const completedJobs = jobs.filter((j) => !["queued", "detecting", "scraping", "processing"].includes(j.status));

    return (
        <PageShell
            title="Scraper"
            description="Extract content from any URL — web pages, YouTube, social media, and more."
            icon={Scan}
            action={
                <Button
                    variant={isBatchMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsBatchMode(!isBatchMode)}
                >
                    <Layers className="h-3.5 w-3.5 mr-1.5" />
                    {isBatchMode ? "Single Mode" : "Batch Mode"}
                </Button>
            }
        >
            <div className="space-y-6">
                {/* URL Input */}
                {isBatchMode ? (
                    <BatchUrlInput onSubmit={handleBatchSubmit} isSubmitting={isSubmitting} />
                ) : (
                    <UrlInput onSubmit={handleSubmit} isSubmitting={isSubmitting} />
                )}

                {/* Active Jobs */}
                {activeJobs.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-foreground">
                            Active Jobs
                            <span className="ml-2 text-xs text-muted-foreground font-normal">({activeJobs.length})</span>
                        </h3>
                        <div className="space-y-2">
                            {activeJobs.map((job) => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    onCancel={handleCancel}
                                    onDelete={handleDeleteJob}
                                    onClick={handleJobClick}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Jobs */}
                {completedJobs.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-foreground">
                            Recent Jobs
                            <span className="ml-2 text-xs text-muted-foreground font-normal">({completedJobs.length})</span>
                        </h3>
                        <div className="space-y-2">
                            {completedJobs.map((job) => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    onDelete={handleDeleteJob}
                                    onClick={handleJobClick}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && jobs.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-24 h-24 -inset-6 bg-primary/20 blur-2xl rounded-full" />
                            <Scan size={48} className="text-primary relative z-10" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-semibold text-foreground">No scrape jobs yet</h3>
                            <p className="text-sm text-muted-foreground">
                                Paste a URL above to get started, or switch to batch mode for multiple URLs
                            </p>
                        </div>
                    </div>
                )}

                {isLoading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}
            </div>
        </PageShell>
    );
}
