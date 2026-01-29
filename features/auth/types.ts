// ============================================
// RBAC & Multi-Tenancy Types
// ============================================

// Platform-level roles (Tier 1)
export type PlatformRole = 'developer' | 'system_admin';

// Permission action types
export type PermissionAction = 'create' | 'read' | 'update' | 'delete';

// Module codes (matches database)
export type ModuleCode =
    | 'crm'
    | 'bookings'
    | 'transportation'
    | 'communications'
    | 'visibility'
    | 'finance'
    | 'settings';

// ============================================
// Database Entity Types
// ============================================

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    settings: Record<string, unknown>;
    is_active: boolean;
}

export interface Module {
    id: string;
    code: ModuleCode;
    name: string;
    description: string | null;
    is_active: boolean;
}

export interface ModuleResource {
    id: string;
    module_id: string;
    resource_code: string;
    resource_name: string;
    default_actions: PermissionAction[];
}

export interface TenantSubscription {
    id: string;
    tenant_id: string;
    module_id: string;
    starts_at: string;
    expires_at: string | null;
    status: 'active' | 'trial' | 'expired' | 'cancelled';
    created_at: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    avatar_url: string | null;
    platform_role: PlatformRole | null;
    tenant_id: string | null;
    is_tenant_admin: boolean;
    temp_password: boolean;
    created_at: string;
    last_login_at: string | null;
    is_active: boolean;
}

export interface Role {
    id: string;
    tenant_id: string;
    name: string;
    description: string | null;
    color: string;
    is_default: boolean;
    created_at: string;
}

export interface RolePermission {
    id: string;
    role_id: string;
    module_code: ModuleCode;
    resource_type: string;
    can_create: boolean;
    can_read: boolean;
    can_update: boolean;
    can_delete: boolean;
    scope: Record<string, unknown>;
}

export interface UserRole {
    id: string;
    user_id: string;
    role_id: string;
    assigned_at: string;
    assigned_by: string | null;
}

// ============================================
// Resolved Permission (after aggregating roles)
// ============================================

export interface ResolvedPermission {
    moduleCode: ModuleCode;
    resourceType: string;
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    scope?: Record<string, unknown>;
}

// ============================================
// Authenticated User Context
// ============================================

export interface AuthenticatedUser {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;

    // Platform level (Tier 1)
    platformRole: PlatformRole | null;
    isPlatformAdmin: boolean;

    // Tenant context (Tier 2)
    tenantId: string | null;
    tenantName: string | null;
    tenantSlug: string | null;
    isTenantAdmin: boolean;

    // Module access
    subscribedModules: ModuleCode[];

    // Resolved permissions from all assigned roles
    permissions: ResolvedPermission[];

    // Auth state
    requiresPasswordChange: boolean;
}

// ============================================
// Auth Context Types
// ============================================

export interface AuthContextType {
    // State
    isAuthenticated: boolean;
    isLoading: boolean;
    user: AuthenticatedUser | null;

    // Actions
    login: (email: string, password: string) => Promise<LoginResult>;
    logout: () => Promise<void>;
    devLogin: () => void;

    // Permission helpers
    hasModule: (module: ModuleCode) => boolean;
    can: (action: PermissionAction, module: ModuleCode, resource: string) => boolean;
    isPlatformAdmin: () => boolean;
    isTenantAdmin: () => boolean;
}

export interface LoginResult {
    success: boolean;
    error?: string;
    requiresPasswordChange?: boolean;
}

// ============================================
// Role Builder Types
// ============================================

export interface PermissionMatrix {
    [moduleCode: string]: {
        [resourceCode: string]: {
            create: boolean;
            read: boolean;
            update: boolean;
            delete: boolean;
        };
    };
}

export interface RoleFormData {
    name: string;
    description: string;
    color: string;
    permissions: PermissionMatrix;
}
