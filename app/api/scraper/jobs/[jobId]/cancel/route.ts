import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params;

        // Only cancel if queued or scraping
        const { data: job } = await supabaseAdmin
            .from('scraper_jobs')
            .select('status')
            .eq('id', jobId)
            .single();

        if (!job) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } },
                { status: 404 }
            );
        }

        if (!['queued', 'scraping', 'detecting'].includes(job.status)) {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_STATE', message: `Cannot cancel job in ${job.status} state` } },
                { status: 400 }
            );
        }

        const { error } = await supabaseAdmin
            .from('scraper_jobs')
            .update({ status: 'cancelled', completed_at: new Date().toISOString() })
            .eq('id', jobId);

        if (error) {
            return NextResponse.json(
                { success: false, error: { code: 'DB_ERROR', message: error.message } },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: { jobId, status: 'cancelled' } });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
