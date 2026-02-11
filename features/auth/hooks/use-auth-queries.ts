import { useQuery } from '@tanstack/react-query';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

/**
 * Query key factory for auth-related queries.
 * Helps with cache invalidation and organization.
 */
export const authKeys = {
    user: (email: string) => ['user', email] as const,
    orgMembership: (userId: string) => ['orgMembership', userId] as const,
    orgSubscriptions: (orgId: string) => ['orgSubscriptions', orgId] as const,
    rolePermissions: (roleId: string) => ['rolePermissions', roleId] as const,
};

/**
 * Fetch user data by email.
 * Cached for 10 minutes since user data rarely changes during a session.
 */
export function useUserQuery(email: string | null) {
    return useQuery({
        queryKey: authKeys.user(email || ''),
        queryFn: async () => {
            if (!email) return null;

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('is_active', true)
                .single();

            if (error) {
                console.error('User fetch error:', error);
                return null;
            }

            return data;
        },
        enabled: !!email, // Only run query if email exists
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Fetch organization membership for a user.
 * Includes organization and position data.
 */
export function useOrgMembershipQuery(userId: string | null) {
    return useQuery({
        queryKey: authKeys.orgMembership(userId || ''),
        queryFn: async () => {
            if (!userId) return null;

            const { data, error } = await supabase
                .from('organization_users')
                .select(`
                    id,
                    organization_id,
                    is_organization_owner,
                    primary_position_id,
                    organizations (id, name, slug, status),
                    staff_positions (id, name, default_role_id)
                `)
                .eq('user_id', userId)
                .eq('status', 'active')
                .limit(1);

            if (error) {
                console.error('Org membership fetch error:', error);
                return null;
            }

            return data && data.length > 0 ? data[0] : null;
        },
        enabled: !!userId,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Fetch module subscriptions for an organization.
 */
export function useOrgSubscriptionsQuery(orgId: string | null) {
    return useQuery({
        queryKey: authKeys.orgSubscriptions(orgId || ''),
        queryFn: async () => {
            if (!orgId) return [];

            const { data, error } = await supabase
                .from('organization_subscriptions')
                .select('modules(code)')
                .eq('organization_id', orgId)
                .eq('status', 'active');

            if (error) {
                console.error('Subscriptions fetch error:', error);
                return [];
            }

            return (data || [])
                .map((s: any) => s.modules?.code)
                .filter(Boolean);
        },
        enabled: !!orgId,
        staleTime: 5 * 60 * 1000, // 5 minutes (may change if admin upgrades)
    });
}

/**
 * Fetch role permissions for a role.
 */
export function useRolePermissionsQuery(roleId: string | null) {
    return useQuery({
        queryKey: authKeys.rolePermissions(roleId || ''),
        queryFn: async () => {
            if (!roleId) return [];

            const { data, error } = await supabase
                .from('role_permissions')
                .select('*')
                .eq('role_id', roleId);

            if (error) {
                console.error('Role permissions fetch error:', error);
                return [];
            }

            return data || [];
        },
        enabled: !!roleId,
        staleTime: 5 * 60 * 1000, // 5 minutes (may change if role updated)
    });
}
