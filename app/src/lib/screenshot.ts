import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { uploadPublicObject } from '@/lib/supabase/storageUpload'

const BUCKET = 'screenshots'

// 参考サイトのスクリーンショットを取得する。
// 失敗しても登録自体は成立させたいので、throw せず null を返す
export async function captureScreenshot(url: string): Promise<Buffer | null> {
  try {
    const { chromium } = await import('playwright')
    const browser = await chromium.launch()
    try {
      const page = await browser.newPage({
        viewport: { width: 1280, height: 800 },
      })
      await page.goto(url, { waitUntil: 'load', timeout: 20000 })
      // 遅延読み込みの画像・Webフォントの描画を少し待つ
      await page.waitForTimeout(1500)
      return await page.screenshot({ type: 'png' })
    } finally {
      await browser.close()
    }
  } catch (e) {
    console.error('screenshot capture failed:', e instanceof Error ? e.message : e)
    return null
  }
}

// Supabase Storage（公開バケット）にアップロードし、公開URLを返す
export async function uploadScreenshot(
  supabase: SupabaseClient,
  referenceId: string,
  png: Buffer,
): Promise<string | null> {
  return uploadPublicObject(supabase, BUCKET, `${referenceId}.png`, png, 'image/png')
}
