"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, Suspense, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import {
    AuthContextType,
    AuthenticatedUser,
    LoginResult,
    ModuleCode,
    PermissionAction,
    ResolvedPermission,
    Organization,
} from "./types";


const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Internal provider that uses useSearchParams (requires Suspense)
function AuthProviderInner({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<AuthenticatedUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Platform Admin org context switching
    const [adminSelectedOrgId, setAdminSelectedOrgId] = useState<string | null>(null);
    const [adminSelectedOrg, setAdminSelectedOrg] = useState<Organization | null>(null);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    /**
     * Fetch user data from database and resolve permissions.
     * This is called imperatively (login, session restore) so we keep direct queries.
     * React Query will handle caching when the queries are re-triggered.
     */
    const fetchUserData = useCallback(async (email: string): Promise<AuthenticatedUser | null> => {
        try {
            // 1. Get Base User
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('is_active', true)
                .single() as { data: any, error: any };

            if (userError || !userData) {
                console.error('User fetch error:', userError);
                return null;
            }

            const isSuperAdmin = userData.is_platform_super_admin ?? false;
            const isSystemAdmin = userData.is_platform_system_admin ?? false;
            const isPlatformAdmin = isSuperAdmin || isSystemAdmin;

            // 2. Get Organization Membership (Default to first active for now)
            // In future, this would load all memberships and let user switch context
            let activeOrgMembership = null;
            let activeOrg = null;
            let activePosition = null;

            if (!isPlatformAdmin) {
                // Fetch direct organization membership
                const { data: orgUsers } = await supabase
                    .from('organization_users')
                    .select(`
                        id,
                        organization_id,
                        is_organization_owner,
                        primary_position_id,
                        organizations (id, name, slug, status),
                        staff_positions (id, name, default_role_id)
                    `)
                    .eq('user_id', userData.id)
                    .eq('status', 'active')
                    .limit(1);

                if (orgUsers && orgUsers.length > 0) {
                    activeOrgMembership = orgUsers[0];
                    activeOrg = activeOrgMembership.organizations;
                    activePosition = activeOrgMembership.staff_positions as any; // Cast for now
                }

                // TODO: Handle Cross-Organization Access if no direct membership found
            }

            // 3. Get Subscribed Modules (if in an org)
            let subscribedModules: ModuleCode[] = [];
            if (activeOrg?.id) {
                const { data: subscriptions } = await supabase
                    .from('organization_subscriptions')
                    .select('modules(code)')
                    .eq('organization_id', activeOrg.id)
                    .eq('status', 'active');

                subscribedModules = (subscriptions ?? [])
                    .map((s: any) => s.modules?.code as ModuleCode)
                    .filter(Boolean);
            }

            // 4. Resolve Permissions
            let permissions: ResolvedPermission[] = [];

            if (!isPlatformAdmin && activeOrgMembership) {
                // A. Get permissions from Primary Position's Default Role
                const roleId = activePosition?.default_role_id;

                if (roleId) {
                    const { data: rolePerms } = await supabase
                        .from('role_permissions')
                        .select('*')
                        .eq('role_id', roleId);

                    rolePerms?.forEach(rp => {
                        permissions.push({
                            moduleCode: rp.module_code as ModuleCode,
                            resourceType: rp.resource_type,
                            canCreate: rp.can_create ?? false,
                            canRead: rp.can_read ?? false,
                            canUpdate: rp.can_update ?? false,
                            canDelete: rp.can_delete ?? false,
                            scope: rp.scope as any,
                        });
                    });
                }

                // TODO: B. Merge "Position Overrides" from position_permissions
                // Not implementing yet to keep migration simple, but architecture supports it.
            }

            return {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                nickname: userData.nickname || null,
                phone_number: userData.phone_number || null,
                notes: userData.notes || null,
                messaging_apps: userData.messaging_apps || [],
                avatarUrl: userData.avatar_url ?? undefined,

                isPlatformSuperAdmin: isSuperAdmin,
                isPlatformSystemAdmin: isSystemAdmin,
                isPlatformAdmin,

                organizationId: activeOrg?.id ?? null,
                organizationName: activeOrg?.name ?? null,
                organizationSlug: activeOrg?.slug ?? null,

                memberId: activeOrgMembership?.id ?? null,
                isOrganizationOwner: activeOrgMembership?.is_organization_owner ?? false,
                isOrganizationAdmin: activeOrgMembership?.is_organization_owner ?? false, // Alias
                activePositionId: activePosition?.id ?? null,
                activePositionName: activePosition?.name ?? null,

                subscribedModules,
                permissions,
                requiresPasswordChange: userData.temp_password ?? false,
            };
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }, []);

    // Track if we've already checked session to prevent redundant fetches
    const hasCheckedSession = useRef(false);

    // Check for existing session on mount (ONCE)
    useEffect(() => {
        if (hasCheckedSession.current) return;

        const checkSession = async () => {
            const storedUser = localStorage.getItem("epictours_user");
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    // Re-fetch full user data to ensure permissions are current
                    const fullUser = await fetchUserData(parsed.email);
                    if (fullUser) {
                        setUser(fullUser);
                        setIsAuthenticated(true);
                    } else {
                        localStorage.removeItem("epictours_user");
                    }
                } catch {
                    localStorage.removeItem("epictours_user");
                }
            }
            setIsLoading(false);
            hasCheckedSession.current = true;
        };
        checkSession();
    }, [fetchUserData]);

    // Load org context from URL for platform admins
    useEffect(() => {
        if (isLoading || !user?.isPlatformAdmin) return;

        const orgSlug = searchParams.get('org');
        if (orgSlug && !adminSelectedOrgId) {
            // Fetch org by slug and set context
            const loadOrgFromUrl = async () => {
                try {
                    const { data, error } = await supabase
                        .from('organizations')
                        .select('*')
                        .eq('slug', orgSlug)
                        .single();

                    if (!error && data) {
                        setAdminSelectedOrgId(data.id);
                        setAdminSelectedOrg(data as Organization);
                    }
                } catch (err) {
                    console.error('Failed to load org from URL:', err);
                }
            };
            loadOrgFromUrl();
        }
    }, [isLoading, user?.isPlatformAdmin, searchParams, adminSelectedOrgId]);

    // Redirect logic
    useEffect(() => {
        if (isLoading) return;

        const isLoginPage = pathname === "/login";
        const isAdminPage = pathname?.startsWith("/admin");
        const isHomePage = pathname === "/";

        if (!isAuthenticated && !isLoginPage) {
            router.push("/login");
        } else if (isAuthenticated && isLoginPage) {
            // Redirect after login
            if (user?.isPlatformAdmin && !adminSelectedOrgId) {
                // Platform admin without org selected -> go to organizations
                router.push("/admin/organizations");
            } else {
                router.push("/");
            }
        } else if (isAuthenticated && isAdminPage && !user?.isPlatformAdmin) {
            // Non-platform users trying to access admin area
            router.push("/");
        } else if (isAuthenticated && isHomePage && user?.isPlatformAdmin && !adminSelectedOrgId) {
            // Platform admin on home without org selected -> go to organizations
            router.push("/admin/organizations");
        }
    }, [isAuthenticated, isLoading, pathname, router, user?.isPlatformAdmin, adminSelectedOrgId]);

    const login = async (emailOrNickname: string, password: string): Promise<LoginResult> => {
        try {
            // 1. Try to find user in local dev DB (users table)
            // We check against email OR nickname
            const { data: dbUser, error } = await supabase
                .from('users')
                .select('*')
                .or(`email.eq.${emailOrNickname},nickname.eq.${emailOrNickname}`)
                .eq('is_active', true)
                .single();

            let isValid = false;
            let finalEmail = "";

            if (dbUser) {
                // Verify password (comparing against password_hash column)
                // Note: For this prototype/dev environment, we are doing direct comparison.
                // In production, this MUST use bcrypt.compare(password, dbUser.password_hash)
                if (dbUser.password_hash === password) {
                    isValid = true;
                    finalEmail = dbUser.email;
                }
            }

            // 2. Fallback to Hardcoded Dev Accounts (if DB lookup fails or user not found)
            // This is to prevent locking ourselves out if DB is empty or migration hasn't run
            if (!isValid) {
                const validAccounts = [
                    { email: "funinthesundocs", password: "epictours123!" },
                    { email: "denis@crodesign.com", password: "epictours123!" },
                ];
                const account = validAccounts.find(
                    acc => (acc.email.toLowerCase() === emailOrNickname.toLowerCase() || acc.email.split('@')[0] === emailOrNickname) && acc.password === password
                );

                if (account) {
                    isValid = true;
                    finalEmail = account.email;
                    // Note: This logic relies on fetchUserData finding the user by email later.
                    // If the user isn't in DB, fetchUserData will fail anyway.
                }
            }

            if (!isValid) {
                return { success: false, error: "Invalid username or password" };
            }

            const fullUser = await fetchUserData(finalEmail);
            if (!fullUser) {
                return { success: false, error: "User account not found in database" };
            }

            setUser(fullUser);
            setIsAuthenticated(true);
            localStorage.setItem("epictours_user", JSON.stringify({ email: fullUser.email }));

            return {
                success: true,
                requiresPasswordChange: fullUser.requiresPasswordChange,
            };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: "An error occurred during login" };
        }
    };

    const logout = async () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("epictours_user");
        router.push("/login");
    };

    const devLogin = async () => {
        // Auto-login as first available platform super admin from database
        try {
            const { data: adminUser, error } = await supabase
                .from('users')
                .select('email')
                .eq('is_platform_super_admin', true)
                .eq('is_active', true)
                .limit(1)
                .single();

            if (adminUser && !error) {
                const fullUser = await fetchUserData(adminUser.email);
                if (fullUser) {
                    setUser(fullUser);
                    setIsAuthenticated(true);
                    localStorage.setItem("epictours_user", JSON.stringify({ email: fullUser.email }));
                    return;
                }
            }

            // Fallback if no database user exists yet (fresh install)
            console.warn('No platform super admin found in database, using fallback');
            const fallbackUser: AuthenticatedUser = {
                id: 'dev-user',
                email: 'dev@localhost',
                name: 'Developer',
                isPlatformSuperAdmin: true,
                isPlatformSystemAdmin: false,
                isPlatformAdmin: true,
                organizationId: null,
                organizationName: null,
                organizationSlug: null,
                memberId: null,
                isOrganizationOwner: false,
                isOrganizationAdmin: false,
                activePositionId: null,
                activePositionName: null,
                subscribedModules: ['crm', 'bookings', 'communications', 'visibility', 'finance', 'settings'],
                permissions: [],
                requiresPasswordChange: false,
            };
            setUser(fallbackUser);
            setIsAuthenticated(true);
            localStorage.setItem("epictours_user", JSON.stringify({ email: 'dev@localhost' }));
        } catch (error) {
            console.error('Dev login error:', error);
        }
    };

    // Sync URL ?org= param to admin org context (for page refreshes/direct navigation)
    useEffect(() => {
        if (!user?.isPlatformAdmin) return;

        const orgSlug = searchParams.get('org');

        // If URL has org param but we don't have it selected, sync it
        if (orgSlug && !adminSelectedOrgId) {
            const syncOrgFromUrl = async () => {
                try {
                    const { data, error } = await supabase
                        .from('organizations')
                        .select('id')
                        .eq('slug', orgSlug)
                        .single();

                    if (!error && data) {
                        setAdminSelectedOrgId(data.id);
                        // Also fetch full org data
                        const { data: fullOrg } = await supabase
                            .from('organizations')
                            .select('*')
                            .eq('id', data.id)
                            .single();
                        if (fullOrg) {
                            setAdminSelectedOrg(fullOrg as Organization);
                        }
                    }
                } catch (err) {
                    console.error('Failed to sync org from URL:', err);
                }
            };
            syncOrgFromUrl();
        }
    }, [user?.isPlatformAdmin, searchParams, adminSelectedOrgId]);

    // Permission helper functions
    const hasModule = (module: ModuleCode): boolean => {
        if (!user) return false;
        if (user.isPlatformAdmin) return true;
        return user.subscribedModules.includes(module);
    };

    const can = (action: PermissionAction, module: ModuleCode, resource: string): boolean => {
        if (!user) return false;
        if (user.isPlatformAdmin) return true;
        if (user.isOrganizationOwner && hasModule(module)) return true;

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

    const isPlatformAdmin = (): boolean => user?.isPlatformAdmin ?? false;
    const isTenantAdmin = (): boolean => user?.isOrganizationOwner ?? false; // Deprecated, use isOrganizationAdmin
    const isOrganizationAdmin = (): boolean => user?.isOrganizationAdmin ?? false;

    /**
     * Set the organization context for platform admins.
     * This allows admins to view navigation/data as if they were in a specific org.
     */
    const setAdminOrgContext = useCallback(async (orgId: string | null) => {
        if (!user?.isPlatformAdmin) {
            console.warn('setAdminOrgContext called for non-admin user');
            return;
        }

        if (!orgId) {
            setAdminSelectedOrgId(null);
            setAdminSelectedOrg(null);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', orgId)
                .single();

            if (error || !data) {
                console.error('Failed to fetch org for context:', error);
                return;
            }

            setAdminSelectedOrgId(orgId);
            setAdminSelectedOrg(data as Organization);
        } catch (err) {
            console.error('Error setting admin org context:', err);
        }
    }, [user?.isPlatformAdmin]);

    // Computed: effective organization ID (admin-selected or user's actual)
    const effectiveOrganizationId = user?.isPlatformAdmin
        ? adminSelectedOrgId
        : user?.organizationId ?? null;

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isLoading,
                user,
                adminSelectedOrgId,
                adminSelectedOrg,
                setAdminOrgContext,
                effectiveOrganizationId,
                login,
                logout,
                devLogin,
                hasModule,
                can,
                isPlatformAdmin,
                isTenantAdmin,
                isOrganizationAdmin,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Exported wrapper with Suspense for useSearchParams
export function AuthProvider({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={null}>
            <AuthProviderInner>{children}</AuthProviderInner>
        </Suspense>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
