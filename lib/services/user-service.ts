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
        positionId?: string,
        nickname?: string
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
                    nickname: nickname || null,
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
    static async createPlatformUser(data: {
        email: string;
        name: string;
        nickname?: string;
        phone_number?: string;
        notes?: string;
        messaging_apps?: { type: string; handle: string }[];
        address?: string;
        city?: string;
        state?: string;
        zip_code?: string;
        is_platform_super_admin?: boolean;
        is_platform_system_admin?: boolean;
        password?: string;
    }) {
        // 1. Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', data.email)
            .single();

        if (existingUser) {
            throw new Error(`User with email ${data.email} already exists.`);
        }

        // 2. Create User
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
                email: data.email,
                name: data.name,
                nickname: data.nickname || null,
                phone_number: data.phone_number || null,
                notes: data.notes || null,
                messaging_apps: data.messaging_apps || [],
                address: data.address || null,
                city: data.city || null,
                state: data.state || null,
                zip_code: data.zip_code || null,
                is_platform_super_admin: data.is_platform_super_admin || false,
                is_platform_system_admin: data.is_platform_system_admin || false,
                // If password provided, use it. Otherwise set temp_password to true.
                password_hash: data.password || null,
                temp_password: !data.password,
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
    static async updateUser(userId: string, data: {
        name?: string;
        email?: string;
        nickname?: string;
        password?: string;
        phone_number?: string;
        notes?: string;
        messaging_apps?: { type: string; handle: string }[];
        address?: string;
        city?: string;
        state?: string;
        zip_code?: string;
        is_platform_super_admin?: boolean;
        is_platform_system_admin?: boolean;
    }) {
        const updateData: any = { ...data };

        // Handle password update - mapping to password_hash column
        // In a real app, we would hash this password here
        if (data.password) {
            updateData.password_hash = data.password;
        }
        // Always remove the virtual 'password' field before sending to DB
        delete updateData.password;

        const { error } = await supabase
            .from('users')
            .update(updateData)
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
