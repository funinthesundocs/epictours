import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params;

        const { data: job, error } = await supabaseAdmin
            .from('scraper_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (error || !job) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } },
                { status: 404 }
            );
        }

        // Also fetch items for this job
        const { data: items } = await supabaseAdmin
            .from('scraper_items')
            .select('*, scraper_assets(*)')
            .eq('job_id', jobId);

        return NextResponse.json({
            success: true,
            data: { ...job, items: items || [] },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params;

        const { error } = await supabaseAdmin
            .from('scraper_jobs')
            .delete()
            .eq('id', jobId);

        if (error) {
            return NextResponse.json(
                { success: false, error: { code: 'DB_ERROR', message: error.message } },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
