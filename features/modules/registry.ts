// ============================================
// Dynamic Module Registry
// ============================================
// Modules self-register here so the Role Builder
// automatically discovers available permissions.
// ============================================

import { PermissionAction, ModuleCode } from '@/features/auth/types';

export interface ResourceDefinition {
    code: string;
    name: string;
    actions: PermissionAction[];
    description?: string;
}

export interface ModuleDefinition {
    code: ModuleCode;
    name: string;
    description?: string;
    resources: ResourceDefinition[];
}

// Module registry storage
const moduleRegistry: Map<ModuleCode, ModuleDefinition> = new Map();

/**
 * Register a module and its resources.
 * Call this in each feature module's index or registration file.
 */
export function registerModule(module: ModuleDefinition): void {
    moduleRegistry.set(module.code, module);
}

/**
 * Get all registered modules.
 */
export function getRegisteredModules(): ModuleDefinition[] {
    return Array.from(moduleRegistry.values());
}

/**
 * Get a specific module by code.
 */
export function getModule(code: ModuleCode): ModuleDefinition | undefined {
    return moduleRegistry.get(code);
}

/**
 * Get all resources for a module.
 */
export function getModuleResources(code: ModuleCode): ResourceDefinition[] {
    return moduleRegistry.get(code)?.resources ?? [];
}

// ============================================
// Register Built-in Modules
// ============================================

registerModule({
    code: 'crm',
    name: 'CRM',
    description: 'Customer relationship management',
    resources: [
        { code: 'customers', name: 'Customers', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'customer_types', name: 'Customer Types', actions: ['create', 'read', 'update', 'delete'] },
    ]
});

registerModule({
    code: 'bookings',
    name: 'Bookings Platform',
    description: 'Experience booking and availability management',
    resources: [
        { code: 'bookings', name: 'Bookings', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'experiences', name: 'Experiences', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'availabilities', name: 'Availabilities', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'booking_options', name: 'Booking Options', actions: ['create', 'read', 'update', 'delete'] },
    ]
});

registerModule({
    code: 'transportation',
    name: 'Transportation',
    description: 'Vehicles, vendors, and logistics',
    resources: [
        { code: 'vehicles', name: 'Vehicles', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'vendors', name: 'Vendors', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'pickup_points', name: 'Pickup Points', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'hotels', name: 'Hotels', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'schedules', name: 'Schedules', actions: ['create', 'read', 'update', 'delete'] },
    ]
});

registerModule({
    code: 'communications',
    name: 'Communications',
    description: 'Phone system, AI agents, live agents',
    resources: [
        { code: 'phone_system', name: 'Phone System', actions: ['read', 'update'] },
        { code: 'ai_agents', name: 'AI Agents', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'live_agents', name: 'Live Agents', actions: ['create', 'read', 'update', 'delete'] },
    ]
});

registerModule({
    code: 'visibility',
    name: 'Visibility',
    description: 'OTA, website, social media, blog',
    resources: [
        { code: 'ota', name: 'OTA Manager', actions: ['read', 'update'] },
        { code: 'website', name: 'Website Manager', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'social_media', name: 'Social Media', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'blog', name: 'Blog Manager', actions: ['create', 'read', 'update', 'delete'] },
    ]
});

registerModule({
    code: 'finance',
    name: 'Finance',
    description: 'Billing, bank accounts, partners, reports',
    resources: [
        { code: 'billing', name: 'Billing', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'bank_accounts', name: 'Bank Accounts', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'partners', name: 'Partners', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'reports', name: 'Reports', actions: ['read'] },
        { code: 'pricing', name: 'Pricing Schedules', actions: ['create', 'read', 'update', 'delete'] },
    ]
});

registerModule({
    code: 'settings',
    name: 'Settings',
    description: 'System configuration',
    resources: [
        { code: 'custom_fields', name: 'Custom Fields', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'pricing_variations', name: 'Pricing Variations', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'users', name: 'Users', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'permission_groups', name: 'Permission Groups', actions: ['create', 'read', 'update', 'delete'] },
        { code: 'positions', name: 'Staff Positions', actions: ['create', 'read', 'update', 'delete'] },
    ]
});
