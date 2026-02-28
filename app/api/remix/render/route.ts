import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const RenderRequestSchema = z.object({
  projectId: z.string().uuid(),
  orgId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RenderRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
        { status: 400 },
      );
    }
    const { projectId, orgId } = parsed.data;

    // Verify project exists and has a selected script
    const { data: script, error: scriptError } = await supabase
      .from('remix_scripts')
      .select('id')
      .eq('project_id', projectId)
      .eq('is_selected', true)
      .single();

    if (scriptError || !script) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_SCRIPT', message: 'No approved script found' } },
        { status: 400 },
      );
    }

    // Verify at least one scene has a video asset ready
    const { data: readyScenes } = await supabase
      .from('remix_scenes')
      .select('id')
      .eq('script_id', script.id)
      .or('avatar_status.eq.complete,broll_status.eq.complete');

    if (!readyScenes || readyScenes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NO_ASSETS', message: 'No scenes have video assets ready' },
        },
        { status: 400 },
      );
    }

    // Create the render job + advance project to assembling atomically
    const { data: job, error: jobError } = await supabase
      .from('remix_jobs')
      .insert({
        type: 'render',
        status: 'queued',
        project_id: projectId,
        result: { projectId, orgId },
      })
      .select('id')
      .single();

    // Advance project status immediately so UI steps forward
    await supabase.from('remix_projects').update({ status: 'assembling' }).eq('id', projectId);

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: jobError?.message } },
        { status: 500 },
      );
    }

    // Enqueue to Railway worker if WORKER_URL is set, else worker polls from queue
    const workerUrl = process.env.WORKER_URL;
    if (workerUrl) {
      try {
        await fetch(`${workerUrl}/enqueue`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queue: 'epic-remix',
            name: 'render',
            data: { jobId: job.id, projectId, orgId },
          }),
        });
      } catch (err: any) {
        // Worker unavailable — job stays 'queued', worker will pick it up when available
      }
    }

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message } },
      { status: 500 },
    );
  }
}
