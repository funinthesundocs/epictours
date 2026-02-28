import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const BUCKET = 'epic-assets';

// Allowed MIME types for manual upload
const ALLOWED_TYPES: Record<string, { asset_type: string; content_type: string }> = {
    'video/mp4':  { asset_type: 'video', content_type: 'video' },
    'video/quicktime': { asset_type: 'video', content_type: 'video' },
    'video/webm': { asset_type: 'video', content_type: 'video' },
    'video/x-msvideo': { asset_type: 'video', content_type: 'video' },
    'audio/mpeg': { asset_type: 'audio', content_type: 'audio' },
    'audio/wav':  { asset_type: 'audio', content_type: 'audio' },
    'audio/ogg':  { asset_type: 'audio', content_type: 'audio' },
    'image/jpeg': { asset_type: 'image', content_type: 'page' },
    'image/png':  { asset_type: 'image', content_type: 'page' },
    'image/gif':  { asset_type: 'image', content_type: 'page' },
    'image/webp': { asset_type: 'image', content_type: 'page' },
    'application/pdf': { asset_type: 'document', content_type: 'document' },
};

const MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const orgId = formData.get('orgId') as string | null;
        const userId = formData.get('userId') as string | null;
        const title = (formData.get('title') as string | null) || null;
        const description = (formData.get('description') as string | null) || null;
        const collectionId = (formData.get('collectionId') as string | null) || null;

        if (!file || !orgId || !userId) {
            return NextResponse.json(
                { success: false, error: { code: 'MISSING_FIELDS', message: 'file, orgId, and userId are required' } },
                { status: 400 }
            );
        }

        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json(
                { success: false, error: { code: 'FILE_TOO_LARGE', message: 'File exceeds 500 MB limit' } },
                { status: 400 }
            );
        }

        const typeInfo = ALLOWED_TYPES[file.type];
        if (!typeInfo) {
            return NextResponse.json(
                { success: false, error: { code: 'UNSUPPORTED_TYPE', message: `Unsupported file type: ${file.type}` } },
                { status: 400 }
            );
        }

        // Create a synthetic "manual upload" job — scraper_items requires job_id NOT NULL
        const { data: job, error: jobError } = await supabaseAdmin
            .from('scraper_jobs')
            .insert({
                org_id: orgId,
                source_url: `manual://upload/${file.name}`,
                source_type: 'unknown',
                status: 'complete',
                progress: 100,
                items_found: 1,
                assets_found: 1,
                started_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
                created_by: userId,
            })
            .select('id')
            .single();

        if (jobError || !job) {
            return NextResponse.json(
                { success: false, error: { code: 'DB_ERROR', message: jobError?.message || 'Failed to create upload record' } },
                { status: 500 }
            );
        }

        // Upload file to Supabase Storage
        const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `scraper/${orgId}/${job.id}/${safeFileName}`;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(storagePath, buffer, { contentType: file.type, upsert: false });

        if (uploadError) {
            // Clean up job on storage failure
            await supabaseAdmin.from('scraper_jobs').delete().eq('id', job.id);
            return NextResponse.json(
                { success: false, error: { code: 'STORAGE_ERROR', message: uploadError.message } },
                { status: 500 }
            );
        }

        // Create scraper_items record
        const itemTitle = title || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        const { data: item, error: itemError } = await supabaseAdmin
            .from('scraper_items')
            .insert({
                job_id: job.id,
                org_id: orgId,
                collection_id: collectionId || null,
                source_url: `manual://upload/${file.name}`,
                source_type: 'unknown',
                source_domain: 'manual-upload',
                title: itemTitle,
                description: description || null,
                content_type: typeInfo.content_type,
                asset_count: 1,
                scraped_at: new Date().toISOString(),
            })
            .select('id')
            .single();

        if (itemError || !item) {
            await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
            await supabaseAdmin.from('scraper_jobs').delete().eq('id', job.id);
            return NextResponse.json(
                { success: false, error: { code: 'DB_ERROR', message: itemError?.message || 'Failed to create item record' } },
                { status: 500 }
            );
        }

        // Create scraper_assets record
        const { error: assetError } = await supabaseAdmin
            .from('scraper_assets')
            .insert({
                item_id: item.id,
                job_id: job.id,
                org_id: orgId,
                asset_type: typeInfo.asset_type,
                file_name: safeFileName,
                mime_type: file.type,
                file_size_bytes: file.size,
                storage_path: storagePath,
            });

        if (assetError) {
            // Non-fatal — item is created, asset record is a bonus
            console.error('Failed to create asset record:', assetError.message);
        }

        return NextResponse.json({ success: true, data: { itemId: item.id, jobId: job.id } });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}
