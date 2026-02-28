"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/shell/page-shell";
import { ProjectCard } from "@/components/remix/ProjectCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { Clapperboard, Plus, Loader2 } from "lucide-react";

interface Project {
    id: string;
    name: string;
    description?: string;
    status: string;
    created_at: string;
    remix_sources?: { cached_title?: string; scraper_item_id: string }[];
}

export default function RemixDashboardPage() {
    const { effectiveOrganizationId } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProjects = useCallback(async () => {
        if (!effectiveOrganizationId) return;
        try {
            const res = await fetch(`/api/remix/projects?orgId=${effectiveOrganizationId}`);
            const data = await res.json();
            if (data.success) {
                setProjects(data.data || []);
            }
        } catch {
            // Silent fail
        } finally {
            setIsLoading(false);
        }
    }, [effectiveOrganizationId]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleProjectClick = (projectId: string) => {
        router.push(`remix/${projectId}`);
    };

    return (
        <PageShell
            title="Remix Studio"
            description="AI-powered video remixing from your content library."
            icon={Clapperboard}
            action={
                <Button size="sm" onClick={() => router.push("remix/new")}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    New Project
                </Button>
            }
        >
            <div className="space-y-6">
                {isLoading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {!isLoading && projects.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {projects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onClick={handleProjectClick}
                            />
                        ))}
                    </div>
                )}

                {!isLoading && projects.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-24 h-24 -inset-6 bg-primary/20 blur-2xl rounded-full" />
                            <Clapperboard size={48} className="text-primary relative z-10" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-semibold text-foreground">No remix projects yet</h3>
                            <p className="text-sm text-muted-foreground">
                                Create a new project to start remixing content from your Library
                            </p>
                        </div>
                        <Button onClick={() => router.push("remix/new")}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Project
                        </Button>
                    </div>
                )}
            </div>
        </PageShell>
    );
}
