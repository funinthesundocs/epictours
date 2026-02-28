import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CreateRemixProjectSchema } from '@/lib/remix/validators';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const orgId = searchParams.get('orgId');

        if (!orgId) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_CONTEXT', message: 'orgId is required' } },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('remix_projects')
            .select('*, remix_sources(id, scraper_item_id, cached_title, is_primary)')
            .eq('org_id', orgId)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json(
                { success: false, error: { code: 'DB_ERROR', message: error.message } },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: data || [] });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = CreateRemixProjectSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
                { status: 400 }
            );
        }

        const { name, description, scraperItemIds, settings } = parsed.data;
        const orgId = body.orgId;
        const userId = body.userId;

        if (!orgId || !userId) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_CONTEXT', message: 'orgId and userId are required' } },
                { status: 400 }
            );
        }

        // Create the project
        const { data: project, error: projectError } = await supabaseAdmin
            .from('remix_projects')
            .insert({
                org_id: orgId,
                name,
                description: description || null,
                status: 'draft',
                settings: settings || {
                    aspect_ratio: '16:9',
                    voice_id: null,
                    avatar_id: null,
                    voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.5 },
                    target_resolution: '1080p',
                },
                created_by: userId,
            })
            .select()
            .single();

        if (projectError || !project) {
            return NextResponse.json(
                { success: false, error: { code: 'DB_ERROR', message: projectError?.message || 'Failed to create project' } },
                { status: 500 }
            );
        }

        // Cache scraper data into remix_sources
        for (let i = 0; i < scraperItemIds.length; i++) {
            const itemId = scraperItemIds[i];

            // Fetch scraper item + assets
            const { data: scraperItem } = await supabaseAdmin
                .from('scraper_items')
                .select('*, scraper_assets(asset_type, storage_path, file_name)')
                .eq('id', itemId)
                .single();

            if (!scraperItem) continue;

            const videoAsset = scraperItem.scraper_assets?.find((a: any) => a.asset_type === 'video');
            const thumbnailAsset = scraperItem.scraper_assets?.find((a: any) => a.asset_type === 'thumbnail');
            const audioAsset = scraperItem.scraper_assets?.find((a: any) => a.asset_type === 'audio');

            await supabaseAdmin
                .from('remix_sources')
                .insert({
                    project_id: project.id,
                    scraper_item_id: itemId,
                    cached_title: scraperItem.title || null,
                    cached_transcript: scraperItem.body_text || null,
                    cached_description: scraperItem.description || null,
                    cached_video_path: videoAsset?.storage_path || null,
                    cached_thumbnail_path: thumbnailAsset?.storage_path || null,
                    cached_audio_path: audioAsset?.storage_path || null,
                    is_primary: i === 0,
                });
        }

        return NextResponse.json({ success: true, data: project }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
