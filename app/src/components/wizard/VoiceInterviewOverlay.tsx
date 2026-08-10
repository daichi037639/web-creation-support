'use client'

import { useEffect, useState } from 'react'
import { MicIcon, MicOffIcon } from '@/components/ui/icons'
import { useVoiceInterview } from '@/lib/useVoiceInterview'
import { VoiceState } from '@/lib/voiceInterview'

interface OverlayProps {
  onClose: () => void
  /** 音声が使えないときに、既存のテキストインタビューへ切り替える */
  onFallbackToText: () => void
}

/** リトライは key を変えてセッションごと作り直す（WebRTC接続を最初からやり直すため） */
export function VoiceInterviewOverlay(props: OverlayProps) {
  const [attempt, setAttempt] = useState(0)
  return <VoiceInterviewSession key={attempt} {...props} onRetry={() => setAttempt((a) => a + 1)} />
}

const STATE_LABELS: Record<VoiceState, string> = {
  idle: '',
  requesting_permission: 'マイクの許可を確認しています…',
  connecting: 'AIにつないでいます…',
  listening: 'どうぞ、お話しください',
  processing: 'AIが考えています…',
  speaking: 'AIが話しています',
  muted: 'マイクがオフになっています',
  ended: 'インタビューを終了しました',
  error: 'エラーが発生しました',
}

const STATE_HINTS: Partial<Record<VoiceState, string>> = {
  listening: '話しかけるだけで、カードが自動で埋まっていきます',
  muted: 'マイクボタンを押すと再開できます',
  ended: 'カードに保存した内容は、あとから確認・修正できます',
}

