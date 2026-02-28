import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UpdateRemixProjectSchema } from '@/lib/remix/validators';
import { getRemixSignedUrl } from '@/lib/remix/storage';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('remix_projects')
            .select(`
                *,
                remix_sources(id, scraper_item_id, cached_title, cached_transcript, cached_description, cached_video_path, cached_thumbnail_path, is_primary),
                remix_titles(id, style, title, reasoning, is_selected),
                remix_thumbnails(id, prompt, file_path, analysis, is_selected),
                remix_scripts(id, full_script, tone, total_duration_seconds, is_selected),
                remix_jobs(id, type, status, progress, error_message, created_at)
            `)
            .eq('id', id)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } },
                { status: 404 }
            );
        }

        // Fetch scenes for each script
        if (data.remix_scripts && data.remix_scripts.length > 0) {
            const scriptIds = data.remix_scripts.map((s: any) => s.id);
            const { data: scenes } = await supabaseAdmin
                .from('remix_scenes')
                .select('*')
                .in('script_id', scriptIds)
                .order('scene_number', { ascending: true });

            // Attach scenes to their scripts
            for (const script of data.remix_scripts) {
                (script as any).scenes = (scenes || []).filter((s: any) => s.script_id === script.id);
            }
        }

        // Generate signed URLs for thumbnails
        if (data.remix_thumbnails && data.remix_thumbnails.length > 0) {
            for (const thumb of data.remix_thumbnails) {
                try {
                    (thumb as any).signed_url = await getRemixSignedUrl(thumb.file_path);
                } catch {
                    (thumb as any).signed_url = null;
                }
            }
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Handle selection operations (not part of standard schema validation)
        if (body.selectTitle) {
            // Deselect all titles, then select the specified one
            await supabaseAdmin
                .from('remix_titles')
                .update({ is_selected: false })
                .eq('project_id', id);
            await supabaseAdmin
                .from('remix_titles')
                .update({ is_selected: true })
                .eq('id', body.selectTitle)
                .eq('project_id', id);
            return NextResponse.json({ success: true });
        }

        if (body.selectThumbnail) {
            await supabaseAdmin
                .from('remix_thumbnails')
                .update({ is_selected: false })
                .eq('project_id', id);
            await supabaseAdmin
                .from('remix_thumbnails')
                .update({ is_selected: true })
                .eq('id', body.selectThumbnail)
                .eq('project_id', id);
            return NextResponse.json({ success: true });
        }

        if (body.selectScript) {
            await supabaseAdmin
                .from('remix_scripts')
                .update({ is_selected: false })
                .eq('project_id', id);
            await supabaseAdmin
                .from('remix_scripts')
                .update({ is_selected: true })
                .eq('id', body.selectScript)
                .eq('project_id', id);
            return NextResponse.json({ success: true });
        }

        if (body.editTitle) {
            const { id: titleId, title } = body.editTitle;
            await supabaseAdmin
                .from('remix_titles')
                .update({ title })
                .eq('id', titleId)
                .eq('project_id', id);
            return NextResponse.json({ success: true });
        }

        // Handle approval
        if (body.approved === true) {
            // Verify all selections exist
            const { data: project } = await supabaseAdmin
                .from('remix_projects')
                .select(`
                    id,
                    remix_titles(id, is_selected),
                    remix_thumbnails(id, is_selected),
                    remix_scripts(id, is_selected)
                `)
                .eq('id', id)
                .single();

            if (!project) {
                return NextResponse.json(
                    { success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } },
                    { status: 404 }
                );
            }

            const hasSelectedTitle = (project as any).remix_titles?.some((t: any) => t.is_selected);
            const hasSelectedThumbnail = (project as any).remix_thumbnails?.some((t: any) => t.is_selected);
            const hasSelectedScript = (project as any).remix_scripts?.some((s: any) => s.is_selected);

            if (!hasSelectedTitle || !hasSelectedThumbnail || !hasSelectedScript) {
                return NextResponse.json(
                    { success: false, error: { code: 'APPROVAL_INCOMPLETE', message: 'Must select title, thumbnail, and script before approving' } },
                    { status: 400 }
                );
            }

            await supabaseAdmin
                .from('remix_projects')
                .update({ status: 'generating' })
                .eq('id', id);

            return NextResponse.json({ success: true });
        }

        // Standard project updates
        const parsed = UpdateRemixProjectSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
                { status: 400 }
            );
        }

        const updates: Record<string, any> = {};
        if (parsed.data.name !== undefined) updates.name = parsed.data.name;
        if (parsed.data.description !== undefined) updates.description = parsed.data.description;
        if (parsed.data.settings !== undefined) updates.settings = parsed.data.settings;
        if (body.status) updates.status = body.status;

        if (Object.keys(updates).length > 0) {
            const { data, error } = await supabaseAdmin
                .from('remix_projects')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error || !data) {
                return NextResponse.json(
                    { success: false, error: { code: 'DB_ERROR', message: error?.message || 'Update failed' } },
                    { status: 500 }
                );
            }

            return NextResponse.json({ success: true, data });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { error } = await supabaseAdmin
            .from('remix_projects')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json(
                { success: false, error: { code: 'DB_ERROR', message: error.message } },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
