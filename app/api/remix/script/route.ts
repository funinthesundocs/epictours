import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { RemixScriptRequestSchema } from '@/lib/remix/validators';
import { remixScript } from '@/lib/remix/script-remixer';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = RemixScriptRequestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
                { status: 400 }
            );
        }

        const { sourceId, selectedTitleId, tone } = parsed.data;
        const projectId = body.projectId;
        const orgId = body.orgId;

        if (!projectId || !orgId) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_CONTEXT', message: 'projectId and orgId are required' } },
                { status: 400 }
            );
        }

        // Fetch source
        const { data: source, error: sourceError } = await supabaseAdmin
            .from('remix_sources')
            .select('*')
            .eq('id', sourceId)
            .eq('project_id', projectId)
            .single();

        if (sourceError || !source) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Source not found' } },
                { status: 404 }
            );
        }

        if (!source.cached_transcript || source.cached_transcript.length < 50) {
            return NextResponse.json(
                { success: false, error: { code: 'INSUFFICIENT_DATA', message: 'Source transcript is too short for script remixing' } },
                { status: 400 }
            );
        }

        // Get the title to use (selected title or from selectedTitleId param)
        let title = source.cached_title || 'Untitled';
        if (selectedTitleId) {
            const { data: titleRow } = await supabaseAdmin
                .from('remix_titles')
                .select('title')
                .eq('id', selectedTitleId)
                .single();
            if (titleRow) title = titleRow.title;
        } else {
            const { data: selectedRow } = await supabaseAdmin
                .from('remix_titles')
                .select('title')
                .eq('project_id', projectId)
                .eq('is_selected', true)
                .single();
            if (selectedRow) title = selectedRow.title;
        }

        // Create job record
        const { data: job, error: jobError } = await supabaseAdmin
            .from('remix_jobs')
            .insert({
                project_id: projectId,
                type: 'remix_script',
                status: 'processing',
                progress: 10,
            })
            .select()
            .single();

        if (jobError) {
            return NextResponse.json(
                { success: false, error: { code: 'DB_ERROR', message: jobError.message } },
                { status: 500 }
            );
        }

        try {
            const result = await remixScript(
                source.cached_transcript,
                title,
                source.cached_description || undefined,
                tone || 'professional',
            );

            await supabaseAdmin
                .from('remix_jobs')
                .update({ progress: 70 })
                .eq('id', job.id);

            // Delete existing scripts and scenes for this project (regeneration)
            const { data: existingScripts } = await supabaseAdmin
                .from('remix_scripts')
                .select('id')
                .eq('project_id', projectId);

            if (existingScripts && existingScripts.length > 0) {
                const scriptIds = existingScripts.map((s) => s.id);
                await supabaseAdmin
                    .from('remix_scenes')
                    .delete()
                    .in('script_id', scriptIds);
                await supabaseAdmin
                    .from('remix_scripts')
                    .delete()
                    .eq('project_id', projectId);
            }

            // Insert the script
            const { data: script, error: scriptError } = await supabaseAdmin
                .from('remix_scripts')
                .insert({
                    project_id: projectId,
                    source_id: sourceId,
                    full_script: result.fullScript,
                    tone: tone || 'professional',
                    total_duration_seconds: result.totalDurationSeconds,
                    is_selected: false,
                })
                .select()
                .single();

            if (scriptError || !script) throw new Error(`Failed to save script: ${scriptError?.message}`);

            // Insert scenes
            const sceneRows = result.scenes.map((s) => ({
                script_id: script.id,
                scene_number: s.sceneNumber,
                dialogue_line: s.dialogue,
                broll_description: s.brollDescription,
                on_screen_text: s.onScreenText || null,
                duration_seconds: s.durationSeconds,
                audio_status: 'pending',
                avatar_status: 'pending',
                broll_status: 'pending',
            }));

            const { error: sceneError } = await supabaseAdmin
                .from('remix_scenes')
                .insert(sceneRows);

            if (sceneError) throw new Error(`Failed to save scenes: ${sceneError.message}`);

            // Log API usage
            await supabaseAdmin
                .from('remix_api_usage')
                .insert({
                    project_id: projectId,
                    org_id: orgId,
                    service: 'gemini',
                    endpoint: 'remix_script',
                    tokens_used: result.tokensUsed,
                    cost_estimate: (result.tokensUsed / 1_000_000) * 0.10,
                });

            // Mark job complete
            await supabaseAdmin
                .from('remix_jobs')
                .update({ status: 'complete', progress: 100 })
                .eq('id', job.id);

            return NextResponse.json({
                success: true,
                data: {
                    scriptId: script.id,
                    sceneCount: result.scenes.length,
                    totalDurationSeconds: result.totalDurationSeconds,
                    tokensUsed: result.tokensUsed,
                    jobId: job.id,
                },
            });
        } catch (genError: any) {
            await supabaseAdmin
                .from('remix_jobs')
                .update({ status: 'error', error_message: genError.message, progress: 0 })
                .eq('id', job.id);

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
