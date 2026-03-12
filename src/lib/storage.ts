import { supabase } from './supabase';

const BUCKET = 'uploads';

/**
 * Upload de arquivo para Supabase Storage.
 * Retorna o path no storage ou null em caso de erro.
 */
export async function uploadFile(
  buffer: Buffer,
  username: string,
  fileType: string,
  originalName: string
): Promise<{ path: string; publicUrl: string } | null> {
  const ext = originalName.split('.').pop() || 'bin';
  const fileName = `${username}/${fileType}_${Date.now()}.${ext}`;

  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  const contentType = mimeMap[ext.toLowerCase()] || 'application/octet-stream';

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error('[STORAGE] Upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return {
    path: fileName,
    publicUrl: urlData.publicUrl,
  };
}

/**
 * Retorna uma URL assinada (privada) para download de um arquivo.
 */
export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error || !data) {
    console.error('[STORAGE] Signed URL error:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Download direto do arquivo do storage.
 */
export async function downloadFile(path: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(path);

  if (error || !data) {
    console.error('[STORAGE] Download error:', error);
    return null;
  }

  const ext = path.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };

  const buffer = Buffer.from(await data.arrayBuffer());
  return {
    buffer,
    contentType: mimeMap[ext] || 'application/octet-stream',
  };
}
