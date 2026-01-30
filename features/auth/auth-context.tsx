"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    AuthContextType,
    AuthenticatedUser,
    LoginResult,
    ModuleCode,
    PermissionAction,
    ResolvedPermission,
} from "./types";

// Dev accounts for localhost bypass
const DEV_ACCOUNTS = [
    { email: "funinthesundocs", name: "Admin" },
    { email: "denis@crodesign.com", name: "Denis" },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<AuthenticatedUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    /**
     * Fetch user data from database and resolve permissions
     */
    const fetchUserData = useCallback(async (email: string): Promise<AuthenticatedUser | null> => {
        try {
            // 1. Get Base User
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('is_active', true)
                .single();

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
                    .from('tenant_subscriptions')
                    .select('modules(code)')
                    .eq('tenant_id', activeOrg.id)
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
                avatarUrl: userData.avatar_url ?? undefined,

                isPlatformSuperAdmin: isSuperAdmin,
                isPlatformSystemAdmin: isSystemAdmin,
                isPlatformAdmin,

                organizationId: activeOrg?.id ?? null,
                organizationName: activeOrg?.name ?? null,
                organizationSlug: activeOrg?.slug ?? null,

                memberId: activeOrgMembership?.id ?? null,
                isOrganizationOwner: activeOrgMembership?.is_organization_owner ?? false,
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

    // Check for existing session on mount
    useEffect(() => {
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
        };
        checkSession();
    }, [fetchUserData]);

    // Redirect logic
    useEffect(() => {
        if (isLoading) return;

        const isLoginPage = pathname === "/login";
        const isAdminPage = pathname?.startsWith("/admin");

        if (!isAuthenticated && !isLoginPage) {
            router.push("/login");
        } else if (isAuthenticated && isLoginPage) {
            router.push("/");
        } else if (isAuthenticated && isAdminPage && !user?.isPlatformAdmin) {
            // Non-platform users trying to access admin area
            router.push("/");
        }
    }, [isAuthenticated, isLoading, pathname, router, user?.isPlatformAdmin]);

    const login = async (email: string, password: string): Promise<LoginResult> => {
        try {
            // For now, check against hardcoded accounts (will be replaced with proper auth)
            // TODO: Implement proper password verification with bcrypt
            const validAccounts = [
                { email: "funinthesundocs", password: "epictours123!" },
                { email: "denis@crodesign.com", password: "epictours123!" },
            ];

            const account = validAccounts.find(
                acc => acc.email.toLowerCase() === email.toLowerCase() && acc.password === password
            );

            if (!account) {
                return { success: false, error: "Invalid email or password" };
            }

            const fullUser = await fetchUserData(account.email);
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

    const devLogin = () => {
        // Auto-login as first dev account
        const devAccount = DEV_ACCOUNTS[0];
        fetchUserData(devAccount.email).then(fullUser => {
            if (fullUser) {
                setUser(fullUser);
                setIsAuthenticated(true);
                localStorage.setItem("epictours_user", JSON.stringify({ email: fullUser.email }));
            } else {
                // Fallback if database user doesn't exist yet
                const fallbackUser: AuthenticatedUser = {
                    id: 'dev-user',
                    email: devAccount.email,
                    name: devAccount.name,
                    isPlatformSuperAdmin: true,
                    isPlatformSystemAdmin: false,
                    isPlatformAdmin: true,
                    organizationId: null,
                    organizationName: null,
                    organizationSlug: null,
                    memberId: null,
                    isOrganizationOwner: false,
                    activePositionId: null,
                    activePositionName: null,
                    subscribedModules: ['crm', 'bookings', 'transportation', 'communications', 'visibility', 'finance', 'settings'],
                    permissions: [],
                    requiresPasswordChange: false,
                };
                setUser(fallbackUser);
                setIsAuthenticated(true);
                localStorage.setItem("epictours_user", JSON.stringify({ email: devAccount.email }));
            }
        });
    };

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
    const isTenantAdmin = (): boolean => user?.isOrganizationOwner ?? false; // Backward compat for hook name

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isLoading,
                user,
                login,
                logout,
                devLogin,
                hasModule,
                can,
                isPlatformAdmin,
                isTenantAdmin,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
