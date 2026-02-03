"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Admin Dashboard entry point - redirects to Organizations as the main hub.
 */
export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/admin/organizations");
    }, [router]);

    return null;
}
