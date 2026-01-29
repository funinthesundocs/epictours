"use client";

import { usePermissions } from './use-permissions';
import { ModuleCode, PermissionAction } from './types';
import { toast } from 'sonner';

/**
 * Hook for guarding data operations with permission checks.
 * Shows toast messages when operations are denied.
 * 
 * Usage:
 * const { guardOperation, canCreate, canUpdate, canDelete, canRead } = useOperationGuard('crm', 'customers');
 * 
 * const handleCreate = async () => {
 *   if (!guardOperation('create')) return;
 *   // proceed with create
 * };
 */
export function useOperationGuard(module: ModuleCode, resource: string) {
    const { can, hasModule } = usePermissions();

    const canCreate = can('create', module, resource);
    const canRead = can('read', module, resource);
    const canUpdate = can('update', module, resource);
    const canDelete = can('delete', module, resource);

    /**
     * Guard an operation and show toast on denial.
     * Returns true if allowed, false if denied.
     */
    const guardOperation = (action: PermissionAction, showToast = true): boolean => {
        // First check if module is accessible
        if (!hasModule(module)) {
            if (showToast) {
                toast.error("Module not available", {
                    description: `The ${module} module is not included in your subscription.`
                });
            }
            return false;
        }

        const isAllowed = can(action, module, resource);
        if (!isAllowed && showToast) {
            const actionLabels: Record<PermissionAction, string> = {
                create: 'create',
                read: 'view',
                update: 'edit',
                delete: 'delete'
            };
            toast.error("Permission denied", {
                description: `You don't have permission to ${actionLabels[action]} ${resource}.`
            });
        }
        return isAllowed;
    };

    /**
     * Wrap an async operation with permission guard.
     * If denied, operation is not executed.
     */
    const withGuard = <T,>(
        action: PermissionAction,
        operation: () => Promise<T>,
        showToast = true
    ): (() => Promise<T | null>) => {
        return async () => {
            if (!guardOperation(action, showToast)) {
                return null;
            }
            return await operation();
        };
    };

    return {
        // Individual permission checks
        canCreate,
        canRead,
        canUpdate,
        canDelete,

        // Guard functions
        guardOperation,
        withGuard,

        // Convenience checks
        canModify: canUpdate || canDelete,
        hasAnyAccess: canCreate || canRead || canUpdate || canDelete,
    };
}

/**
 * Factory function to create permission-aware operation wrappers.
 * 
 * Usage in hooks:
 * const createGuardedOperations = useGuardedOperations('crm', 'customers');
 * const guardedCreate = createGuardedOperations.wrap('create', originalCreate);
 */
export function useGuardedOperations(module: ModuleCode, resource: string) {
    const guard = useOperationGuard(module, resource);

    return {
        ...guard,

        /**
         * Wrap an operation function with permission guard
         */
        wrap: <TArgs extends unknown[], TReturn>(
            action: PermissionAction,
            fn: (...args: TArgs) => Promise<TReturn>
        ): ((...args: TArgs) => Promise<TReturn | null>) => {
            return async (...args: TArgs) => {
                if (!guard.guardOperation(action)) {
                    return null;
                }
                return await fn(...args);
            };
        },
    };
}
