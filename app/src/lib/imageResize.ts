'use client'

/** APIへ送る画像。data は base64（データURLの接頭辞なし） */
export interface UploadImage {
  data: string
  mediaType: 'image/jpeg'
}

/**
 * スマホ写真（数MB・HEIC含む）をそのまま送るとAPIの上限を超えるため、
 * ブラウザ側で長辺を縮めてJPEGへ再エンコードしてから送る。
 * 1568px は Claude が画像を縮小せずに読める上限
 */
export async function fileToResizedJpeg(file: File, maxDim = 1568): Promise<UploadImage> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas が利用できません')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  return { data: dataUrl.split(',')[1], mediaType: 'image/jpeg' }
}
