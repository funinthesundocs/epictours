"use client";

import { Clapperboard, Clock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  remix_sources?: { cached_title?: string; scraper_item_id: string }[];
}

interface ProjectCardProps {
  project: Project;
  onClick?: (projectId: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  draft: { label: "Draft", icon: Clock, color: "text-muted-foreground" },
  remixing: { label: "Remixing", icon: Loader2, color: "text-primary" },
  awaiting_approval: { label: "Awaiting Approval", icon: AlertCircle, color: "text-amber-500" },
  generating: { label: "Generating", icon: Loader2, color: "text-primary" },
  assembling: { label: "Assembling", icon: Loader2, color: "text-primary" },
  complete: { label: "Complete", icon: CheckCircle2, color: "text-emerald-500" },
  error: { label: "Error", icon: AlertCircle, color: "text-destructive" },
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const status = STATUS_CONFIG[project.status] || STATUS_CONFIG.draft;
  const StatusIcon = status.icon;
  const isAnimated = ["remixing", "generating", "assembling"].includes(project.status);
  const sourceCount = project.remix_sources?.length || 0;

  return (
    <div
      className="group border border-border rounded-lg bg-card overflow-hidden hover:border-primary/40 transition-colors cursor-pointer"
      onClick={() => onClick?.(project.id)}
    >
      {/* Header with status accent */}
      <div className={cn(
        "h-1.5 w-full",
        project.status === "complete" && "bg-emerald-500",
        project.status === "error" && "bg-destructive",
        project.status === "awaiting_approval" && "bg-amber-500",
        ["remixing", "generating", "assembling"].includes(project.status) && "bg-primary",
        project.status === "draft" && "bg-muted",
      )} />

      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">{project.name}</h3>
          <Clapperboard className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>

        {project.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
        )}

        {/* Source info */}
        <p className="text-xs text-muted-foreground">
          {sourceCount} source{sourceCount !== 1 ? "s" : ""}
        </p>

        {/* Status + date */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className={cn("flex items-center gap-1.5 text-xs", status.color)}>
            <StatusIcon className={cn("h-3.5 w-3.5", isAnimated && "animate-spin")} />
            <span className="font-medium">{status.label}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {new Date(project.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
