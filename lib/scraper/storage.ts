import { supabaseAdmin } from '@/lib/supabase-admin';

const BUCKET = 'epic-assets';

export function scraperStoragePath(orgId: string, jobId: string, ...segments: string[]): string {
  return ['scraper', orgId, jobId, ...segments].join('/');
}

export async function uploadAsset(storagePath: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Storage upload failed for ${storagePath}: ${error.message}`);
  return storagePath;
}

export async function getSignedUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL for ${storagePath}: ${error?.message ?? 'no URL returned'}`);
  }
  return data.signedUrl;
}

export async function deleteAsset(storagePath: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (error) throw new Error(`Storage delete failed for ${storagePath}: ${error.message}`);
}
