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
            // Get user from database
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select(`
                    *,
                    tenant:tenants(id, name, slug)
                `)
                .eq('email', email)
                .eq('is_active', true)
                .single();

            if (userError || !userData) {
                console.error('User fetch error:', userError);
                return null;
            }

            // Get subscribed modules if user has a tenant
            let subscribedModules: ModuleCode[] = [];
            if (userData.tenant_id) {
                const { data: subscriptions } = await supabase
                    .from('tenant_subscriptions')
                    .select('modules(code)')
                    .eq('tenant_id', userData.tenant_id)
                    .eq('status', 'active');

                subscribedModules = (subscriptions ?? [])
                    .map((s: { modules: { code: string } | null }) => s.modules?.code as ModuleCode)
                    .filter(Boolean);
            }

            // Get user's resolved permissions from roles
            let permissions: ResolvedPermission[] = [];
            if (!userData.platform_role) {
                // Only fetch role permissions for non-platform users
                const { data: rolePerms } = await supabase
                    .from('user_roles')
                    .select(`
                        roles!inner(
                            role_permissions(
                                module_code,
                                resource_type,
                                can_create,
                                can_read,
                                can_update,
                                can_delete,
                                scope
                            )
                        )
                    `)
                    .eq('user_id', userData.id);

                // Flatten and aggregate permissions
                const permMap = new Map<string, ResolvedPermission>();
                rolePerms?.forEach((ur: {
                    roles: {
                        role_permissions: Array<{
                            module_code: string;
                            resource_type: string;
                            can_create: boolean;
                            can_read: boolean;
                            can_update: boolean;
                            can_delete: boolean;
                            scope?: Record<string, unknown>;
                        }>
                    }
                }) => {
                    ur.roles.role_permissions?.forEach(rp => {
                        const key = `${rp.module_code}:${rp.resource_type}`;
                        const existing = permMap.get(key);
                        if (existing) {
                            // Merge permissions (OR logic)
                            existing.canCreate = existing.canCreate || rp.can_create;
                            existing.canRead = existing.canRead || rp.can_read;
                            existing.canUpdate = existing.canUpdate || rp.can_update;
                            existing.canDelete = existing.canDelete || rp.can_delete;
                        } else {
                            permMap.set(key, {
                                moduleCode: rp.module_code as ModuleCode,
                                resourceType: rp.resource_type,
                                canCreate: rp.can_create,
                                canRead: rp.can_read,
                                canUpdate: rp.can_update,
                                canDelete: rp.can_delete,
                                scope: rp.scope,
                            });
                        }
                    });
                });
                permissions = Array.from(permMap.values());
            }

            const tenant = userData.tenant as { id: string; name: string; slug: string } | null;

            return {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                avatarUrl: userData.avatar_url,
                platformRole: userData.platform_role,
                isPlatformAdmin: userData.platform_role === 'developer' || userData.platform_role === 'system_admin',
                tenantId: userData.tenant_id,
                tenantName: tenant?.name ?? null,
                tenantSlug: tenant?.slug ?? null,
                isTenantAdmin: userData.is_tenant_admin,
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
                    platformRole: 'developer',
                    isPlatformAdmin: true,
                    tenantId: null,
                    tenantName: null,
                    tenantSlug: null,
                    isTenantAdmin: false,
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
        if (user.isTenantAdmin && hasModule(module)) return true;

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
    const isTenantAdmin = (): boolean => user?.isTenantAdmin ?? false;

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
