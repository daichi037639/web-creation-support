import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { uploadPublicObject, removePublicObject } from './storageUpload'

const BUCKET = 'materials'

// 素材写真の実体は公開バケット materials に {sessionId}/{materialId}.jpg で置く。
// secret key を使うため、このモジュールは上記パス規約の読み書きしかしないこと
function createMaterialsClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!url || !secretKey) throw new Error('Supabase の環境変数が設定されていません')
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function materialPath(sessionId: string, materialId: string): string {
  return `${sessionId}/${materialId}.jpg`
}

/** アップロードして公開URLを返す。失敗時は null */
export async function uploadMaterialImage(
  sessionId: string,
  materialId: string,
  jpeg: Buffer,
): Promise<string | null> {
  const supabase = createMaterialsClient()
  return uploadPublicObject(supabase, BUCKET, materialPath(sessionId, materialId), jpeg, 'image/jpeg')
}

export async function removeMaterialImage(
  sessionId: string,
  materialId: string,
): Promise<boolean> {
  const supabase = createMaterialsClient()
  return removePublicObject(supabase, BUCKET, materialPath(sessionId, materialId))
}
