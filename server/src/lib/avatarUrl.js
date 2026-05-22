import { getStorageSupabase } from './supabase.js'

export const AVATAR_BUCKET = 'credo-w-media'
const SIGNED_TTL_SEC = 60 * 60 * 24 * 365

/** Extract object path inside credo-w-media from DB value (path or full URL). */
export function avatarStoragePath(stored) {
  if (!stored || typeof stored !== 'string') return null
  const trimmed = stored.trim()
  if (!trimmed.startsWith('http')) return trimmed

  const patterns = [
    /\/storage\/v1\/object\/(?:public|sign)\/credo-w-media\/([^?]+)/,
    /\/credo-w-media\/([^?]+)/,
  ]
  for (const re of patterns) {
    const m = trimmed.match(re)
    if (m?.[1]) return decodeURIComponent(m[1])
  }
  return null
}

/** URL the browser can load (signed URL for private buckets, public URL as fallback). */
export async function resolveAvatarDisplayUrl(stored, storageClient) {
  if (!stored) return null

  if (stored.startsWith('http') && !stored.includes('supabase.co')) {
    return stored
  }

  const storage = storageClient || getStorageSupabase()
  const path = avatarStoragePath(stored)

  if (path) {
    const { data, error } = await storage.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(path, SIGNED_TTL_SEC)
    if (!error && data?.signedUrl) return data.signedUrl

    const { data: pub } = storage.storage.from(AVATAR_BUCKET).getPublicUrl(path)
    return pub.publicUrl
  }

  return stored.startsWith('http') ? stored : null
}
