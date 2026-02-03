"use client";

import { useMemo } from "react";
import { navigation, type NavSection, type NavigationItem } from "@/config/navigation";
import { useAuth } from "@/features/auth/auth-context";
import type { ModuleCode } from "@/features/auth/types";

interface FilterContext {
    hasModule: (module: ModuleCode) => boolean;
    isPlatformAdmin: boolean;
    isOrganizationAdmin: boolean;
    hasOrgContext: boolean;
    orgSlug: string | null; // For prefixing hrefs
}

/**
 * Hook that filters navigation based on user's subscribed modules and permissions.
 * Returns only the navigation items the current user is allowed to see.
 * 
 * For Platform Admins:
 * - Always shows Settings and Platform Admin sections
 * - Only shows org-level navigation if an organization is selected via effectiveOrganizationId
 * - Prefixes org-scoped hrefs with /admin/organizations/[orgSlug]
 */
export function useFilteredNavigation(): NavSection[] {
    const { user, hasModule, isPlatformAdmin, isOrganizationAdmin, effectiveOrganizationId, adminSelectedOrg } = useAuth();

    return useMemo(() => {
        const isAdmin = isPlatformAdmin();
        const isOrgAdmin = isOrganizationAdmin();

        // If not authenticated, show only items without requirements
        if (!user) {
            return filterNavigation(navigation, {
                hasModule: () => false,
                isPlatformAdmin: false,
                isOrganizationAdmin: false,
                hasOrgContext: false,
                orgSlug: null
            });
        }

        // Platform admins: filter based on whether an org is selected
        if (isAdmin) {
            const hasOrgContext = !!effectiveOrganizationId;
            const orgSlug = adminSelectedOrg?.slug || null;

            return filterNavigation(navigation, {
                // Platform admins have access to all modules, but only when viewing an org
                hasModule: (module: ModuleCode) => hasOrgContext ? true : false,
                isPlatformAdmin: true,
                isOrganizationAdmin: true,
                hasOrgContext,
                orgSlug
            });
        }

        return filterNavigation(navigation, {
            hasModule,
            isPlatformAdmin: isAdmin,
            isOrganizationAdmin: isOrgAdmin,
            hasOrgContext: true, // Regular users always have org context
            orgSlug: null // Regular users don't need prefixed hrefs
        });
    }, [user, hasModule, isPlatformAdmin, isOrganizationAdmin, effectiveOrganizationId, adminSelectedOrg]);
}

/**
 * Recursively filters navigation sections and items based on permission requirements.
 */
function filterNavigation(sections: NavSection[], ctx: FilterContext): NavSection[] {
    return sections
        .map(section => {
            // Settings and Platform Admin sections are always visible for admins
            if (section.title === "Settings" || section.title === "Platform Admin") {
                if (ctx.isPlatformAdmin || ctx.isOrganizationAdmin) {
                    // Filter items but keep the section
                    const filteredItems = filterItems(section.items, ctx);
                    return filteredItems.length > 0 ? { ...section, items: filteredItems } : null;
                }
            }

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
 * Also transforms hrefs for platform admins viewing an org.
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

            // Check org context requirement (for platform admins without org selected)
            if (item.requiresOrgContext && !ctx.hasOrgContext) {
                return null;
            }

            // Check module requirement
            if (item.requiredModule && !ctx.hasModule(item.requiredModule)) {
                return null;
            }

            // Transform href for platform admins viewing an org
            // Skip platform-admin-only routes (they don't need org prefix)
            let transformedHref = item.href;
            if (ctx.orgSlug && ctx.isPlatformAdmin && !item.platformAdminOnly) {
                // Don't prefix routes that are already under /admin or /org
                if (!item.href.startsWith('/admin') && !item.href.startsWith('/org')) {
                    transformedHref = `/org/${ctx.orgSlug}${item.href}`;
                }
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
                    href: transformedHref,
                    children: filteredChildren
                };
            }

            return {
                ...item,
                href: transformedHref
            };
        })
        .filter((item): item is NavigationItem => item !== null);
}
