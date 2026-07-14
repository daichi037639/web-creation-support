'use client'

/**
 * 質問カードの「AIと一緒に考える」から、レイアウトに常駐するチャットを開くためのイベント。
 * チャットはウィザード全体で1つ（wizard/layout.tsx）なので、propsではなくイベントで届ける
 */
export const CONSULT_EVENT = 'wizard-consult'

export interface ConsultDetail {
  topic: string
}

export function requestConsult(topic: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<ConsultDetail>(CONSULT_EVENT, { detail: { topic } }))
}

export function subscribeConsult(handler: (detail: ConsultDetail) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<ConsultDetail>).detail)
  window.addEventListener(CONSULT_EVENT, listener)
  return () => window.removeEventListener(CONSULT_EVENT, listener)
}
