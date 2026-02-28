import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UpdateItemSchema } from '@/lib/scraper/validators';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const { itemId } = await params;

        const { data: item, error } = await supabaseAdmin
            .from('scraper_items')
            .select('*, scraper_assets(*), scraper_metadata(*)')
            .eq('id', itemId)
            .single();

        if (error || !item) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Item not found' } },
                { status: 404 }
            );
        }

        // Generate signed URLs for all assets that have a storage_path
        const BUCKET = 'epic-assets';
        const enrichedAssets = await Promise.all(
            ((item as any).scraper_assets || []).map(async (asset: any) => {
                if (asset.storage_path) {
                    try {
                        const { data: signed } = await supabaseAdmin.storage
                            .from(BUCKET)
                            .createSignedUrl(asset.storage_path, 3600);
                        return { ...asset, signed_url: signed?.signedUrl ?? null };
                    } catch {
                        return { ...asset, signed_url: null };
                    }
                }
                return { ...asset, signed_url: null };
            })
        );

        return NextResponse.json({ success: true, data: { ...item, scraper_assets: enrichedAssets } });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const { itemId } = await params;
        const body = await request.json();

        const parsed = UpdateItemSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
                { status: 400 }
            );
        }

        const update: Record<string, any> = {};
        if (parsed.data.tags !== undefined) update.tags = parsed.data.tags;
        if (parsed.data.notes !== undefined) update.notes = parsed.data.notes;
        if (parsed.data.collectionId !== undefined) update.collection_id = parsed.data.collectionId;
        if (parsed.data.isStarred !== undefined) update.is_starred = parsed.data.isStarred;

        const { data, error } = await supabaseAdmin
            .from('scraper_items')
            .update(update)
            .eq('id', itemId)
            .select()
            .single();

        if (error) {
            return NextResponse.json(
                { success: false, error: { code: 'DB_ERROR', message: error.message } },
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
    _request: Request,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const { itemId } = await params;

        // Get assets to clean up storage
        const { data: assets } = await supabaseAdmin
            .from('scraper_assets')
            .select('storage_path')
            .eq('item_id', itemId);

        // Delete storage files
        if (assets && assets.length > 0) {
            const paths = assets.map(a => a.storage_path).filter(Boolean) as string[];
            if (paths.length > 0) {
                await supabaseAdmin.storage.from('epic-assets').remove(paths);
            }
        }

        // Delete item (cascades to assets and metadata)
        const { error } = await supabaseAdmin
            .from('scraper_items')
            .delete()
            .eq('id', itemId);

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
