import type { ChatMessage } from '@/lib/claude'

const CHAT_KEY = 'wizard_chat'

/** ステップを移動したり離脱しても会話を続けられるよう、履歴をlocalStorageに残す */
export function loadChatMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CHAT_KEY)
    return stored ? (JSON.parse(stored) as ChatMessage[]) : []
  } catch {
    return []
  }
}

export function saveChatMessages(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CHAT_KEY, JSON.stringify(messages))
}

export function clearChatMessages(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CHAT_KEY)
}
