'use client'

import { TextareaHTMLAttributes, useId } from 'react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
}

export function TextArea({ label, hint, className = '', ...props }: TextAreaProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <textarea
        id={id}
        rows={4}
        className={`w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20 resize-none ${className}`}
        {...props}
      />
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}
