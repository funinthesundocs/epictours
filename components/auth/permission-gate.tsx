"use client";

import { ReactNode } from 'react';
import { usePermissions } from '@/features/auth/use-permissions';
import { ModuleCode, PermissionAction } from '@/features/auth/types';

interface PermissionGateProps {
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
     * Require organization admin access
     */
    requireOrganizationAdmin?: boolean;
    /**
     * Content to show when access is denied (optional)
     */
    fallback?: ReactNode;
    /**
     * If true, completely unmounts children when denied.
     * If false, renders fallback or nothing.
     */
    unmountOnDeny?: boolean;
}

/**
 * Conditionally renders children based on user permissions.
 * 
 * Usage:
 * 
 * // Require module access
 * <PermissionGate module="crm">
 *   <CustomerList />
 * </PermissionGate>
 * 
 * // Require specific permission
 * <PermissionGate permission={{ action: 'create', module: 'crm', resource: 'customers' }}>
 *   <AddCustomerButton />
 * </PermissionGate>
 * 
 * // Require platform admin
 * <PermissionGate requirePlatformAdmin>
 *   <AdminDashboardLink />
 * </PermissionGate>
 */
export function PermissionGate({
    children,
    module,
    permission,
    requirePlatformAdmin = false,
    requireOrganizationAdmin = false,
    fallback = null,
}: PermissionGateProps) {
    const { hasModule, can, isPlatformAdmin, isOrganizationAdmin } = usePermissions();

    // Check platform admin requirement
    if (requirePlatformAdmin && !isPlatformAdmin()) {
        return <>{fallback}</>;
    }

    // Check organization admin requirement
    if (requireOrganizationAdmin && !isOrganizationAdmin() && !isPlatformAdmin()) {
        return <>{fallback}</>;
    }

    // Check module requirement
    if (module && !hasModule(module)) {
        return <>{fallback}</>;
    }

    // Check specific permission requirement
    if (permission && !can(permission.action, permission.module, permission.resource)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * Hook version for more complex conditional logic.
 * 
 * Usage:
 * const { isAllowed } = usePermissionCheck({ module: 'crm', resource: 'customers', action: 'create' });
 * if (isAllowed) { ... }
 */
export function usePermissionCheck(options: {
    module?: ModuleCode;
    permission?: {
        action: PermissionAction;
        module: ModuleCode;
        resource: string;
    };
    requirePlatformAdmin?: boolean;
    requireOrganizationAdmin?: boolean;
}) {
    const { hasModule, can, isPlatformAdmin, isOrganizationAdmin } = usePermissions();

    let isAllowed = true;

    if (options.requirePlatformAdmin && !isPlatformAdmin()) {
        isAllowed = false;
    }

    if (options.requireOrganizationAdmin && !isOrganizationAdmin() && !isPlatformAdmin()) {
        isAllowed = false;
    }

    if (options.module && !hasModule(options.module)) {
        isAllowed = false;
    }

    if (options.permission && !can(options.permission.action, options.permission.module, options.permission.resource)) {
        isAllowed = false;
    }

    return { isAllowed };
}
