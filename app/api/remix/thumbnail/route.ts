import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { RemixThumbnailRequestSchema } from '@/lib/remix/validators';
import { remixThumbnails } from '@/lib/remix/thumbnail-remixer';
import { remixStoragePath, uploadRemixAsset } from '@/lib/remix/storage';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = RemixThumbnailRequestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
                { status: 400 }
            );
        }

        const { sourceId, customPromptModifier } = parsed.data;
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

        // Get original thumbnail as base64
        let thumbnailBase64 = '';
        if (source.cached_thumbnail_path) {
            const { data: fileData } = await supabaseAdmin.storage
                .from('epic-assets')
                .download(source.cached_thumbnail_path);

            if (fileData) {
                const buffer = Buffer.from(await fileData.arrayBuffer());
                thumbnailBase64 = buffer.toString('base64');
            }
        }

        if (!thumbnailBase64) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_THUMBNAIL', message: 'No original thumbnail available for analysis' } },
                { status: 400 }
            );
        }

        // Get the selected title (or fall back to cached title)
        const { data: selectedTitle } = await supabaseAdmin
            .from('remix_titles')
            .select('title')
            .eq('project_id', projectId)
            .eq('is_selected', true)
            .single();

        const remixedTitle = selectedTitle?.title || source.cached_title || 'Untitled';

        // Create job record
        const { data: job, error: jobError } = await supabaseAdmin
            .from('remix_jobs')
            .insert({
                project_id: projectId,
                type: 'remix_thumbnail',
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
            // Generate thumbnails
            const result = await remixThumbnails(
                thumbnailBase64,
                source.cached_title || 'Untitled',
                remixedTitle,
                customPromptModifier,
            );

            await supabaseAdmin
                .from('remix_jobs')
                .update({ progress: 60 })
                .eq('id', job.id);

            // Delete existing thumbnails for this project (regeneration)
            await supabaseAdmin
                .from('remix_thumbnails')
                .delete()
                .eq('project_id', projectId);

            // Download each generated image, upload to storage, create DB records
            const thumbnailRows = [];
            for (const variation of result.variations) {
                const imageResponse = await fetch(variation.imageUrl);
                const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

                const storagePath = remixStoragePath(
                    orgId,
                    projectId,
                    'thumbnails',
                    `thumbnail_${variation.index}.jpg`
                );

                await uploadRemixAsset(storagePath, imageBuffer, 'image/jpeg');

                thumbnailRows.push({
                    project_id: projectId,
                    source_id: sourceId,
                    prompt: variation.prompt,
                    file_path: storagePath,
                    analysis: result.analysis as any,
                    is_selected: false,
                });
            }

            const { error: insertError } = await supabaseAdmin
                .from('remix_thumbnails')
                .insert(thumbnailRows);

            if (insertError) throw new Error(`Failed to save thumbnails: ${insertError.message}`);

            // Log API usage (Gemini + fal.ai)
            await supabaseAdmin
                .from('remix_api_usage')
                .insert([
                    {
                        project_id: projectId,
                        org_id: orgId,
                        service: 'gemini',
                        endpoint: 'thumbnail_analysis',
                        tokens_used: result.tokensUsed,
                        cost_estimate: (result.tokensUsed / 1_000_000) * 0.10,
                    },
                    {
                        project_id: projectId,
                        org_id: orgId,
                        service: 'fal_ai',
                        endpoint: 'thumbnail_generation',
                        tokens_used: 0,
                        cost_estimate: result.variations.length * 0.025,
                    },
                ]);

            // Mark job complete
            await supabaseAdmin
                .from('remix_jobs')
                .update({ status: 'complete', progress: 100 })
                .eq('id', job.id);

            return NextResponse.json({
                success: true,
                data: {
                    thumbnailsGenerated: result.variations.length,
                    analysis: result.analysis,
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
