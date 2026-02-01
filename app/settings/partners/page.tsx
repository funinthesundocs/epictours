"use client";

import { PageShell } from "@/components/shell/page-shell";
import { Handshake, Plus, Loader2 } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { usePartners } from "@/features/partners/hooks/use-partners";
import { PartnersTable } from "@/features/partners/components/partners-table";
import { PartnerInviteSheet } from "@/features/partners/components/partner-invite-sheet";

export default function SettingsPartnersPage() {
    const { partners, isLoading, invitePartner, revokeAccess } = usePartners();
    const [roles, setRoles] = useState<any[]>([]);
    const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);

    useEffect(() => {
        // Fetch roles for the invite sheet
        const fetchRoles = async () => {
            const { data } = await supabase.from("roles").select("id, name, description").order("name");
            setRoles(data || []);
        };
        fetchRoles();
    }, []);

    return (
        <PageShell
            title="Partners & Affiliates"
            description="Manage external access to your organization."
            icon={Handshake}
            action={
                <button
                    onClick={() => setIsInviteSheetOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg text-sm transition-colors"
                >
                    <Plus size={16} />
                    Invite Partner
                </button>
            }
            className="flex flex-col"
            style={{ height: 'calc(100vh / var(--zoom-factor, 1) - 4rem)' }}
            contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col p-4 md:p-6"
        >
            <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-card">
                {isLoading ? (
                    <LoadingState message="Loading partners..." />
                ) : (
                    <PartnersTable
                        data={partners}
                        onRevoke={revokeAccess}
                    />
                )}
            </div>

            <PartnerInviteSheet
                isOpen={isInviteSheetOpen}
                onClose={() => setIsInviteSheetOpen(false)}
                onInvite={invitePartner}
                availableRoles={roles}
            />
        </PageShell>
    );
}
