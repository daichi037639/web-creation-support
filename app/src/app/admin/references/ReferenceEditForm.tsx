'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { INDUSTRY_OPTIONS } from '@/lib/questions'
import type { DesignReference } from '@/types/designReference'

interface Props {
  reference: DesignReference
  onSaved: (updated: DesignReference) => void
  onCancel: () => void
}

export function ReferenceEditForm({ reference, onSaved, onCancel }: Props) {
  const [title, setTitle] = useState(reference.title)
  const [industry, setIndustry] = useState(reference.industry)
  const [tags, setTags] = useState(reference.style_tags.join(', '))
  const [summary, setSummary] = useState(reference.summary)
  const [status, setStatus] = useState(reference.status)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setError('')
    setSaving(true)
    const res = await fetch(`/api/admin/references/${reference.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        industry,
        style_tags: tags.split(',').map((t) => t.trim()),
        summary,
        status,
      }),
    })
    setSaving(false)
    const body = await res.json().catch(() => null)
    if (res.ok) {
      onSaved(body.reference)
    } else {
      setError(body?.error ?? '保存に失敗しました')
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-700 focus:outline-none'

  return (
    <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
      <label className="block text-xs text-gray-500">
        サイト名
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </label>
      <div className="flex gap-3">
        <label className="block flex-1 text-xs text-gray-500">
          業界
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className={inputClass}
          >
            {!INDUSTRY_OPTIONS.some((o) => o.label === industry) && (
              <option value={industry}>{industry}</option>
            )}
            {INDUSTRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.label}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block flex-1 text-xs text-gray-500">
          公開状態
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
            className={inputClass}
          >
            <option value="published">公開（published）</option>
            <option value="draft">非公開（draft）</option>
          </select>
        </label>
      </div>
      <label className="block text-xs text-gray-500">
        スタイルタグ（カンマ区切り）
        <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputClass} />
      </label>
      <label className="block text-xs text-gray-500">
        紹介文
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={3}
          className={inputClass}
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '保存中…' : '保存'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          キャンセル
        </Button>
      </div>
    </div>
  )
}
