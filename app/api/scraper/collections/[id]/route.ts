import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { CreateCollectionSchema } from '@/lib/scraper/validators';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('scraper_collections')
            .select('*, scraper_items(id, title, source_type, source_url, content_type, word_count, is_starred, created_at, scraper_assets(id, asset_type, storage_path, alt_text))')
            .eq('id', id)
            .single();

        if (error || !data) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Collection not found' } },
                { status: 404 }
            );
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

        // Allow partial updates
        const updates: Record<string, any> = {};
        if (body.name !== undefined) updates.name = body.name;
        if (body.description !== undefined) updates.description = body.description;
        if (body.color !== undefined) updates.color = body.color;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('scraper_collections')
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

        // First unlink all items from this collection
        await supabaseAdmin
            .from('scraper_items')
            .update({ collection_id: null })
            .eq('collection_id', id);

        const { error } = await supabaseAdmin
            .from('scraper_collections')
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
