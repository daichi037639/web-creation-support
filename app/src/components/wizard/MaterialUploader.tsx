'use client'

import { useRef, useState } from 'react'
import { fileToResizedJpeg } from '@/lib/imageResize'
import { MAX_MATERIALS, MATERIAL_KIND_LABELS } from '@/lib/materials'
import { getStoredSessionId, setStoredSessionId, pushSession } from '@/lib/sessionSync'
import type { MaterialImage, MaterialKind } from '@/types/wizard'

interface MaterialUploaderProps {
  materials: MaterialImage[]
  onChange: (materials: MaterialImage[]) => void
}

/** サイト掲載用は資料読み取り用（1568px）より少し大きめに縮小する */
const UPLOAD_MAX_DIM = 1920

// アップロード先パス（{sessionId}/…）を決めるセッションIDを確保する。
// サーバー同期が使えない環境でも、この機能単体で動くようにローカル採番へフォールバックする
async function ensureSessionId(): Promise<string> {
  const stored = getStoredSessionId()
  if (stored) return stored
  try {
    const id = await pushSession(true)
    if (id) return id
  } catch {
    /* 同期テーブル未作成などは無視してフォールバックへ */
  }
  const id = crypto.randomUUID()
  setStoredSessionId(id)
  return id
}

/**
 * 実素材写真のアップロード。実体は Supabase Storage に置き、
 * wizard_state には URL・種類・キャプションだけを持つ。生成サイトにそのまま掲載される
 */
export function MaterialUploader({ materials, onChange }: MaterialUploaderProps) {
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function addPhotos(files: FileList | null) {
    if (!files || files.length === 0) return
    setNotice('')
    setLoading(true)
    try {
      const selected = Array.from(files).slice(0, MAX_MATERIALS - materials.length)
      const sessionId = await ensureSessionId()
      const images = await Promise.all(selected.map((f) => fileToResizedJpeg(f, UPLOAD_MAX_DIM)))
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, images }),
      })
      const body = await res.json()
      if (!res.ok) {
        setNotice(body.error ?? 'アップロードに失敗しました')
      } else {
        onChange([...materials, ...body.materials])
        setNotice('✓ 写真を追加しました。種類と説明は必要なら直してください')
      }
    } catch {
      setNotice('アップロードに失敗しました。通信環境を確認して試してください')
    }
    setLoading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function updateMaterial(id: string, patch: Partial<MaterialImage>) {
    onChange(materials.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  async function removeMaterial(id: string) {
    setNotice('')
    const sessionId = getStoredSessionId()
    try {
      const res = await fetch('/api/materials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, materialId: id }),
      })
      if (!res.ok) throw new Error()
      onChange(materials.filter((m) => m.id !== id))
    } catch {
      setNotice('削除に失敗しました。時間をおいて試してください')
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium text-slate-800">サイトに載せる写真素材</p>
        <p className="mt-0.5 text-xs text-slate-500">
          商品・店構え・ロゴなどの写真を追加すると、生成されるサイトにそのまま掲載されます。
          AIが写真の種類と説明を自動で付けます
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => addPhotos(e.target.files)}
        className="hidden"
        aria-label="サイトに載せる写真を選ぶ"
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading || materials.length >= MAX_MATERIALS}
        className="rounded-lg border border-accent-300 bg-white px-3 py-2 text-sm font-medium text-accent-800 hover:bg-accent-50 disabled:opacity-40"
      >
        {loading
          ? 'AIが写真を確認しています…'
          : `📷 写真を追加する（${materials.length}/${MAX_MATERIALS}）`}
      </button>

      {materials.map((m) => (
        <div key={m.id} className="flex items-start gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={m.url}
            alt={m.caption || '素材写真'}
            className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <select
              value={m.kind}
              onChange={(e) => updateMaterial(m.id, { kind: e.target.value as MaterialKind })}
              aria-label="写真の種類"
              className="w-fit rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
            >
              {Object.entries(MATERIAL_KIND_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={m.caption}
              onChange={(e) => updateMaterial(m.id, { caption: e.target.value })}
              placeholder="どんな写真か（例：看板商品の煎茶）"
              aria-label="写真の説明"
              className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-800"
            />
          </div>
          <button
            onClick={() => removeMaterial(m.id)}
            aria-label={`${m.caption || '写真'}を削除`}
            className="shrink-0 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            削除
          </button>
        </div>
      ))}

      {notice && <p className="text-xs font-medium text-accent-800">{notice}</p>}
    </section>
  )
}
