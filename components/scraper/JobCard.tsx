"use client";

import { SourceTypeIcon } from "./SourceTypeIcon";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, CheckCircle2, AlertCircle, Loader2, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

interface JobCardProps {
  job: Job;
  onCancel?: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
  onClick?: (jobId: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  queued: { label: "Queued", color: "text-muted-foreground", icon: Clock },
  detecting: { label: "Detecting", color: "text-blue-400", icon: Loader2 },
  scraping: { label: "Scraping", color: "text-cyan-400", icon: Loader2 },
  processing: { label: "Processing", color: "text-amber-400", icon: Loader2 },
  complete: { label: "Complete", color: "text-emerald-400", icon: CheckCircle2 },
  error: { label: "Error", color: "text-destructive", icon: AlertCircle },
  cancelled: { label: "Cancelled", color: "text-muted-foreground", icon: X },
};

export function JobCard({ job, onCancel, onDelete, onClick }: JobCardProps) {
  const status = statusConfig[job.status] || statusConfig.queued;
  const StatusIcon = status.icon;
  const isActive = ["queued", "detecting", "scraping", "processing"].includes(job.status);

  const domain = (() => {
    try { return new URL(job.source_url).hostname.replace("www.", ""); } catch { return job.source_url; }
  })();

  return (
    <div
      className={cn(
        "border border-border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors cursor-pointer",
        isActive && "border-primary/30"
      )}
      onClick={() => onClick?.(job.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <SourceTypeIcon sourceType={job.source_type} className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{domain}</p>
            <p className="text-xs text-muted-foreground truncate">{job.source_url}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={cn("flex items-center gap-1 text-xs", status.color)}>
            <StatusIcon className={cn("h-3.5 w-3.5", isActive && "animate-spin")} />
            {status.label}
          </div>
          {isActive && onCancel && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => { e.stopPropagation(); onCancel(job.id); }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(job.id); }}
              title="Delete job"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {isActive && (
        <div className="mt-3">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${job.progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{job.progress}%</p>
        </div>
      )}

      {job.status === "complete" && (
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          {job.items_found > 0 && <span>{job.items_found} item{job.items_found !== 1 ? "s" : ""}</span>}
          {job.assets_found > 0 && <span>{job.assets_found} asset{job.assets_found !== 1 ? "s" : ""}</span>}
        </div>
      )}

      {job.status === "error" && job.error_message && (
        <p className="mt-2 text-xs text-destructive truncate">{job.error_message}</p>
      )}
    </div>
  );
}
