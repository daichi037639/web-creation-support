import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 公開バケットへアップロードし、公開URLを返す。
 * バケットが未作成なら作ってリトライする（secret key クライアント前提）。
 * 失敗しても呼び出し元の処理を止めたくないため、throw せず null を返す
 */
export async function uploadPublicObject(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  body: Buffer,
  contentType: string,
): Promise<string | null> {
  const options = { contentType, upsert: true }

  let { error } = await supabase.storage.from(bucket).upload(path, body, options)
  if (error && /bucket/i.test(error.message)) {
    await supabase.storage.createBucket(bucket, { public: true })
    ;({ error } = await supabase.storage.from(bucket).upload(path, body, options))
  }
  if (error) {
    console.error(`storage upload failed (${bucket}/${path}):`, error.message)
    return null
  }
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export async function removePublicObject(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
): Promise<boolean> {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) {
    console.error(`storage remove failed (${bucket}/${path}):`, error.message)
    return false
  }
  return true
}
