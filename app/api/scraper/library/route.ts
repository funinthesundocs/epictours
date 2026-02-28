import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');
        const sourceType = searchParams.get('sourceType');
        const contentType = searchParams.get('contentType');
        const collectionId = searchParams.get('collectionId');
        const starred = searchParams.get('starred');
        const search = searchParams.get('search');
        const sort = searchParams.get('sort') || 'created_at';
        const direction = searchParams.get('direction') || 'desc';
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');

        if (!orgId) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_CONTEXT', message: 'orgId is required' } },
                { status: 400 }
            );
        }

        let query = supabaseAdmin
            .from('scraper_items')
            .select('*, scraper_assets(id, asset_type, file_name, mime_type, storage_path, alt_text)', { count: 'exact' })
            .eq('org_id', orgId);

        if (sourceType) query = query.eq('source_type', sourceType);
        if (contentType) query = query.eq('content_type', contentType);
        if (collectionId) query = query.eq('collection_id', collectionId);
        if (starred === 'true') query = query.eq('is_starred', true);
        if (search) {
            query = query.or(`title.ilike.%${search}%,body_text.ilike.%${search}%,source_url.ilike.%${search}%`);
        }

        const validSorts = ['created_at', 'title', 'source_type', 'word_count', 'scraped_at'];
        const sortColumn = validSorts.includes(sort) ? sort : 'created_at';
        query = query.order(sortColumn, { ascending: direction === 'asc' });

        const offset = (page - 1) * pageSize;
        query = query.range(offset, offset + pageSize - 1);

        const { data, count, error } = await query;

        if (error) {
            return NextResponse.json(
                { success: false, error: { code: 'DB_ERROR', message: error.message } },
                { status: 500 }
            );
        }

        // Generate signed URLs for the first visual asset of each item
        const BUCKET = 'epic-assets';
        const enriched = await Promise.all(
            (data || []).map(async (item: any) => {
                // Prefer a still image/thumbnail over a raw video file for card display
                const visual =
                    item.scraper_assets?.find((a: any) => (a.asset_type === 'image' || a.asset_type === 'thumbnail') && a.storage_path) ||
                    item.scraper_assets?.find((a: any) => a.asset_type === 'video' && a.storage_path);
                if (visual?.storage_path) {
                    try {
                        const { data: signed } = await supabaseAdmin.storage
                            .from(BUCKET)
                            .createSignedUrl(visual.storage_path, 3600);
                        return { ...item, thumbnail_signed_url: signed?.signedUrl ?? null };
                    } catch {
                        /* non-fatal */
                    }
                }
                return { ...item, thumbnail_signed_url: null };
            })
        );

        return NextResponse.json({
            success: true,
            data: enriched,
            pagination: { page, pageSize, total: count || 0 },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
