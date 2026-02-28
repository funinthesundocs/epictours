"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface HeyGenAvatar {
    avatar_id: string;
    avatar_name: string;
    gender: string;
    preview_image_url?: string;
    preview_video_url?: string;
}

interface AvatarSelectorProps {
    selectedAvatarId: string | null;
    onSelect: (avatarId: string) => void;
}

export function AvatarSelector({ selectedAvatarId, onSelect }: AvatarSelectorProps) {
    const [avatars, setAvatars] = useState<HeyGenAvatar[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/remix/avatar/avatars")
            .then((r) => r.json())
            .then((data) => {
                if (data.success) setAvatars(data.data);
            })
            .catch(() => toast.error("Failed to load avatars"))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading avatars...</span>
            </div>
        );
    }

    if (avatars.length === 0) {
        return (
            <div className="text-center py-6 text-sm text-muted-foreground">
                No avatars available. Check your HeyGen account.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-medium text-foreground">Select Avatar</h4>
                {selectedAvatarId && (
                    <span className="text-[10px] text-primary ml-auto flex items-center gap-1">
                        <Check className="h-3 w-3" /> Selected
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                {avatars.map((avatar) => {
                    const isSelected = avatar.avatar_id === selectedAvatarId;

                    return (
                        <div
                            key={avatar.avatar_id}
                            onClick={() => onSelect(avatar.avatar_id)}
                            className={cn(
                                "relative border rounded-lg overflow-hidden cursor-pointer transition-all",
                                isSelected
                                    ? "border-primary ring-1 ring-primary/20"
                                    : "border-border hover:border-primary/30"
                            )}
                        >
                            {avatar.preview_image_url ? (
                                <img
                                    src={avatar.preview_image_url}
                                    alt={avatar.avatar_name}
                                    className="w-full aspect-[3/4] object-cover"
                                />
                            ) : (
                                <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
                                    <User className="h-8 w-8 text-muted-foreground" />
                                </div>
                            )}

                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                <p className="text-[10px] font-medium text-white truncate">
                                    {avatar.avatar_name}
                                </p>
                                <p className="text-[9px] text-white/60 capitalize">{avatar.gender}</p>
                            </div>

                            {isSelected && (
                                <div className="absolute top-1.5 right-1.5 bg-primary rounded-full p-0.5">
                                    <Check className="h-2.5 w-2.5 text-white" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
