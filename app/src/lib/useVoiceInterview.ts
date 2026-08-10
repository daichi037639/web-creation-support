'use client'

import { useEffect, useRef, useState } from 'react'
import { getAllQuestions } from '@/lib/questions'
import { loadWizardState, saveWizardState, updateCards } from '@/lib/storage'
import {
  END_INTERVIEW_TOOL,
  SAVE_ANSWERS_TOOL,
  VoiceState,
  parseCardUpdates,
} from '@/lib/voiceInterview'
import { CardAnswer } from '@/types/wizard'

export interface TranscriptLine {
  role: 'user' | 'assistant'
  text: string
}

/** OpenAI Realtime からデータチャネルで届くサーバーイベント（利用する項目のみ） */
interface RealtimeServerEvent {
  type: string
  transcript?: string
  call_id?: string
  name?: string
  arguments?: string
  error?: { message?: string }
}

const MIC_ERROR_MESSAGES: Record<string, string> = {
  NotAllowedError:
    'マイクの使用が許可されませんでした。ブラウザの設定でこのサイトのマイクを許可してから、もう一度お試しください。',
  NotFoundError: 'マイクが見つかりませんでした。マイクが使える状態か確認してください。',
}

/**
 * AI音声インタビューのセッションを管理するフック。
 * マウントと同時にマイク許可 → 一時キー取得 → WebRTC接続まで進める。
 * AIが save_answers を呼ぶと質問カードへ即保存し、既存の自動保存・Supabase同期に乗る
 */
