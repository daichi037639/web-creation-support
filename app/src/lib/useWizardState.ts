'use client'

import { useSyncExternalStore } from 'react'
import { loadWizardState, WIZARD_STATE_EVENT } from '@/lib/storage'
import { WizardState } from '@/types/wizard'

// SSR中とハイドレーション直後に同じ参照を返すための固定スナップショット
const SERVER_STATE: WizardState = { currentStep: 0, answers: {}, completedSteps: [] }

// getSnapshot は変更がない限り同一参照を返す必要があるためキャッシュする
let snapshot: WizardState | null = null

function getSnapshot(): WizardState {
  if (snapshot === null) snapshot = loadWizardState()
  return snapshot
}

function subscribe(onStoreChange: () => void): () => void {
  const handler = () => {
    snapshot = null
    onStoreChange()
  }
  window.addEventListener(WIZARD_STATE_EVENT, handler)
  return () => window.removeEventListener(WIZARD_STATE_EVENT, handler)
}

/**
 * localStorage のウィザード状態を購読するフック。
 * saveWizardState() が発火するイベントで自動的に再描画される
 */
export function useWizardState(): WizardState {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATE)
}
