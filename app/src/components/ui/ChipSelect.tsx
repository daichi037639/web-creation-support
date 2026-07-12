'use client'

interface ChipSelectProps {
  label?: string
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (value: string) => void
}

export function ChipSelect({ label, options, selected, onToggle }: ChipSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map(({ value, label: optionLabel }) => (
          <button
            key={value}
            onClick={() => onToggle(value)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              selected.includes(value)
                ? 'border-green-600 bg-green-50 text-green-700 font-medium'
                : 'border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  )
}
