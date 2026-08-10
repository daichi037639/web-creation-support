'use client'

interface CardProps {
  name: string
  description: string
  features: string[]
  screenshotUrl?: string
  selected: boolean
  onSelect: () => void
}

// 画像付きのデザイン候補カード。button要素なのでキーボード（Tab + Enter/Space）でも選択できる
export function DesignCandidateCard({
  name,
  description,
  features,
  screenshotUrl,
  selected,
  onSelect,
}: CardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex h-full flex-col overflow-hidden rounded-xl border bg-white text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-600
        ${selected ? 'border-accent-600 ring-2 ring-accent-600' : 'border-slate-200 hover:border-accent-400'}`}
    >
      {screenshotUrl ? (
        // 外部Storage上のスクリーンショットなので next/image は使わない
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={screenshotUrl}
          alt={`${name} のイメージ`}
          className="h-32 w-full border-b border-slate-100 object-cover object-top"
        />
      ) : (
        <div className="flex h-32 w-full items-center justify-center border-b border-slate-100 bg-slate-50 text-3xl">
          🎨
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="font-bold text-slate-900">{name}</p>
        <p className="text-xs leading-relaxed text-slate-600">{description}</p>
        <ul className="mt-auto space-y-1 pt-1">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-1 text-xs text-slate-500">
              <span className="text-accent-700">✓</span>
              {f}
            </li>
          ))}
        </ul>
        <span
          className={`mt-2 rounded-lg py-2 text-center text-sm font-medium
            ${selected ? 'bg-accent-600 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          {selected ? '選択中 ✓' : 'このデザインを選ぶ'}
        </span>
      </div>
    </button>
  )
}
