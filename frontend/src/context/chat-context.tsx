"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import type { Answer, KuesionerData, Message, Profile } from "@/lib/types"
import {
  ApiError,
  fetchKuesioner,
  getChatHistory,
  getProfile,
  resetChat as apiResetChat,
  saveProfile,
  sendChat,
} from "@/lib/api"
import { useAuth } from "@/context/auth-context"

interface ChatState {
  currentStep: number
  answers: Answer[]
  totalScore: number
  savedAnswers: Answer[]
  savedTotalScore: number
  profile: Profile | null
  profileDirty: boolean
  kuesionerData: KuesionerData | null
  messages: Message[]
  hydrated: boolean
  isLoading: boolean
  error: string | null
  chatError: string | null
}

type Action =
  | { type: "SET_KUESIONER"; payload: KuesionerData }
  | { type: "ANSWER_QUESTION"; payload: Answer }
  | { type: "GO_TO_STEP"; payload: number }
  | { type: "CALCULATE_PROFILE" }
  | { type: "PROFILE_SAVED" }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_CHAT_ERROR"; payload: string | null }
  | {
      type: "HYDRATE_DATA"
      payload: {
        profile: Profile | null
        answers: Answer[]
        totalScore: number
        messages: Message[]
      }
    }
  | { type: "HYDRATE_START" }
  | { type: "HYDRATE_ERROR"; payload: string }
  | { type: "RESET_DATA" }
  | { type: "RESET_CHAT" }
  | { type: "RESET_QUIZ" }

function matchProfile(profiles: Profile[], totalScore: number): Profile {
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
  currentStep: 0,
  answers: [],
  totalScore: 0,
  savedAnswers: [],
  savedTotalScore: 0,
  profile: null,
  profileDirty: false,
  kuesionerData: null,
  messages: [GREETING],
  hydrated: false,
  isLoading: false,
  error: null,
  chatError: null,
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
        profile: matchProfile(state.kuesionerData.profiles, state.totalScore),
        savedAnswers: state.answers,
        savedTotalScore: state.totalScore,
        profileDirty: true,
      }
    }
    case "PROFILE_SAVED":
      return { ...state, profileDirty: false }
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload }
    case "SET_CHAT_ERROR":
      return { ...state, chatError: action.payload }
    case "HYDRATE_DATA":
      return {
        ...state,
        profile: action.payload.profile,
        savedAnswers: action.payload.answers,
        savedTotalScore: action.payload.totalScore,
        profileDirty: false,
        messages: [GREETING, ...action.payload.messages],
        hydrated: true,
      }
    case "HYDRATE_START":
      return { ...state, hydrated: false }
    case "HYDRATE_ERROR":
      return { ...state, hydrated: true, error: action.payload }
    case "RESET_DATA":
      return {
        ...initialState,
        kuesionerData: state.kuesionerData,
        hydrated: false,
      }
    case "RESET_CHAT":
      return {
        ...state,
        messages: [GREETING],
        chatError: null,
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
        profileDirty: false,
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
  resetChat: () => Promise<boolean>
  resetQuiz: () => void
} | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, logout } = useAuth()
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    fetchKuesioner()
      .then((data) => dispatch({ type: "SET_KUESIONER", payload: data }))
      .catch((e) =>
        dispatch({
          type: "SET_ERROR",
          payload: e instanceof Error ? e.message : "Gagal memuat kuesioner",
        })
      )
  }, [])

  useEffect(() => {
    if (authLoading) return

    let cancelled = false
    if (!user) {
      dispatch({ type: "RESET_DATA" })
      return () => {
        cancelled = true
      }
    }

    dispatch({ type: "HYDRATE_START" })
    Promise.all([getProfile(), getChatHistory()])
      .then(([profileData, history]) => {
        if (cancelled) return
        dispatch({
          type: "HYDRATE_DATA",
          payload: {
            profile: profileData.profile,
            answers: profileData.answers,
            totalScore: profileData.total_score,
            messages: history.messages,
          },
        })
      })
      .catch((e) => {
        if (cancelled) return
        dispatch({
          type: "HYDRATE_ERROR",
          payload: e instanceof Error ? e.message : "Gagal memuat data akun",
        })
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, user])

  useEffect(() => {
    if (!state.hydrated || !user || !state.profileDirty || !state.profile) return

    let cancelled = false
    saveProfile(state.profile, state.savedAnswers, state.savedTotalScore)
      .then(() => {
        if (!cancelled) dispatch({ type: "PROFILE_SAVED" })
      })
      .catch((e) => {
        if (!cancelled) {
          dispatch({
            type: "SET_ERROR",
            payload: e instanceof Error ? e.message : "Gagal menyimpan profil",
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    state.hydrated,
    user,
    state.profileDirty,
    state.profile,
    state.savedAnswers,
    state.savedTotalScore,
  ])

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
      const result = await sendChat(text)
      dispatch({
        type: "ADD_MESSAGE",
        payload: { role: "assistant", content: result.answer },
      })
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await logout()
        dispatch({ type: "SET_CHAT_ERROR", payload: "Sesi berakhir. Silakan login lagi." })
      } else {
        dispatch({
          type: "SET_CHAT_ERROR",
          payload: e instanceof Error ? e.message : "Terjadi kesalahan",
        })
      }
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  async function resetChat() {
    try {
      await apiResetChat()
      dispatch({ type: "RESET_CHAT" })
      return true
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await logout()
      }
      dispatch({
        type: "SET_CHAT_ERROR",
        payload: e instanceof Error ? e.message : "Gagal menghapus riwayat",
      })
      return false
    }
  }

  return (
    <ChatContext.Provider
      value={{
        state,
        dispatch,
        hydrated: state.hydrated,
        submitAnswer,
        sendMessage,
        resetChat,
        resetQuiz,
      }}
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
