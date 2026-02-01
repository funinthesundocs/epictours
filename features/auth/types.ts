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

// Replaces Tenant
export interface Organization {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    settings: Record<string, unknown>;
    status: 'active' | 'suspended';
}

export interface OrganizationUser {
    id: string;
    organization_id: string;
    user_id: string;
    primary_position_id: string | null;
    is_organization_owner: boolean;
    status: string;
    created_at: string;
    updated_at: string;
    // Expanded position data
    position?: {
        name: string;
        default_role_id: string | null;
    };
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

export interface OrganizationSubscription {
    id: string;
    organization_id: string;
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
    organization_id: string | null;
    is_organization_admin: boolean;
    temp_password: boolean;
    created_at: string;
    last_login_at: string | null;
    is_active: boolean;
}

export interface Role {
    id: string;
    organization_id: string;
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
    nickname?: string | null;
    phone_number?: string | null;
    notes?: string | null;
    messaging_apps?: { type: string; handle: string }[] | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
    avatarUrl?: string;

    // Platform level (Tier 1)
    isPlatformSuperAdmin: boolean;
    isPlatformSystemAdmin: boolean;
    isPlatformAdmin: boolean; // Computed helper

    // Organization context (Tier 2) - Currently active organization
    organizationId: string | null;
    organizationName: string | null;
    organizationSlug: string | null;

    // Member details in active organization
    memberId: string | null; // ID in organization_users table
    isOrganizationOwner: boolean;
    isOrganizationAdmin: boolean; // Alias for isOrganizationOwner for consistency
    activePositionId: string | null;
    activePositionName: string | null;

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
    isTenantAdmin: () => boolean; // Deprecated, use isOrganizationAdmin
    isOrganizationAdmin: () => boolean;
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
