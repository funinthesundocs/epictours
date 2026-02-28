import { supabaseAdmin } from '@/lib/supabase-admin';

const BUCKET = 'epic-assets';

/** Build storage path for remix assets: remix/{orgId}/{projectId}/... */
export function remixStoragePath(orgId: string, projectId: string, ...segments: string[]): string {
  return ['remix', orgId, projectId, ...segments].join('/');
}

export async function uploadRemixAsset(storagePath: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Remix storage upload failed for ${storagePath}: ${error.message}`);
  return storagePath;
}

export async function getRemixSignedUrl(storagePath: string, expiresIn: number = 3600): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL for ${storagePath}: ${error?.message ?? 'no URL returned'}`);
  }
  return data.signedUrl;
}

export async function deleteRemixAsset(storagePath: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (error) throw new Error(`Remix storage delete failed for ${storagePath}: ${error.message}`);
}

/** Delete all assets for a project */
export async function deleteProjectAssets(orgId: string, projectId: string): Promise<void> {
  const prefix = remixStoragePath(orgId, projectId);
  const { data: files } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(prefix, { limit: 1000 });

  if (files && files.length > 0) {
    const paths = files.map((f) => `${prefix}/${f.name}`);
    await supabaseAdmin.storage.from(BUCKET).remove(paths);
  }
}
