"use client";

import { useAuth } from './auth-context';
import { ModuleCode, PermissionAction } from './types';

/**
 * Hook for checking user permissions.
 * 
 * Usage:
 * const { can, hasModule, isPlatformAdmin } = usePermissions();
 * 
 * if (can('create', 'crm', 'customers')) { ... }
 * if (hasModule('bookings')) { ... }
 */
export function usePermissions() {
    const { user } = useAuth();

    /**
     * Check if user has access to a specific module.
     * Platform admins always have access.
     * For others, checks subscription status.
     */
    const hasModule = (module: ModuleCode): boolean => {
        if (!user) return false;
        if (user.isPlatformAdmin) return true;
        return user.subscribedModules.includes(module);
    };

    /**
     * Check if user can perform a specific action on a resource.
     * 
     * @param action - 'create' | 'read' | 'update' | 'delete'
     * @param module - Module code (e.g., 'crm')
     * @param resource - Resource type (e.g., 'customers')
     */
    const can = (action: PermissionAction, module: ModuleCode, resource: string): boolean => {
        if (!user) return false;

        // Platform admins can do everything
        if (user.isPlatformAdmin) return true;

        // Organization admins can do everything within their subscribed modules
        if (user.isOrganizationAdmin && hasModule(module)) return true;

        // Check user's resolved permissions
        const permission = user.permissions.find(
            p => p.moduleCode === module && p.resourceType === resource
        );

        if (!permission) return false;

        switch (action) {
            case 'create': return permission.canCreate;
            case 'read': return permission.canRead;
            case 'update': return permission.canUpdate;
            case 'delete': return permission.canDelete;
            default: return false;
        }
    };

    /**
     * Check if user is a platform admin (Developer or System Admin).
     */
    const isPlatformAdmin = (): boolean => {
        return user?.isPlatformAdmin ?? false;
    };

    /**
     * Check if user is specifically a Developer (highest level).
     */
    const isDeveloper = (): boolean => {
        return user?.platformRole === 'developer';
    };

    /**
     * Check if user is a System Admin.
     */
    const isSystemAdmin = (): boolean => {
        return user?.platformRole === 'system_admin';
    };

    /**
     * Check if user is an organization admin.
     */
    const isOrganizationAdmin = (): boolean => {
        return user?.isOrganizationAdmin ?? false;
    };

    /**
     * Check if user can access the admin dashboard (/admin).
     */
    const canAccessAdminDashboard = (): boolean => {
        return isPlatformAdmin();
    };

    /**
     * Get the user's organization ID (null for platform admins without org).
     */
    const getOrganizationId = (): string | null => {
        return user?.organizationId ?? null;
    };

    /**
     * Check multiple permissions at once.
     * Returns true if user has ALL specified permissions.
     */
    const canAll = (checks: Array<{ action: PermissionAction; module: ModuleCode; resource: string }>): boolean => {
        return checks.every(({ action, module, resource }) => can(action, module, resource));
    };

    /**
     * Check multiple permissions at once.
     * Returns true if user has ANY of the specified permissions.
     */
    const canAny = (checks: Array<{ action: PermissionAction; module: ModuleCode; resource: string }>): boolean => {
        return checks.some(({ action, module, resource }) => can(action, module, resource));
    };

    return {
        // Core permission checks
        hasModule,
        can,
        canAll,
        canAny,

        // Role checks
        isPlatformAdmin,
        isDeveloper,
        isSystemAdmin,
        isOrganizationAdmin,
        canAccessAdminDashboard,

        // Context
        getOrganizationId,
        user,
    };
}
