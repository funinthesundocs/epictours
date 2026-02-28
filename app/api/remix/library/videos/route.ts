import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/** List video/audio items from scraper repository for remix source selection */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');
        const search = searchParams.get('search');
        const pageSize = parseInt(searchParams.get('pageSize') || '50');

        if (!orgId) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_CONTEXT', message: 'orgId is required' } },
                { status: 400 }
            );
        }

        let query = supabaseAdmin
            .from('scraper_items')
            .select('id, title, description, source_url, source_type, content_type, word_count, body_text, created_at, scraper_assets(id, asset_type, file_name, storage_path)')
            .eq('org_id', orgId)
            .in('content_type', ['video', 'audio'])
            .order('created_at', { ascending: false })
            .limit(pageSize);

        if (search) {
            query = query.or(`title.ilike.%${search}%,body_text.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json(
                { success: false, error: { code: 'DB_ERROR', message: error.message } },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
