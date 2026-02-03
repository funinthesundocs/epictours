"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { supabase } from "@/lib/supabase";

/**
 * Layout for org-scoped admin routes.
 * Automatically sets the admin org context based on the URL slug.
 */
export default function OrgScopedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const router = useRouter();
    const { user, isPlatformAdmin, setAdminOrgContext, adminSelectedOrg } = useAuth();

    const orgSlug = params.orgSlug as string;

    // Set org context from URL slug
    useEffect(() => {
        if (!isPlatformAdmin()) {
            // Non-admins shouldn't access these routes
            router.replace("/");
            return;
        }

        if (!orgSlug) return;

        // If we already have the right org selected, skip
        if (adminSelectedOrg?.slug === orgSlug) return;

        // Fetch org by slug and set context
        const syncOrg = async () => {
            try {
                const { data, error } = await supabase
                    .from("organizations")
                    .select("id")
                    .eq("slug", orgSlug)
                    .single();

                if (error || !data) {
                    console.error("Org not found:", orgSlug);
                    router.replace("/admin/organizations");
                    return;
                }

                await setAdminOrgContext(data.id);
            } catch (err) {
                console.error("Failed to set org context:", err);
            }
        };

        syncOrg();
    }, [orgSlug, isPlatformAdmin, setAdminOrgContext, adminSelectedOrg?.slug, router]);

    // Show loading while org context isn't ready
    if (!adminSelectedOrg || adminSelectedOrg.slug !== orgSlug) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return <>{children}</>;
}
