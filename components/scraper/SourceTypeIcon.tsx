import { Globe, FileText, Github, Camera, Video, Twitter, BookOpen, Rss, File, Code } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceTypeIconProps {
    sourceType: string;
    className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
    youtube: Video,
    twitter: Twitter,
    instagram: Camera,
    tiktok: Video,
    facebook: Globe,
    linkedin: Globe,
    github: Github,
    google_doc: FileText,
    google_drive: File,
    pdf: FileText,
    markdown: Code,
    rss: Rss,
    article: BookOpen,
    website: Globe,
};

export function SourceTypeIcon({ sourceType, className }: SourceTypeIconProps) {
    const Icon = iconMap[sourceType] || Globe;
    return <Icon className={cn("text-primary", className)} size={18} />;
}
