import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { RemixTitleRequestSchema } from '@/lib/remix/validators';
import { remixTitles } from '@/lib/remix/title-remixer';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = RemixTitleRequestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
                { status: 400 }
            );
        }

        const { sourceId } = parsed.data;
        const projectId = body.projectId;
        const orgId = body.orgId;

        if (!projectId || !orgId) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_CONTEXT', message: 'projectId and orgId are required' } },
                { status: 400 }
            );
        }

        // Fetch source with cached data
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
                { success: false, error: { code: 'INSUFFICIENT_DATA', message: 'Source transcript is too short for title remixing' } },
                { status: 400 }
            );
        }

        // Create a job record
        const { data: job, error: jobError } = await supabaseAdmin
            .from('remix_jobs')
            .insert({
                project_id: projectId,
                type: 'remix_title',
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

        // Update project status to remixing
        await supabaseAdmin
            .from('remix_projects')
            .update({ status: 'remixing' })
            .eq('id', projectId);

        try {
            // Call Gemini for title variations
            const result = await remixTitles(
                source.cached_title || 'Untitled',
                source.cached_transcript,
                source.cached_description || undefined,
            );

            // Update job progress
            await supabaseAdmin
                .from('remix_jobs')
                .update({ progress: 80 })
                .eq('id', job.id);

            // Delete any existing titles for this project (regeneration)
            await supabaseAdmin
                .from('remix_titles')
                .delete()
                .eq('project_id', projectId);

            // Insert title variations
            const titleRows = result.variations.map((v) => ({
                project_id: projectId,
                source_id: sourceId,
                style: v.style,
                title: v.title,
                reasoning: v.reasoning,
                is_selected: false,
            }));

            const { error: insertError } = await supabaseAdmin
                .from('remix_titles')
                .insert(titleRows);

            if (insertError) throw new Error(`Failed to save titles: ${insertError.message}`);

            // Log API usage
            await supabaseAdmin
                .from('remix_api_usage')
                .insert({
                    project_id: projectId,
                    org_id: orgId,
                    service: 'gemini',
                    endpoint: 'remix_title',
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
                    titlesGenerated: result.variations.length,
                    tokensUsed: result.tokensUsed,
                    jobId: job.id,
                },
            });
        } catch (genError: any) {
            // Mark job failed
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
