import { supabase } from "@/lib/supabase";
import { Organization, OrganizationUser } from "@/features/auth/types";

export class OrganizationService {
    /**
     * Get all organizations (Platform Admin only)
     */
    static async getAllOrganizations() {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .order('name');

        if (error) throw error;
        return data as Organization[];
    }

    /**
     * Get single organization by ID
     */
    static async getOrganizationById(id: string) {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Organization;
    }

    /**
     * Get members of an organization
     */
    static async getOrganizationMembers(organizationId: string) {
        const { data, error } = await supabase
            .from('organization_users')
            .select(`
                *,
                user:users (
                    id, name, email, avatar_url, phone_number
                ),
                position:staff_positions (
                    id, name
                )
            `)
            .eq('organization_id', organizationId);

        if (error) throw error;
        return data as (OrganizationUser & {
            user: { id: string; name: string; email: string; avatar_url: string | null; phone_number: string | null },
            position: { id: string; name: string } | null
        })[];
    }

    /**
     * Create a new organization
     */
    static async createOrganization(name: string, slug: string) {
        const { data, error } = await supabase
            .from('organizations')
            .insert({ name, slug, status: 'active' })
            .select()
            .single();

        if (error) throw error;
        return data as Organization;
    }

    /**
     * Update organization settings
     */
    static async updateOrganization(id: string, updates: Partial<Organization>) {
        const { data, error } = await supabase
            .from('organizations')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Organization;
    }
}
