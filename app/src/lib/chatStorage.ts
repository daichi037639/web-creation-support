/** AIが提案したカード記入。ユーザーが「反映」を押すまでカードには書き込まない */
export interface CardProposal {
  id: string
  title: string
  value: string
  applied: boolean
}

export interface StoredChatMessage {
  role: 'user' | 'assistant'
  content: string
  proposals?: CardProposal[]
}

const CHAT_KEY = 'wizard_chat'

/** チャット履歴の保存をセッション同期（SessionSync）へ知らせるイベント */
export const WIZARD_CHAT_EVENT = 'wizard-chat-changed'

/** ステップを移動したり離脱しても会話を続けられるよう、履歴をlocalStorageに残す */
export function loadChatMessages(): StoredChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CHAT_KEY)
    return stored ? (JSON.parse(stored) as StoredChatMessage[]) : []
  } catch {
    return []
  }
}

export function saveChatMessages(messages: StoredChatMessage[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CHAT_KEY, JSON.stringify(messages))
  window.dispatchEvent(new Event(WIZARD_CHAT_EVENT))
}

export function clearChatMessages(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CHAT_KEY)
}
