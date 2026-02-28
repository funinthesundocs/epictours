"use client";

import { useState, useEffect } from "react";
import { FileText, Image as ImageIcon, HardDrive, Star, FolderOpen, Activity } from "lucide-react";

interface Stats {
  totalItems: number;
  totalAssets: number;
  totalStorageBytes: number;
  starredCount: number;
  collectionsCount: number;
  activeJobs: number;
  bySourceType: Record<string, number>;
}

interface StatsBarProps {
  orgId: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function StatsBar({ orgId }: StatsBarProps) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!orgId) return;
    fetch(`/api/scraper/stats?orgId=${orgId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStats(d.data);
      })
      .catch(() => {});
  }, [orgId]);

  if (!stats) return null;

  const items = [
    { icon: FileText, label: "Items", value: stats.totalItems },
    { icon: ImageIcon, label: "Assets", value: stats.totalAssets },
    { icon: HardDrive, label: "Storage", value: formatBytes(stats.totalStorageBytes) },
    { icon: Star, label: "Starred", value: stats.starredCount },
    { icon: FolderOpen, label: "Collections", value: stats.collectionsCount },
    ...(stats.activeJobs > 0
      ? [{ icon: Activity, label: "Active", value: stats.activeJobs }]
      : []),
  ];

  return (
    <div className="flex flex-wrap gap-4 px-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{item.value}</span>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
