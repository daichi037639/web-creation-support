'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { DesignReference } from '@/types/designReference'

export function ReferenceManager({
  initialReferences,
}: {
  initialReferences: DesignReference[]
}) {
  const [url, setUrl] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [references, setReferences] = useState(initialReferences)

  async function loadReferences() {
    const res = await fetch('/api/admin/references')
    if (res.ok) {
      const body = await res.json()
      setReferences(body.references)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    const res = await fetch('/api/admin/references', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    setLoading(false)
    const body = await res.json().catch(() => null)
    if (res.ok) {
      setUrl('')
      setMessage(`登録しました: ${body.reference.title}`)
      loadReferences()
    } else {
      setMessage(body?.error ?? '登録に失敗しました')
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleRegister} className="flex gap-2">
        <input
          type="url"
          required
          placeholder="https://example.com（参考にしたいサイトのURL）"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-green-700 focus:outline-none"
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'AI分析中…' : '登録'}
        </Button>
      </form>
      {message && <p className="text-sm text-gray-700">{message}</p>}

      <ul className="space-y-3">
        {references.map((ref) => (
          <li key={ref.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <a
                href={ref.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-green-800 hover:underline"
              >
                {ref.title}
              </a>
              <span className="shrink-0 text-xs text-gray-500">
                {ref.industry} / {ref.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{ref.summary}</p>
            <p className="mt-1 text-xs text-gray-400">
              {ref.style_tags.join(' / ')}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
