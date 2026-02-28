import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { GenerateBRollRequestSchema } from '@/lib/remix/validators';
import { generateBroll } from '@/lib/remix/broll-generator';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = GenerateBRollRequestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
                { status: 400 }
            );
        }

        const { sceneId, provider, durationSeconds } = parsed.data;
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
            .select('id, broll_description')
            .eq('id', sceneId)
            .single();

        if (sceneError || !scene) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Scene not found' } },
                { status: 404 }
            );
        }

        // Mark scene broll as processing
        await supabaseAdmin
            .from('remix_scenes')
            .update({ broll_status: 'processing' })
            .eq('id', sceneId);

        // Create job record
        const { data: job } = await supabaseAdmin
            .from('remix_jobs')
            .insert({
                project_id: projectId,
                type: 'generate_broll',
                status: 'processing',
                progress: 10,
                scene_id: sceneId,
            })
            .select()
            .single();

        try {
            // Generate B-roll (synchronous via fal.ai subscribe)
            const result = await generateBroll(
                scene.broll_description,
                orgId,
                projectId,
                sceneId,
                provider,
                durationSeconds,
            );

            // Update scene with broll path
            await supabaseAdmin
                .from('remix_scenes')
                .update({
                    broll_video_path: result.storagePath,
                    broll_status: 'complete',
                })
                .eq('id', sceneId);

            // Log API usage
            const service = result.providerUsed === 'runway' ? 'runway' : 'kling';
            await supabaseAdmin
                .from('remix_api_usage')
                .insert({
                    project_id: projectId,
                    org_id: orgId,
                    service,
                    endpoint: 'generate_broll',
                    minutes_used: result.durationSeconds / 60,
                    cost_estimate: result.durationSeconds * (result.providerUsed === 'runway' ? 0.05 : 0.03),
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
                    durationSeconds: result.durationSeconds,
                    providerUsed: result.providerUsed,
                },
            });
        } catch (genError: any) {
            await supabaseAdmin
                .from('remix_scenes')
                .update({ broll_status: 'error', error_message: genError.message })
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
