"use client";

import { Handshake, MoreHorizontal, Shield, Trash2, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AlertDialog } from "@/components/ui/alert-dialog";
import type { PartnerUser } from "@/features/partners/hooks/use-partners";

interface PartnersTableProps {
    data: PartnerUser[];
    onRevoke: (id: string) => void;
}

export function PartnersTable({ data, onRevoke }: PartnersTableProps) {
    const [revokeId, setRevokeId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    };

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Handshake size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">No partners found</p>
                <p className="text-sm">Invite external collaborators to get started</p>
            </div>
        );
    }

    return (
        <>
            <div className="hidden md:block h-full overflow-auto">
                <table className="w-full">
                    <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm">
                        <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground">User</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground">Access Role</th>
                            <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground">Type</th>
                            <th className="text-center py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground">Status</th>
                            <th className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground">Added</th>
                            <th className="w-20 py-3 px-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(partner => (
                            <tr key={partner.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-600 flex items-center justify-center text-sm font-medium">
                                            {partner.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{partner.name}</p>
                                            <p className="text-xs text-muted-foreground">{partner.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <Shield size={14} className="text-muted-foreground" />
                                        <span className="text-sm">{partner.permission_group?.name || "No Access"}</span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-500 capitalize">
                                        {partner.relationship_type}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span className={cn(
                                        "px-2 py-0.5 text-xs rounded-full capitalize",
                                        partner.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                                    )}>
                                        {partner.status}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-muted-foreground">
                                    {formatDate(partner.created_at)}
                                </td>
                                <td className="py-3 px-4">
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === partner.id ? null : partner.id)}
                                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>
                                        {openMenuId === partner.id && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                                                <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-popover border border-border rounded-lg shadow-xl overflow-hidden">
                                                    <button
                                                        onClick={() => { setRevokeId(partner.id); setOpenMenuId(null); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                                    >
                                                        <UserX size={14} /> Revoke Access
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3 p-3">
                {data.map(partner => (
                    <div key={partner.id} className="bg-card rounded-xl p-4 border border-border">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-600 flex items-center justify-center font-medium">
                                    {partner.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-medium text-foreground">{partner.name}</div>
                                    <div className="text-xs text-muted-foreground">{partner.email}</div>
                                </div>
                            </div>
                            <span className={cn(
                                "px-2 py-0.5 text-xs rounded-full capitalize",
                                partner.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                            )}>
                                {partner.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                            <div className="bg-muted/30 p-2 rounded-lg">
                                <span className="text-xs text-muted-foreground block mb-0.5">Role</span>
                                <div className="flex items-center gap-1 font-medium">
                                    <Shield size={12} />
                                    {partner.permission_group?.name || "-"}
                                </div>
                            </div>
                            <div className="bg-muted/30 p-2 rounded-lg">
                                <span className="text-xs text-muted-foreground block mb-0.5">Type</span>
                                <div className="capitalize font-medium text-blue-500">
                                    {partner.relationship_type}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end pt-2 border-t border-border">
                            <button
                                onClick={() => setRevokeId(partner.id)}
                                className="text-xs text-destructive hover:underline flex items-center gap-1"
                            >
                                <UserX size={12} /> Revoke Access
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <AlertDialog
                isOpen={!!revokeId}
                onClose={() => setRevokeId(null)}
                title="Revoke Access?"
                description="This user will no longer be able to access your organization. You can re-invite them later."
                confirmLabel="Revoke Access"
                onConfirm={() => {
                    if (revokeId) {
                        onRevoke(revokeId);
                        setRevokeId(null);
                    }
                }}
                isDestructive={true}
            />
        </>
    );
}
