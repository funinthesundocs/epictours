import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params;

        const { data: job, error } = await supabaseAdmin
            .from('remix_jobs')
            .select('id, status, progress, error_message')
            .eq('id', jobId)
            .single();

        if (error || !job) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                jobId: job.id,
                status: job.status,
                progress: job.progress,
                error: job.error_message,
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
