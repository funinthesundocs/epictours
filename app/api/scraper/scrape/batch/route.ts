import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { enqueueJob } from '@/lib/queue/enqueue';
import { BatchScrapeRequestSchema } from '@/lib/scraper/validators';
import { detectSourceType } from '@/lib/scraper/detector';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = BatchScrapeRequestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
                { status: 400 }
            );
        }

        const { urls, collectionId, config } = parsed.data;
        const orgId = body.orgId;
        const userId = body.userId;

        if (!orgId || !userId) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_CONTEXT', message: 'orgId and userId are required' } },
                { status: 400 }
            );
        }

        const results: { url: string; jobId?: string; error?: string; sourceType?: string }[] = [];

        for (const url of urls) {
            try {
                const sourceType = detectSourceType(url);

                const { data: job, error: jobError } = await supabaseAdmin
                    .from('scraper_jobs')
                    .insert({
                        org_id: orgId,
                        source_url: url,
                        source_type: sourceType,
                        status: 'queued',
                        progress: 0,
                        config: config || {},
                        created_by: userId,
                    })
                    .select('id')
                    .single();

                if (jobError || !job) {
                    results.push({ url, error: jobError?.message || 'Failed to create job' });
                    continue;
                }

                await enqueueJob('epic-scraper', 'scrape', {
                    jobId: job.id,
                    url,
                    orgId,
                    userId,
                    collectionId,
                    config,
                });

                results.push({ url, jobId: job.id, sourceType });
            } catch (err: any) {
                results.push({ url, error: err.message });
            }
        }

        const succeeded = results.filter((r) => r.jobId).length;
        const failed = results.filter((r) => r.error).length;

        return NextResponse.json({
            success: true,
            data: {
                total: urls.length,
                succeeded,
                failed,
                jobs: results,
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
