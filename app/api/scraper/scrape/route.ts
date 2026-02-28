import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { enqueueJob } from '@/lib/queue/enqueue';
import { ScrapeRequestSchema } from '@/lib/scraper/validators';
import { detectSourceType } from '@/lib/scraper/detector';
import { processScrapeDirect } from '@/lib/scraper/run-job';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = ScrapeRequestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
                { status: 400 }
            );
        }

        const { url, collectionId, config } = parsed.data;
        const orgId = body.orgId;
        const userId = body.userId;

        if (!orgId || !userId) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_CONTEXT', message: 'orgId and userId are required' } },
                { status: 400 }
            );
        }

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
            return NextResponse.json(
                { success: false, error: { code: 'DB_ERROR', message: jobError?.message || 'Failed to create job' } },
                { status: 500 }
            );
        }

        let enqueued = false;
        try {
            // 3-second timeout — if the worker is up but Redis is broken, q.add() hangs forever
            const enqueuePromise = enqueueJob('epic-scraper', 'scrape', {
                jobId: job.id,
                url,
                orgId,
                userId,
                collectionId,
                config,
            });
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Worker enqueue timeout')), 3000)
            );
            await Promise.race([enqueuePromise, timeoutPromise]);
            enqueued = true;
        } catch {
            // Worker unavailable or Redis broken — run in-process (local dev fallback)
        }

        if (!enqueued) {
            const jobId = job.id;
            setImmediate(async () => {
                try {
                    await processScrapeDirect({ jobId, url, orgId, userId, collectionId, config });
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err);
                    console.error('[scrape-fallback] processScrapeDirect failed:', msg);
                }
            });
        }

        return NextResponse.json({
            success: true,
            data: { jobId: job.id, sourceType, status: 'queued' },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
