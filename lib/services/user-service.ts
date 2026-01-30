import { supabase } from "@/lib/supabase";
import { AuthenticatedUser } from "@/features/auth/types";

export class UserService {
    /**
     * Invite a new user to an organization
     * (Simulated invite flow: Creates User + OrgUser record)
     */
    static async inviteUserToOrganization(
        organizationId: string,
        email: string,
        name: string,
        positionId?: string
    ) {
        // 1. Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        let userId = existingUser?.id;

        // 2. Create User if not exists
        if (!userId) {
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    email,
                    name,
                    temp_password: true, // Flag to force password setup
                    is_active: true
                })
                .select()
                .single();

            if (createError) throw createError;
            userId = newUser.id;
        }

        // 3. Add to Organization
        const { error: linkError } = await supabase
            .from('organization_users')
            .insert({
                organization_id: organizationId,
                user_id: userId,
                primary_position_id: positionId || null,
                status: 'active' // Auto-activate for now
            });

        if (linkError) {
            // Check for unique violation (already member)
            if (linkError.code === '23505') {
                return { success: false, message: 'User is already a member of this organization.' };
            }
            throw linkError;
        }

        return { success: true, userId };
    }

    /**
     * Update an organization member's position
     */
    static async updateMemberPosition(memberId: string, positionId: string | null) {
        const { error } = await supabase
            .from('organization_users')
            .update({ primary_position_id: positionId })
            .eq('id', memberId);

        if (error) throw error;
    }

    /**
     * Remove a user from an organization
     */
    static async removeUserFromOrganization(memberId: string) {
        const { error } = await supabase
            .from('organization_users')
            .delete()
            .eq('id', memberId);

        if (error) throw error;
    }

    /**
     * Grant Platform Admin access (Super Admin only)
     */
    static async setPlatformAdmin(userId: string, isSuperAdmin: boolean, isSystemAdmin: boolean) {
        const { error } = await supabase
            .from('users')
            .update({
                is_platform_super_admin: isSuperAdmin,
                is_platform_system_admin: isSystemAdmin
            })
            .eq('id', userId);

        if (error) throw error;
    }

    /**
     * Create a pure platform user (no organization link initially)
     */
    static async createPlatformUser(email: string, name: string) {
        // 1. Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            throw new Error(`User with email ${email} already exists.`);
        }

        // 2. Create User
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
                email,
                name,
                temp_password: true,
                is_active: true
            })
            .select()
            .single();

        if (createError) throw createError;
        return newUser;
    }

    /**
     * Update basic user details
     */
    static async updateUser(userId: string, data: { name?: string; email?: string }) {
        const { error } = await supabase
            .from('users')
            .update(data)
            .eq('id', userId);

        if (error) throw error;
    }

    /**
     * Delete a user permanently
     */
    static async deleteUser(userId: string) {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) throw error;
    }
}
