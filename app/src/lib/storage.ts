import { WizardState, StepId, WizardAnswers } from '@/types/wizard'

const STORAGE_KEY = 'wizard_state'

const defaultState: WizardState = {
  currentStep: 0,
  answers: {},
  completedSteps: [],
}

export function loadWizardState(): WizardState {
  if (typeof window === 'undefined') return defaultState
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return defaultState
    return JSON.parse(stored) as WizardState
  } catch {
    return defaultState
  }
}

export function saveWizardState(state: WizardState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
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

export function markStepComplete(state: WizardState, stepId: StepId): WizardState {
  if (state.completedSteps.includes(stepId)) return state
  return { ...state, completedSteps: [...state.completedSteps, stepId] }
}

export function clearWizardState(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
