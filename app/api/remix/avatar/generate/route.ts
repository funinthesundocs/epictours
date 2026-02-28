import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { GenerateAvatarRequestSchema } from '@/lib/remix/validators';
import { generateAvatarVideo } from '@/lib/remix/heygen';
import { getRemixSignedUrl } from '@/lib/remix/storage';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = GenerateAvatarRequestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
                { status: 400 }
            );
        }

        const { sceneId, avatarId, background, aspectRatio } = parsed.data;
        const projectId = body.projectId as string;
        const orgId = body.orgId as string;

        if (!projectId || !orgId) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_CONTEXT', message: 'projectId and orgId are required' } },
                { status: 400 }
            );
        }

        // Fetch scene — must have audio ready
        const { data: scene, error: sceneError } = await supabaseAdmin
            .from('remix_scenes')
            .select('id, audio_file_path, audio_status')
            .eq('id', sceneId)
            .single();

        if (sceneError || !scene) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Scene not found' } },
                { status: 404 }
            );
        }

        if (!scene.audio_file_path || scene.audio_status !== 'complete') {
            return NextResponse.json(
                { success: false, error: { code: 'AUDIO_NOT_READY', message: 'Scene audio must be generated before avatar video' } },
                { status: 400 }
            );
        }

        // Mark scene avatar as processing
        await supabaseAdmin
            .from('remix_scenes')
            .update({ avatar_status: 'processing' })
            .eq('id', sceneId);

        // Create job record — store HeyGen video_id in result JSONB after submit
        const { data: job } = await supabaseAdmin
            .from('remix_jobs')
            .insert({
                project_id: projectId,
                type: 'generate_avatar',
                status: 'processing',
                progress: 10,
                scene_id: sceneId,
            })
            .select()
            .single();

        try {
            // Get signed URL for the stored audio
            const audioSignedUrl = await getRemixSignedUrl(scene.audio_file_path);

            // Submit HeyGen video generation job (returns video_id for polling)
            const { videoId } = await generateAvatarVideo(
                audioSignedUrl,
                avatarId,
                background,
                aspectRatio,
            );

            // Store HeyGen video_id in job result for status polling
            if (job) {
                await supabaseAdmin
                    .from('remix_jobs')
                    .update({
                        status: 'processing',
                        progress: 20,
                        result: { heygen_video_id: videoId, scene_id: sceneId, org_id: orgId, project_id: projectId },
                    })
                    .eq('id', job.id);
            }

            return NextResponse.json({
                success: true,
                data: {
                    sceneId,
                    jobId: job?.id,
                    heygenVideoId: videoId,
                    message: 'Avatar video generation started. Poll /api/remix/avatar/status/{jobId} for updates.',
                },
            });
        } catch (genError: any) {
            await supabaseAdmin
                .from('remix_scenes')
                .update({ avatar_status: 'error', error_message: genError.message })
                .eq('id', sceneId);

            if (job) {
                await supabaseAdmin
                    .from('remix_jobs')
                    .update({ status: 'error', error_message: genError.message, progress: 0 })
                    .eq('id', job.id);
            }

            return NextResponse.json(
                { success: false, error: { code: 'GENERATION_ERROR', message: genError.message } },
                { status: 500 }
            );
        }
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
