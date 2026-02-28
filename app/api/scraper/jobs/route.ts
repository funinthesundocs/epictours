import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');

        if (!orgId) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_CONTEXT', message: 'orgId is required' } },
                { status: 400 }
            );
        }

        let query = supabaseAdmin
            .from('scraper_jobs')
            .select('*', { count: 'exact' })
            .eq('org_id', orgId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const offset = (page - 1) * pageSize;
        query = query.range(offset, offset + pageSize - 1);

        const { data, count, error } = await query;

        if (error) {
            return NextResponse.json(
                { success: false, error: { code: 'DB_ERROR', message: error.message } },
                { status: 500 }
            );
        }

        const jobs = data || [];

        // Enrich completed jobs with item title + thumbnail signed URL
        if (jobs.length > 0) {
            const jobIds = jobs.map((j: any) => j.id);

            const { data: items } = await supabaseAdmin
                .from('scraper_items')
                .select('job_id, title, scraper_assets(asset_type, storage_path)')
                .in('job_id', jobIds);

            // Build a lookup: jobId → { title, thumbnailPath }
            const itemMap: Record<string, { title: string | null; thumbnailPath: string | null }> = {};
            for (const item of (items || []) as any[]) {
                const thumb = item.scraper_assets?.find(
                    (a: any) => (a.asset_type === 'thumbnail' || a.asset_type === 'image') && a.storage_path
                ) || item.scraper_assets?.find(
                    (a: any) => a.asset_type === 'video' && a.storage_path
                );
                itemMap[item.job_id] = { title: item.title || null, thumbnailPath: thumb?.storage_path || null };
            }

            // Generate signed URLs for thumbnails in parallel
            const BUCKET = 'epic-assets';
            const enriched = await Promise.all(
                jobs.map(async (job: any) => {
                    const meta = itemMap[job.id];
                    if (!meta) return job;
                    let thumbnail_signed_url: string | null = null;
                    if (meta.thumbnailPath) {
                        const { data: signed } = await supabaseAdmin.storage
                            .from(BUCKET)
                            .createSignedUrl(meta.thumbnailPath, 3600);
                        thumbnail_signed_url = signed?.signedUrl ?? null;
                    }
                    return { ...job, item_title: meta.title, thumbnail_signed_url };
                })
            );

            return NextResponse.json({
                success: true,
                data: enriched,
                pagination: { page, pageSize, total: count || 0 },
            });
        }

        return NextResponse.json({
            success: true,
            data: jobs,
            pagination: { page, pageSize, total: count || 0 },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
