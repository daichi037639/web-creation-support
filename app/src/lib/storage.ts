import { WizardState, StepId, WizardAnswers, CardAnswer } from '@/types/wizard'

const STORAGE_KEY = 'wizard_state'

const defaultState: WizardState = {
  currentStep: 0,
  answers: {},
  completedSteps: [],
}

/** カード式導入前（v0.4以前）の STEP 1〜3 の保存形状 */
interface LegacyAnswers {
  step1?: { businessName?: string; products?: string; strengths?: string; history?: string }
  step2?: { targetAge?: string; targetProblem?: string; targetDesire?: string }
  step3?: { mainMessage?: string; tone?: string }
}

const LEGACY_CARD_MAP: [string, (a: LegacyAnswers) => string | undefined][] = [
  ['business-name', (a) => a.step1?.businessName],
  ['products', (a) => a.step1?.products],
  ['strengths', (a) => a.step1?.strengths],
  ['history', (a) => a.step1?.history],
  ['target-persona', (a) => a.step2?.targetAge],
  ['target-problem', (a) => a.step2?.targetProblem],
  ['target-desire', (a) => a.step2?.targetDesire],
  ['main-message', (a) => a.step3?.mainMessage],
]

export function migrateLegacyAnswers(answers: WizardAnswers & LegacyAnswers): WizardAnswers {
  if (answers.cards || (!answers.step1 && !answers.step2 && !('mainMessage' in (answers.step3 ?? {})))) {
    return answers
  }
  const cards: Record<string, CardAnswer> = {}
  for (const [id, pick] of LEGACY_CARD_MAP) {
    const value = pick(answers)?.trim()
    if (value) cards[id] = { value, status: 'answered' }
  }
  return {
    profile: answers.profile,
    cards,
    step3: answers.step3?.tone ? { tone: answers.step3.tone } : undefined,
    step4: answers.step4,
    step5: answers.step5,
    step6: answers.step6,
  }
}

export function loadWizardState(): WizardState {
  if (typeof window === 'undefined') return defaultState
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaultState
    const state = JSON.parse(stored) as WizardState
    return { ...state, answers: migrateLegacyAnswers(state.answers) }
  } catch {
    return defaultState
  }
}

/** 保存を画面（進捗メーターなど）へ即時反映させるための通知イベント */
export const WIZARD_STATE_EVENT = 'wizard-state-changed'

export function saveWizardState(state: WizardState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  window.dispatchEvent(new Event(WIZARD_STATE_EVENT))
}

export function updateStepAnswers(
  state: WizardState,
  stepKey: keyof WizardAnswers,
  answers: WizardAnswers[typeof stepKey],
): WizardState {
  return {
    ...state,
    answers: {
      ...state.answers,
      [stepKey]: { ...state.answers[stepKey], ...answers },
    },
  }
}

export function updateCards(
  state: WizardState,
  cards: Record<string, CardAnswer>,
): WizardState {
  return {
    ...state,
    answers: { ...state.answers, cards: { ...state.answers.cards, ...cards } },
  }
}

export function markStepComplete(state: WizardState, stepId: StepId): WizardState {
  if (state.completedSteps.includes(stepId)) return state
  return { ...state, completedSteps: [...state.completedSteps, stepId] }
}

export function clearWizardState(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
