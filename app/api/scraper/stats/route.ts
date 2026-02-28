import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');

        if (!orgId) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_CONTEXT', message: 'orgId is required' } },
                { status: 400 }
            );
        }

        // Fetch items count
        const { count: totalItems } = await supabaseAdmin
            .from('scraper_items')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgId);

        // Fetch items by source type
        const { data: items } = await supabaseAdmin
            .from('scraper_items')
            .select('source_type')
            .eq('org_id', orgId);

        const bySourceType: Record<string, number> = {};
        (items || []).forEach((item: any) => {
            bySourceType[item.source_type] = (bySourceType[item.source_type] || 0) + 1;
        });

        // Fetch assets count and total size
        const { data: assets } = await supabaseAdmin
            .from('scraper_assets')
            .select('file_size_bytes')
            .eq('org_id', orgId);

        const totalAssets = assets?.length || 0;
        const totalStorageBytes = (assets || []).reduce(
            (sum: number, a: any) => sum + (a.file_size_bytes || 0), 0
        );

        // Starred count
        const { count: starredCount } = await supabaseAdmin
            .from('scraper_items')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .eq('is_starred', true);

        // Collections count
        const { count: collectionsCount } = await supabaseAdmin
            .from('scraper_collections')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgId);

        // Active jobs
        const { count: activeJobs } = await supabaseAdmin
            .from('scraper_jobs')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', orgId)
            .in('status', ['queued', 'detecting', 'scraping']);

        return NextResponse.json({
            success: true,
            data: {
                totalItems: totalItems || 0,
                totalAssets,
                totalStorageBytes,
                starredCount: starredCount || 0,
                collectionsCount: collectionsCount || 0,
                activeJobs: activeJobs || 0,
                bySourceType,
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
