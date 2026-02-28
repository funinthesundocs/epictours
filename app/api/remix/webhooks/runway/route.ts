/**
 * Runway/fal.ai webhook — receives completion events for B-roll videos.
 * Currently B-roll uses fal.subscribe (synchronous), so this webhook
 * is a fallback handler for future async fal.ai webhook integration.
 */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { uploadRemixAsset, remixStoragePath, getRemixSignedUrl } from '@/lib/remix/storage';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // fal.ai webhook payload
        const status = body.status;
        const requestId = body.request_id;
        const payload = body.payload;

        if (!requestId) {
            return NextResponse.json({ received: true });
        }

        // Find the job that was waiting for this request
        const { data: jobs } = await supabaseAdmin
            .from('remix_jobs')
            .select('*')
            .filter('metadata->>fal_request_id', 'eq', requestId)
            .eq('status', 'processing')
            .limit(1);

        const job = jobs?.[0];
        if (!job) {
            return NextResponse.json({ received: true });
        }

        const meta = (job as any).metadata || {};
        const sceneId = meta.scene_id;
        const orgId = meta.org_id;
        const projectId = meta.project_id;
        const provider = meta.provider || 'kling';

        if (status === 'OK' && payload) {
            const videoUrl = payload.video?.url || payload.videos?.[0]?.url;
            if (videoUrl) {
                const videoRes = await fetch(videoUrl);
                if (videoRes.ok) {
                    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
                    const storagePath = remixStoragePath(orgId, projectId, 'broll', `scene_${sceneId}_${provider}.mp4`);
                    await uploadRemixAsset(storagePath, videoBuffer, 'video/mp4');

                    await supabaseAdmin
                        .from('remix_scenes')
                        .update({ broll_video_path: storagePath, broll_status: 'complete' })
                        .eq('id', sceneId);

                    await supabaseAdmin
                        .from('remix_jobs')
                        .update({ status: 'completed', progress: 100 })
                        .eq('id', job.id);
                }
            }
        } else if (status === 'ERROR') {
            await supabaseAdmin
                .from('remix_scenes')
                .update({ broll_status: 'error', error_message: 'fal.ai generation failed' })
                .eq('id', sceneId);

            await supabaseAdmin
                .from('remix_jobs')
                .update({ status: 'failed', error_message: 'fal.ai generation failed', progress: 0 })
                .eq('id', job.id);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('[runway-webhook]', error.message);
        return NextResponse.json({ received: true });
    }
}
