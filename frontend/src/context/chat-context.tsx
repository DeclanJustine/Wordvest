"use client"

import { createContext, useContext, useReducer, useEffect, useState, type ReactNode } from "react"
import type { KuesionerData, Profile, Message } from "@/lib/types"
import { fetchKuesioner, sendChat } from "@/lib/api"

interface Answer {
  text: string
  score: number
}

interface ChatState {
  sessionId: string
  currentStep: number
  answers: Answer[]
  totalScore: number
  savedAnswers: Answer[]
  savedTotalScore: number
  profile: Profile | null
  kuesionerData: KuesionerData | null
  messages: Message[]
  isLoading: boolean
  error: string | null
  chatError: string | null
}

type Action =
  | { type: "SET_KUESIONER"; payload: KuesionerData }
  | { type: "ANSWER_QUESTION"; payload: Answer }
  | { type: "GO_TO_STEP"; payload: number }
  | { type: "CALCULATE_PROFILE" }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_CHAT_ERROR"; payload: string | null }
  | { type: "HYDRATE"; payload: PersistedState }
  | { type: "RESET_QUIZ" }

function generateId(): string {
  return crypto.randomUUID()
}

function getProfile(profiles: Profile[], totalScore: number): Profile {
  for (const p of profiles) {
    if (totalScore >= p.min_score && totalScore <= p.max_score) return p
  }
  return profiles[profiles.length - 1]
}

const GREETING: Message = {
  role: "assistant",
  content:
    "Halo, saya adalah AI untuk edukasi pasar modal Indonesia. Saya dapat membantu Anda memahami berbagai istilah seperti saham, obligasi, reksa dana, hingga IPO. Silakan ajukan pertanyaan Anda, atau pilih pertanyaan dibawah ini.",
}

const initialState: ChatState = {
  sessionId: generateId(),
  currentStep: 0,
  answers: [],
  totalScore: 0,
  savedAnswers: [],
  savedTotalScore: 0,
  profile: null,
  kuesionerData: null,
  messages: [GREETING],
  isLoading: false,
  error: null,
  chatError: null,
}

const STORAGE_KEY = "chatState"

interface PersistedState {
  profile: Profile | null
  savedAnswers: Answer[]
  savedTotalScore: number
}

const EMPTY_PERSISTED_STATE: PersistedState = {
  profile: null,
  savedAnswers: [],
  savedTotalScore: 0,
}

function loadPersistedState(): PersistedState {
  try {
    if (typeof window === "undefined") return EMPTY_PERSISTED_STATE
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_PERSISTED_STATE
    const data = JSON.parse(raw)
    return {
      profile: data.profile && typeof data.profile === "object" ? (data.profile as Profile) : null,
      savedAnswers: Array.isArray(data.savedAnswers) ? (data.savedAnswers as Answer[]) : [],
      savedTotalScore: typeof data.savedTotalScore === "number" ? data.savedTotalScore : 0,
    }
  } catch {
    return EMPTY_PERSISTED_STATE
  }
}

function reducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case "SET_KUESIONER":
      return { ...state, kuesionerData: action.payload }
    case "ANSWER_QUESTION": {
      const answers = [...state.answers, action.payload]
      const totalScore = answers.reduce((sum, a) => sum + a.score, 0)
      return { ...state, answers, totalScore }
    }
    case "GO_TO_STEP":
      return { ...state, currentStep: action.payload }
    case "CALCULATE_PROFILE": {
      if (!state.kuesionerData) return state
      return {
        ...state,
        profile: getProfile(state.kuesionerData.profiles, state.totalScore),
        savedAnswers: state.answers,
        savedTotalScore: state.totalScore,
      }
    }
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "SET_CHAT_ERROR":
      return { ...state, chatError: action.payload }
    case "HYDRATE":
      return {
        ...state,
        profile: action.payload.profile,
        savedAnswers: action.payload.savedAnswers,
        savedTotalScore: action.payload.savedTotalScore,
      }
    case "RESET_QUIZ":
      return {
        ...state,
        currentStep: 0,
        answers: [],
        totalScore: 0,
        savedAnswers: [],
        savedTotalScore: 0,
        profile: null,
      }
    default:
      return state
  }
}

const ChatContext = createContext<{
  state: ChatState
  dispatch: React.Dispatch<Action>
  hydrated: boolean
  submitAnswer: (answer: Answer) => void
  sendMessage: (text: string) => Promise<void>
  resetQuiz: () => void
} | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    fetchKuesioner()
      .then((data) => dispatch({ type: "SET_KUESIONER", payload: data }))
      .catch((e) => dispatch({ type: "SET_ERROR", payload: e instanceof Error ? e.message : "Gagal memuat kuesioner" }))
  }, [])

  useEffect(() => {
    const p = loadPersistedState()
    if (p.profile) {
      dispatch({ type: "HYDRATE", payload: p })
    }
    // Reading browser-only localStorage must happen after mount to avoid
    // SSR/client mismatch; marking hydrated enables the client-side guard.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return

    try {
      const payload: PersistedState = {
        profile: state.profile,
        savedAnswers: state.savedAnswers,
        savedTotalScore: state.savedTotalScore,
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {

    }
  }, [hydrated, state.profile, state.savedAnswers, state.savedTotalScore])

  function submitAnswer(answer: Answer) {
    dispatch({ type: "ANSWER_QUESTION", payload: answer })
  }

  function resetQuiz() {
    dispatch({ type: "RESET_QUIZ" })
  }

  async function sendMessage(text: string) {
    if (!text.trim() || state.isLoading) return

    dispatch({ type: "ADD_MESSAGE", payload: { role: "user", content: text } })
    dispatch({ type: "SET_LOADING", payload: true })
    dispatch({ type: "SET_CHAT_ERROR", payload: null })

    try {
      const result = await sendChat(state.sessionId, text)
      dispatch({
        type: "ADD_MESSAGE",
        payload: { role: "assistant", content: result.answer },
      })
    } catch (e) {
      dispatch({ type: "SET_CHAT_ERROR", payload: e instanceof Error ? e.message : "Terjadi kesalahan" })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  return (
    <ChatContext.Provider
      value={{ state, dispatch, hydrated, submitAnswer, sendMessage, resetQuiz }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChat must be used within ChatProvider")
  return ctx
}
