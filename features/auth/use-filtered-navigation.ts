"use client";

import { useMemo } from "react";
import { navigation, type NavSection, type NavigationItem } from "@/config/navigation";
import { useAuth } from "@/features/auth/auth-context";
import type { ModuleCode } from "@/features/auth/types";

/**
 * Hook that filters navigation based on user's subscribed modules and permissions.
 * Returns only the navigation items the current user is allowed to see.
 */
export function useFilteredNavigation(): NavSection[] {
    const { user, hasModule, isPlatformAdmin, isOrganizationAdmin } = useAuth();

    return useMemo(() => {
        const isAdmin = isPlatformAdmin();
        const isOrgAdmin = isOrganizationAdmin();

        // If not authenticated, show only items without requirements
        if (!user) {
            return filterNavigation(navigation, {
                hasModule: () => false,
                isPlatformAdmin: false,
                isOrganizationAdmin: false
            });
        }

        // Platform admins and super admins see everything
        if (isAdmin) {
            return navigation;
        }

        return filterNavigation(navigation, {
            hasModule,
            isPlatformAdmin: isAdmin,
            isOrganizationAdmin: isOrgAdmin
        });
    }, [user, hasModule, isPlatformAdmin, isOrganizationAdmin]);
}

interface FilterContext {
    hasModule: (module: ModuleCode) => boolean;
    isPlatformAdmin: boolean;
    isOrganizationAdmin: boolean;
}

/**
 * Recursively filters navigation sections and items based on permission requirements.
 */
function filterNavigation(sections: NavSection[], ctx: FilterContext): NavSection[] {
    return sections
        .map(section => {
            // Check section-level module requirement
            if (section.requiredModule && !ctx.hasModule(section.requiredModule)) {
                return null;
            }

            // Filter items within the section
            const filteredItems = filterItems(section.items, ctx);

            // If no items remain, hide the section
            if (filteredItems.length === 0) {
                return null;
            }

            return {
                ...section,
                items: filteredItems
            };
        })
        .filter((section): section is NavSection => section !== null);
}

/**
 * Filters individual navigation items based on their requirements.
 */
function filterItems(items: NavigationItem[], ctx: FilterContext): NavigationItem[] {
    return items
        .map(item => {
            // Check platform admin requirement
            if (item.platformAdminOnly && !ctx.isPlatformAdmin) {
                return null;
            }

            // Check organization admin requirement
            if (item.organizationAdminOnly && !ctx.isOrganizationAdmin && !ctx.isPlatformAdmin) {
                return null;
            }

            // Check module requirement
            if (item.requiredModule && !ctx.hasModule(item.requiredModule)) {
                return null;
            }

            // Recursively filter children
            if (item.children && item.children.length > 0) {
                const filteredChildren = filterItems(item.children, ctx);

                // If all children are filtered out, hide the parent too
                if (filteredChildren.length === 0) {
                    return null;
                }

                return {
                    ...item,
                    children: filteredChildren
                };
            }

            return item;
        })
        .filter((item): item is NavigationItem => item !== null);
}
