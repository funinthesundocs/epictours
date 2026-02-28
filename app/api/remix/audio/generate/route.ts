import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { GenerateAudioRequestSchema } from '@/lib/remix/validators';
import { generateAudio } from '@/lib/remix/elevenlabs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = GenerateAudioRequestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
                { status: 400 }
            );
        }

        const { sceneId, voiceId, voiceSettings } = parsed.data;
        const projectId = body.projectId as string;
        const orgId = body.orgId as string;

        if (!projectId || !orgId) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_CONTEXT', message: 'projectId and orgId are required' } },
                { status: 400 }
            );
        }

        // Fetch scene
        const { data: scene, error: sceneError } = await supabaseAdmin
            .from('remix_scenes')
            .select('id, dialogue_line, script_id')
            .eq('id', sceneId)
            .single();

        if (sceneError || !scene) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Scene not found' } },
                { status: 404 }
            );
        }

        // Mark scene audio as processing
        await supabaseAdmin
            .from('remix_scenes')
            .update({ audio_status: 'processing' })
            .eq('id', sceneId);

        // Create job record
        const { data: job } = await supabaseAdmin
            .from('remix_jobs')
            .insert({
                project_id: projectId,
                type: 'generate_audio',
                status: 'processing',
                progress: 10,
                scene_id: sceneId,
            })
            .select()
            .single();

        try {
            const result = await generateAudio(
                scene.dialogue_line,
                voiceId,
                orgId,
                projectId,
                sceneId,
                voiceSettings,
            );

            // Update scene with audio path
            await supabaseAdmin
                .from('remix_scenes')
                .update({
                    audio_file_path: result.storagePath,
                    audio_status: 'complete',
                })
                .eq('id', sceneId);

            // Log API usage
            await supabaseAdmin
                .from('remix_api_usage')
                .insert({
                    project_id: projectId,
                    org_id: orgId,
                    service: 'elevenlabs',
                    endpoint: 'generate_audio',
                    tokens_used: result.charCount,
                    cost_estimate: result.charCount * 0.0003,
                });

            if (job) {
                await supabaseAdmin
                    .from('remix_jobs')
                    .update({ status: 'complete', progress: 100 })
                    .eq('id', job.id);
            }

            return NextResponse.json({
                success: true,
                data: {
                    sceneId,
                    storagePath: result.storagePath,
                    signedUrl: result.signedUrl,
                    durationEstimate: result.durationEstimate,
                },
            });
        } catch (genError: any) {
            await supabaseAdmin
                .from('remix_scenes')
                .update({ audio_status: 'error', error_message: genError.message })
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
