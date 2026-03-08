/**
 * Convert a raw Supabase Storage URL to a transformation URL for optimised delivery.
 */
export function getAvatarUrl(
  rawUrl: string | null,
  size: number = 256
): string | null {
  if (!rawUrl) return null;
  if (!rawUrl.includes('supabase.co/storage')) return rawUrl;

  const transformed = rawUrl.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );
  // Strip any existing query params before adding transformation params
  const base = transformed.split('?')[0];
  return `${base}?width=${size}&height=${size}&quality=80&resize=cover`;
}
