'use client'

import { useEffect } from 'react'
import { StepId } from '@/types/wizard'

interface StepClearOverlayProps {
  stepId: StepId
  onDone: () => void
}

const CONFETTI = ['🎉', '✨', '🌟', '🎊', '✨', '🌟']

/** ステップクリア時のお祝い演出。表示後に自動で onDone を呼ぶ */
export function StepClearOverlay({ stepId, onDone }: StepClearOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1600)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="animate-clear-pop flex flex-col items-center gap-3 rounded-2xl bg-white px-10 py-8 shadow-2xl">
        <div className="relative">
          <span className="text-5xl">🏆</span>
          {CONFETTI.map((emoji, i) => (
            <span
              key={i}
              className="animate-confetti absolute left-1/2 top-1/2 text-xl"
              style={{ animationDelay: `${i * 0.1}s`, ['--angle' as string]: `${i * 60}deg` }}
            >
              {emoji}
            </span>
          ))}
        </div>
        <p className="text-xl font-bold text-gray-900">STEP {stepId} クリア！</p>
        <p className="text-sm text-gray-500">その調子です。次に進みましょう</p>
      </div>
    </div>
  )
}