function VoiceInterviewSession({
  onClose,
  onFallbackToText,
  onRetry,
}: OverlayProps & { onRetry: () => void }) {
  const { state, muted, errorMessage, transcript, savedTitles, stop, toggleMute } =
    useVoiceInterview()
  const [showTranscript, setShowTranscript] = useState(false)
  // 保存トーストは一定時間で消す。savedTitles は保存のたびに新しい配列になるため参照比較で判定できる
  const [dismissedToast, setDismissedToast] = useState<string[] | null>(null)
  const toast = savedTitles !== dismissedToast ? savedTitles : []

  useEffect(() => {
    if (savedTitles.length === 0) return
    const timer = setTimeout(() => setDismissedToast(savedTitles), 3500)
    return () => clearTimeout(timer)
  }, [savedTitles])

  // 終了メッセージを見せてから自動で閉じる
  useEffect(() => {
    if (state !== 'ended') return
    const timer = setTimeout(onClose, 2500)
    return () => clearTimeout(timer)
  }, [state, onClose])

  function endAndClose() {
    stop()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex h-dvh flex-col bg-night text-white"
      role="dialog"
      aria-label="AI音声インタビュー"
    >
      <header className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <div>
          <h2 className="text-sm font-semibold text-white/90">AI音声インタビュー</h2>
          <p className="mt-0.5 text-[11px] text-white/40">AIと会話しながらサイトの材料を集めます</p>
        </div>
        <button
          onClick={endAndClose}
          className="flex min-h-11 items-center rounded-full px-4 text-xs text-white/60 ring-1 ring-white/15 hover:text-white"
        >
          閉じる
        </button>
      </header>

      {toast.length > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-20 z-10 w-[90%] max-w-sm -translate-x-1/2">
          <div className="animate-clear-pop rounded-xl bg-accent-600/90 px-4 py-2.5 text-center text-xs font-medium text-white shadow-lg">
            ✓ 「{toast.join('」「')}」をカードに保存しました
          </div>
        </div>
      )}

      {state === 'error' ? (
        <ErrorView
          message={errorMessage}
          onRetry={onRetry}
          onFallbackToText={onFallbackToText}
          onClose={onClose}
        />
      ) : (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
            <VoiceOrb state={state} />
            <div className="text-center">
              <p className="text-base font-medium text-white/90">{STATE_LABELS[state]}</p>
              {STATE_HINTS[state] && (
                <p className="mt-2 text-xs text-white/40">{STATE_HINTS[state]}</p>
              )}
            </div>
          </div>

          {showTranscript && <TranscriptPanel transcript={transcript} />}

          <div className="flex items-center justify-center gap-6 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
            <ControlButton
              label={muted ? 'マイクをオンにする' : 'マイクをオフにする'}
              onClick={toggleMute}
              className={muted ? 'bg-white text-night' : 'bg-white/10 text-white hover:bg-white/20'}
            >
              {muted ? <MicOffIcon size={24} /> : <MicIcon size={24} />}
            </ControlButton>
            <ControlButton
              label="インタビューを終了する"
              onClick={endAndClose}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              <span className="text-xl leading-none">✕</span>
            </ControlButton>
            <button
              onClick={() => setShowTranscript((v) => !v)}
              className="min-h-11 rounded-full px-3 text-xs text-white/50 hover:text-white"
            >
              {showTranscript ? '文字を隠す' : '文字で見る'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function VoiceOrb({ state }: { state: VoiceState }) {
  const busy =
    state === 'requesting_permission' || state === 'connecting' || state === 'processing'
  const orbClass =
    state === 'speaking'
      ? 'animate-[voice-talk_0.9s_ease-in-out_infinite] bg-accent-400'
      : state === 'listening'
        ? 'animate-[voice-breathe_2.4s_ease-in-out_infinite] bg-accent-500'
        : state === 'muted'
          ? 'bg-slate-600'
          : 'bg-accent-800'
  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      {state === 'listening' && (
        <div className="absolute inset-4 rounded-full bg-accent-500/40 animate-[voice-ring_2.4s_ease-out_infinite]" />
      )}
      {state === 'speaking' && (
        <div className="absolute inset-4 rounded-full bg-accent-400/40 animate-[voice-ring_1.2s_ease-out_infinite]" />
      )}
      <div
        className={`relative flex h-36 w-36 items-center justify-center rounded-full shadow-[0_0_80px_rgba(0,153,255,0.35)] transition-colors duration-300 ${orbClass}`}
      >
        {busy && (
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 animate-bounce rounded-full bg-white/80"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
        {state === 'muted' && <MicOffIcon size={40} className="text-white/70" />}
        {state === 'listening' && <MicIcon size={40} className="text-white/90" />}
      </div>
    </div>
  )
}

function ControlButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string
  onClick: () => void
  className: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${className}`}
    >
      {children}
    </button>
  )
}

function TranscriptPanel({
  transcript,
}: {
  transcript: { role: 'user' | 'assistant'; text: string }[]
}) {
  return (
    <div className="mx-4 mb-2 max-h-44 overflow-y-auto rounded-2xl bg-white/5 p-3 text-xs leading-relaxed">
      {transcript.length === 0 && <p className="text-white/40">会話が始まるとここに表示されます</p>}
      {transcript.map((line, i) => (
        <p key={i} className={line.role === 'user' ? 'text-accent-300' : 'text-white/80'}>
          <span className="mr-1.5 text-white/40">{line.role === 'user' ? 'あなた' : 'AI'}</span>
          {line.text}
        </p>
      ))}
    </div>
  )
}

function ErrorView({
  message,
  onRetry,
  onFallbackToText,
  onClose,
}: {
  message: string
  onRetry: () => void
  onFallbackToText: () => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl">
        ⚠️
      </div>
      <div className="text-center">
        <p className="text-base font-medium">音声インタビューを開始できません</p>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/60">{message}</p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          onClick={onRetry}
          className="min-h-12 rounded-xl bg-accent-600 text-sm font-medium text-white hover:bg-accent-700"
        >
          もう一度試す
        </button>
        <button
          onClick={onFallbackToText}
          className="min-h-12 rounded-xl bg-white/10 text-sm font-medium text-white hover:bg-white/20"
        >
          テキストのインタビューで進める
        </button>
        <button onClick={onClose} className="min-h-11 text-xs text-white/50 hover:text-white">
          閉じる
        </button>
      </div>
    </div>
  )
}
