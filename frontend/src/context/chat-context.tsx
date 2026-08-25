"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import type { KuesionerData, Profile, Message } from "@/lib/types"
import { fetchKuesioner, sendChat, resetSession } from "@/lib/api"

interface Answer {
  text: string
  score: number
}

interface ChatState {
  sessionId: string
  currentStep: number
  answers: Answer[]
  totalScore: number
  profile: Profile | null
  kuesionerData: KuesionerData | null
  messages: Message[]
  isLoading: boolean
  error: string | null
}

type Action =
  | { type: "SET_KUESIONER"; payload: KuesionerData }
  | { type: "ANSWER_QUESTION"; payload: Answer }
  | { type: "GO_TO_STEP"; payload: number }
  | { type: "CALCULATE_PROFILE" }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" }

function generateId(): string {
  return crypto.randomUUID()
}

function getProfile(profiles: Profile[], totalScore: number): Profile {
  for (const p of profiles) {
    if (totalScore >= p.min_score && totalScore <= p.max_score) return p
  }
  return profiles[profiles.length - 1]
}

const initialState: ChatState = {
  sessionId: generateId(),
  currentStep: 0,
  answers: [],
  totalScore: 0,
  profile: null,
  kuesionerData: null,
  messages: [],
  isLoading: false,
  error: null,
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
      }
    }
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "RESET":
      return { ...initialState, sessionId: generateId(), kuesionerData: state.kuesionerData }
    default:
      return state
  }
}

const ChatContext = createContext<{
  state: ChatState
  dispatch: React.Dispatch<Action>
  submitAnswer: (answer: Answer) => void
  sendMessage: (text: string) => Promise<void>
  resetAll: () => void
} | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    fetchKuesioner()
      .then((data) => dispatch({ type: "SET_KUESIONER", payload: data }))
      .catch((e) => dispatch({ type: "SET_ERROR", payload: e.message }))
  }, [])

  function submitAnswer(answer: Answer) {
    dispatch({ type: "ANSWER_QUESTION", payload: answer })
  }

  async function sendMessage(text: string) {
    if (!text.trim() || state.isLoading) return

    dispatch({ type: "ADD_MESSAGE", payload: { role: "user", content: text } })
    dispatch({ type: "SET_LOADING", payload: true })

    try {
      const result = await sendChat(state.sessionId, text)
      dispatch({
        type: "ADD_MESSAGE",
        payload: { role: "assistant", content: result.answer },
      })
    } catch (e: any) {
      dispatch({ type: "SET_ERROR", payload: e.message })
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  async function resetAll() {
    await resetSession(state.sessionId)
    dispatch({ type: "RESET" })
  }

  return (
    <ChatContext.Provider value={{ state, dispatch, submitAnswer, sendMessage, resetAll }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChat must be used within ChatProvider")
  return ctx
}
