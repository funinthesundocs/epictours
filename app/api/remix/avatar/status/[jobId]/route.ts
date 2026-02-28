import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getVideoStatus, downloadAndStoreVideo } from '@/lib/remix/heygen';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const { jobId } = await params;

        // Fetch job from DB
        const { data: job, error } = await supabaseAdmin
            .from('remix_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (error || !job) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Job not found' } },
                { status: 404 }
            );
        }

        // If already complete or error, return current state
        if (job.status === 'complete' || job.status === 'error') {
            return NextResponse.json({ success: true, data: { jobId, status: job.status, progress: job.progress } });
        }

        // Poll HeyGen for current status using result JSONB
        const result = (job as any).result || {};
        const heygenVideoId = result.heygen_video_id;
        if (!heygenVideoId) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_DATA', message: 'No HeyGen video ID in job result' } },
                { status: 400 }
            );
        }

        const heygenStatus = await getVideoStatus(heygenVideoId);

        if (heygenStatus.status === 'completed' && heygenStatus.video_url) {
            const sceneId = result.scene_id;
            const orgId = result.org_id;
            const projectId = result.project_id;

            // Download and store the video
            const { storagePath, signedUrl } = await downloadAndStoreVideo(
                heygenStatus.video_url,
                orgId,
                projectId,
                sceneId,
            );

            // Update scene
            await supabaseAdmin
                .from('remix_scenes')
                .update({ avatar_video_path: storagePath, avatar_status: 'complete' })
                .eq('id', sceneId);

            // Mark job complete
            await supabaseAdmin
                .from('remix_jobs')
                .update({ status: 'complete', progress: 100 })
                .eq('id', jobId);

            // Log API usage
            const { data: scene } = await supabaseAdmin
                .from('remix_scenes')
                .select('duration_seconds')
                .eq('id', sceneId)
                .single();

            if (scene) {
                await supabaseAdmin
                    .from('remix_api_usage')
                    .insert({
                        project_id: projectId,
                        org_id: orgId,
                        service: 'heygen',
                        endpoint: 'generate_avatar',
                        minutes_used: scene.duration_seconds / 60,
                        cost_estimate: scene.duration_seconds * 0.033,
                    });
            }

            return NextResponse.json({
                success: true,
                data: { jobId, status: 'complete', progress: 100, signedUrl },
            });
        }

        if (heygenStatus.status === 'failed') {
            await supabaseAdmin
                .from('remix_scenes')
                .update({ avatar_status: 'error', error_message: heygenStatus.error })
                .eq('id', result.scene_id);

            await supabaseAdmin
                .from('remix_jobs')
                .update({ status: 'error', error_message: heygenStatus.error, progress: 0 })
                .eq('id', jobId);

            return NextResponse.json({
                success: true,
                data: { jobId, status: 'error', error: heygenStatus.error },
            });
        }

        // Still processing
        const progress = heygenStatus.status === 'processing' ? 50 : 20;
        await supabaseAdmin
            .from('remix_jobs')
            .update({ progress })
            .eq('id', jobId);

        return NextResponse.json({
            success: true,
            data: { jobId, status: 'processing', progress },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
