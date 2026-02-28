import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ assetId: string }> }
) {
    try {
        const { assetId } = await params;

        const { data: asset, error } = await supabaseAdmin
            .from('scraper_assets')
            .select('*')
            .eq('id', assetId)
            .single();

        if (error || !asset) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Asset not found' } },
                { status: 404 }
            );
        }

        if (!asset.storage_path) {
            return NextResponse.json(
                { success: false, error: { code: 'NO_FILE', message: 'Asset has no stored file' } },
                { status: 404 }
            );
        }

        // Generate signed URL (1 hour expiry)
        const { data: signedData, error: signedError } = await supabaseAdmin.storage
            .from('epic-assets')
            .createSignedUrl(asset.storage_path, 3600);

        if (signedError || !signedData?.signedUrl) {
            return NextResponse.json(
                { success: false, error: { code: 'STORAGE_ERROR', message: signedError?.message || 'Failed to generate URL' } },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { ...asset, signedUrl: signedData.signedUrl },
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
