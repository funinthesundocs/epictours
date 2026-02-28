/**
 * HeyGen webhook — receives completion events for avatar videos.
 * HeyGen sends POST to this endpoint when video generation completes.
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { downloadAndStoreVideo } from '@/lib/remix/heygen';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const eventType = body.event_type;
        const videoId = body.data?.video_id;
        const videoUrl = body.data?.url || body.data?.video_url;

        if (!videoId) {
            return NextResponse.json({ received: true });
        }

        if (eventType === 'avatar_video.success' && videoUrl) {
            // Find the job waiting for this video (stored in result JSONB)
            const { data: jobs } = await supabaseAdmin
                .from('remix_jobs')
                .select('*')
                .filter('result->>heygen_video_id', 'eq', videoId)
                .eq('status', 'processing')
                .limit(1);

            const job = jobs?.[0];
            if (!job) {
                return NextResponse.json({ received: true });
            }

            const result = (job as any).result || {};
            const sceneId = result.scene_id;
            const orgId = result.org_id;
            const projectId = result.project_id;

            const { storagePath } = await downloadAndStoreVideo(videoUrl, orgId, projectId, sceneId);

            await supabaseAdmin
                .from('remix_scenes')
                .update({ avatar_video_path: storagePath, avatar_status: 'complete' })
                .eq('id', sceneId);

            await supabaseAdmin
                .from('remix_jobs')
                .update({ status: 'complete', progress: 100 })
                .eq('id', job.id);
        }

        if (eventType === 'avatar_video.fail') {
            const { data: jobs } = await supabaseAdmin
                .from('remix_jobs')
                .select('*')
                .filter('result->>heygen_video_id', 'eq', videoId)
                .eq('status', 'processing')
                .limit(1);

            const job = jobs?.[0];
            if (job) {
                const result = (job as any).result || {};
                await supabaseAdmin
                    .from('remix_scenes')
                    .update({ avatar_status: 'error', error_message: body.data?.error || 'HeyGen failed' })
                    .eq('id', result.scene_id);

                await supabaseAdmin
                    .from('remix_jobs')
                    .update({ status: 'error', error_message: body.data?.error || 'HeyGen failed', progress: 0 })
                    .eq('id', job.id);
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('[heygen-webhook]', error.message);
        return NextResponse.json({ received: true });
    }
}
