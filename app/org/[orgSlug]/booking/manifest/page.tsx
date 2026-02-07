"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Manifest View Page - Redirects to Master Report with Today preset
 */
export default function ManifestPage() {
    const params = useParams();
    const router = useRouter();
    const orgSlug = params.orgSlug as string;

    useEffect(() => {
        router.replace(`/org/${orgSlug}/finance/reports?preset=today`);
    }, [orgSlug, router]);

    return null;
}
