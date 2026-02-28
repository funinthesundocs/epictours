import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;
    const { data: job, error } = await supabase
      .from('remix_jobs')
      .select('id, status, progress, result, error_message, started_at, completed_at')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } },
        { status: 404 },
      );
    }

    // If complete, generate a signed URL for the rendered video
    let signedUrl: string | null = null;
    if (job.status === 'complete' && job.result?.storagePath) {
      const { data: signed } = await supabase.storage
        .from('epic-assets')
        .createSignedUrl(job.result.storagePath, 3600);
      signedUrl = signed?.signedUrl || null;
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        errorMessage: job.error_message,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        result: job.result,
        signedUrl,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
