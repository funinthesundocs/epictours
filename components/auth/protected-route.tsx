"use client";

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { usePermissions } from '@/features/auth/use-permissions';
import { ModuleCode, PermissionAction } from '@/features/auth/types';
import { Loader2, ShieldAlert, Lock } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
    /**
     * Require access to a specific module
     */
    module?: ModuleCode;
    /**
     * Require a specific permission (module + resource + action)
     */
    permission?: {
        action: PermissionAction;
        module: ModuleCode;
        resource: string;
    };
    /**
     * Require platform admin access
     */
    requirePlatformAdmin?: boolean;
    /**
     * Require tenant admin access
     */
    requireTenantAdmin?: boolean;
    /**
     * Custom redirect URL when access is denied (default: /login or /)
     */
    redirectTo?: string;
    /**
     * Show access denied page instead of redirecting
     */
    showAccessDenied?: boolean;
    /**
     * Custom loading component
     */
    loadingComponent?: ReactNode;
}

/**
 * Protects a route based on authentication and permissions.
 * 
 * Usage in a page component:
 * 
 * export default function SettingsPage() {
 *   return (
 *     <ProtectedRoute requireTenantAdmin>
 *       <SettingsContent />
 *     </ProtectedRoute>
 *   );
 * }
 * 
 * Or with specific permission:
 * 
 * export default function CustomersPage() {
 *   return (
 *     <ProtectedRoute module="crm" permission={{ action: 'read', module: 'crm', resource: 'customers' }}>
 *       <CustomerList />
 *     </ProtectedRoute>
 *   );
 * }
 */
export function ProtectedRoute({
    children,
    module,
    permission,
    requirePlatformAdmin = false,
    requireTenantAdmin = false,
    redirectTo,
    showAccessDenied = false,
    loadingComponent,
}: ProtectedRouteProps) {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { hasModule, can, isPlatformAdmin, isTenantAdmin } = usePermissions();
    const [accessState, setAccessState] = useState<'loading' | 'allowed' | 'denied' | 'unauthenticated'>('loading');

    useEffect(() => {
        // Wait for auth to load
        if (authLoading) {
            setAccessState('loading');
            return;
        }

        // Check if user is authenticated
        if (!user) {
            setAccessState('unauthenticated');
            return;
        }

        // Check platform admin requirement
        if (requirePlatformAdmin && !isPlatformAdmin()) {
            setAccessState('denied');
            return;
        }

        // Check tenant admin requirement
        if (requireTenantAdmin && !isTenantAdmin() && !isPlatformAdmin()) {
            setAccessState('denied');
            return;
        }

        // Check module requirement
        if (module && !hasModule(module)) {
            setAccessState('denied');
            return;
        }

        // Check specific permission requirement
        if (permission && !can(permission.action, permission.module, permission.resource)) {
            setAccessState('denied');
            return;
        }

        // All checks passed
        setAccessState('allowed');
    }, [authLoading, user, module, permission, requirePlatformAdmin, requireTenantAdmin, hasModule, can, isPlatformAdmin, isTenantAdmin]);

    // Handle redirects
    useEffect(() => {
        if (accessState === 'unauthenticated') {
            router.replace(redirectTo || '/login');
        } else if (accessState === 'denied' && !showAccessDenied) {
            router.replace(redirectTo || '/');
        }
    }, [accessState, router, redirectTo, showAccessDenied]);

    // Loading state
    if (accessState === 'loading') {
        if (loadingComponent) {
            return <>{loadingComponent}</>;
        }
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                    <p className="text-sm text-zinc-500">Loading...</p>
                </div>
            </div>
        );
    }

    // Unauthenticated - will redirect
    if (accessState === 'unauthenticated') {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Lock className="w-12 h-12 text-zinc-600" />
                    <p className="text-sm text-zinc-500">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    // Access denied
    if (accessState === 'denied') {
        if (showAccessDenied) {
            return (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center gap-4 text-center max-w-md px-6">
                        <div className="p-4 rounded-full bg-red-500/10">
                            <ShieldAlert className="w-12 h-12 text-red-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">Access Denied</h2>
                        <p className="text-sm text-zinc-400">
                            You don't have permission to access this page.
                            {requirePlatformAdmin && " This area requires platform administrator access."}
                            {requireTenantAdmin && " This area requires administrator access."}
                            {module && ` This feature requires the ${module} module.`}
                        </p>
                        <button
                            onClick={() => router.back()}
                            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            );
        }
        // Will redirect, show placeholder
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
                </div>
            </div>
        );
    }

    // Access allowed
    return <>{children}</>;
}

/**
 * HOC for protecting pages.
 * 
 * Usage:
 * export default withProtectedRoute(MyPage, { requireTenantAdmin: true });
 */
export function withProtectedRoute<P extends object>(
    Component: React.ComponentType<P>,
    options: Omit<ProtectedRouteProps, 'children'>
) {
    return function ProtectedComponent(props: P) {
        return (
            <ProtectedRoute {...options}>
                <Component {...props} />
            </ProtectedRoute>
        );
    };
}