export function useVoiceInterview() {
  const [state, setState] = useState<VoiceState>('requesting_permission')
  const [muted, setMuted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [savedTitles, setSavedTitles] = useState<string[]>([])
  // 接続の実体はeffect内クロージャが持つ。UIからの操作はこのrefを経由する
  const controls = useRef({ stop: () => {}, toggleMute: () => {} })

  useEffect(() => {
    let cancelled = false
    let ending = false
    let mic: MediaStream | null = null
    let pc: RTCPeerConnection | null = null
    let audioEl: HTMLAudioElement | null = null
    let endTimer: ReturnType<typeof setTimeout> | undefined

    function release() {
      clearTimeout(endTimer)
      pc?.close()
      pc = null
      mic?.getTracks().forEach((t) => t.stop())
      mic = null
      if (audioEl) {
        audioEl.srcObject = null
        audioEl = null
      }
    }

    function fail(message: string) {
      release()
      setErrorMessage(message)
      setState('error')
    }

    function finish() {
      if (cancelled) return
      ending = true
      release()
      setState('ended')
    }

    function applySavedAnswers(argsJson: string) {
      const wizard = loadWizardState()
      const profile = wizard.answers.profile ?? {}
      const updates = parseCardUpdates(argsJson, profile)
      if (updates.length === 0) return
      const cards: Record<string, CardAnswer> = {}
      for (const u of updates) cards[u.id] = { value: u.value, status: 'answered' }
      saveWizardState(updateCards(wizard, cards))
      const titles = new Map(getAllQuestions(profile).map((q) => [q.id, q.title]))
      setSavedTitles(updates.map((u) => titles.get(u.id) ?? u.id))
    }

    function handleFunctionCall(event: RealtimeServerEvent, dc: RTCDataChannel) {
      if (event.name === SAVE_ANSWERS_TOOL) {
        applySavedAnswers(event.arguments ?? '')
        dc.send(
          JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'function_call_output',
              call_id: event.call_id,
              output: '{"saved":true}',
            },
          }),
        )
        // 保存で会話を止めず、AIにリアクションと次の質問を続けさせる
        dc.send(JSON.stringify({ type: 'response.create' }))
      } else if (event.name === END_INTERVIEW_TOOL) {
        ending = true
        // お別れの音声を話し終えたら閉じる。停止イベントを取り逃しても8秒で必ず閉じる
        endTimer = setTimeout(finish, 8000)
      }
    }

    function handleServerEvent(event: RealtimeServerEvent, dc: RTCDataChannel) {
      switch (event.type) {
        case 'input_audio_buffer.speech_started':
          // AIの発話中でもユーザーが話し始めたら「聞いている」へ（割り込み対応）
          if (!ending) setState('listening')
          break
        case 'input_audio_buffer.speech_stopped':
        case 'response.created':
          if (!ending) setState('processing')
          break
        case 'output_audio_buffer.started':
          if (!ending) setState('speaking')
          break
        case 'output_audio_buffer.stopped':
          if (ending) finish()
          else setState('listening')
          break
        case 'conversation.item.input_audio_transcription.completed': {
          const text = event.transcript?.trim()
          if (text) setTranscript((prev) => [...prev, { role: 'user', text }])
          break
        }
        case 'response.output_audio_transcript.done': {
          const text = event.transcript?.trim()
          if (text) setTranscript((prev) => [...prev, { role: 'assistant', text }])
          break
        }
        case 'response.function_call_arguments.done':
          handleFunctionCall(event, dc)
          break
        case 'error':
          console.error('Realtime API error:', event.error)
          break
      }
    }

    async function connect() {
      try {
        mic = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (err) {
        if (cancelled) return
        const name = err instanceof DOMException ? err.name : ''
        fail(
          MIC_ERROR_MESSAGES[name] ??
            'マイクを開始できませんでした。別のブラウザでもお試しください。',
        )
        return
      }
      if (cancelled) return release()
      setState('connecting')

      try {
        const res = await fetch('/api/voice/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: loadWizardState().answers }),
        })
        if (!res.ok) throw new Error(`session ${res.status}`)
        const { clientSecret, model } = (await res.json()) as {
          clientSecret: string
          model: string
        }
        if (cancelled) return release()

        // マイク許可直後のWebRTC音声はモバイルSafariでも自動再生できる
        audioEl = document.createElement('audio')
        audioEl.autoplay = true
        audioEl.setAttribute('playsinline', 'true')

        pc = new RTCPeerConnection()
        pc.addTrack(mic.getAudioTracks()[0], mic)
        pc.ontrack = (e) => {
          if (audioEl) {
            audioEl.srcObject = e.streams[0]
            audioEl.play().catch(() => {
              // 自動再生が拒否されても次のユーザー操作で復帰するため握りつぶす
            })
          }
        }
        pc.onconnectionstatechange = () => {
          if (cancelled || ending) return
          if (pc?.connectionState === 'failed') {
            fail('通信が切断されました。電波の良い場所で、もう一度お試しください。')
          }
        }

        const dc = pc.createDataChannel('oai-events')
        dc.onmessage = (e) => {
          if (cancelled) return
          try {
            handleServerEvent(JSON.parse(e.data) as RealtimeServerEvent, dc)
          } catch {
            // 想定外のペイロードは無視する
          }
        }
        dc.onopen = () => {
          if (cancelled) return
          setState('processing')
          // AI側から挨拶と最初の質問を始めさせる
          dc.send(JSON.stringify({ type: 'response.create' }))
        }

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        const sdpRes = await fetch(
          `https://api.openai.com/v1/realtime/calls?model=${encodeURIComponent(model)}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${clientSecret}`, 'Content-Type': 'application/sdp' },
            body: offer.sdp,
          },
        )
        if (!sdpRes.ok) throw new Error(`webrtc ${sdpRes.status}`)
        const answerSdp = await sdpRes.text()
        if (cancelled) return release()
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })
      } catch (err) {
        if (cancelled) return
        console.error('voice session error:', err)
        fail('AIとの接続に失敗しました。通信環境を確認して、もう一度お試しください。')
      }
    }

    controls.current = {
      stop: finish,
      toggleMute: () => {
        const track = mic?.getAudioTracks()[0]
        if (!track) return
        track.enabled = !track.enabled
        setMuted(!track.enabled)
      },
    }

    connect()
    return () => {
      cancelled = true
      release()
    }
  }, [])

  const active = state === 'listening' || state === 'processing' || state === 'speaking'
  return {
    // マイクオフ中は接続状態よりも「オフである」ことを優先して見せる
    state: muted && active ? ('muted' as VoiceState) : state,
    muted,
    errorMessage,
    transcript,
    savedTitles,
    stop: () => controls.current.stop(),
    toggleMute: () => controls.current.toggleMute(),
  }
}
