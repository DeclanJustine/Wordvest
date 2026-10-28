"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@/context/chat-context"

interface RecognitionResultItem {
  isFinal: boolean
  0: { transcript: string }
}

interface RecognitionResultEvent {
  results: ArrayLike<RecognitionResultItem>
}

interface RecognitionErrorEvent {
  error?: string
}

interface RecognitionInstance {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: RecognitionResultEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: RecognitionErrorEvent) => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => RecognitionInstance

interface SpeechWindow {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

function getRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null
  const w = window as Window & SpeechWindow
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export default function ChatInput() {
  const [input, setInput] = useState("")
  const [isListening, setIsListening] = useState(false)
  // Default false agar render server & render pertama client identik
  // (cek window hanya boleh setelah mount demi menghindari hydration mismatch).
  const [supported, setSupported] = useState(false)
  const { sendMessage, state } = useChat()
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<RecognitionInstance | null>(null)
  const transcriptRef = useRef("")
  const submittedRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)

  const AUTO_SUBMIT_DELAY_MS = 2000

  function clearPendingTimer() {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(getRecognitionConstructor() !== null)
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      const rec = recognitionRef.current
      if (rec) {
        try {
          rec.stop()
        } catch {
          recognitionRef.current = null
        }
      }
    }
  }, [])

  function submitText(text: string) {
    const trimmed = text.trim()
    if (!trimmed || state.isLoading) return
    submittedRef.current = true
    sendMessage(trimmed)
    setInput("")
    transcriptRef.current = ""
    inputRef.current?.focus()
  }

  function scheduleAutoSubmit() {
    if (submittedRef.current) return
    clearPendingTimer()
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      if (!submittedRef.current) submitText(transcriptRef.current)
    }, AUTO_SUBMIT_DELAY_MS)
  }

  function startListening() {
    const SR = getRecognitionConstructor()
    if (!SR || state.isLoading) return

    const prev = recognitionRef.current
    if (prev) {
      try {
        prev.stop()
      } catch {
        recognitionRef.current = null
      }
    }

    const recognition = new SR()
    submittedRef.current = false
    cancelledRef.current = false
    transcriptRef.current = ""
    clearPendingTimer()

    recognition.lang = "id-ID"
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (event) => {
      let transcript = ""
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i]
        transcript += res[0]?.transcript ?? ""
      }
      transcriptRef.current = transcript
      setInput(transcript)
      const el = inputRef.current
      if (el) {
        try {
          el.setSelectionRange(transcript.length, transcript.length)
        } catch {
          // abaikan jika browser tidak mendukung
        }
        el.scrollLeft = el.scrollWidth
      }
      if (submittedRef.current) return
      const last = event.results.length > 0 ? event.results[event.results.length - 1] : undefined
      if (last?.isFinal) {
        scheduleAutoSubmit()
        try {
          recognition.stop()
        } catch {
          recognitionRef.current = null
        }
      } else if (timeoutRef.current !== null) {
        scheduleAutoSubmit()
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
      if (submittedRef.current || cancelledRef.current || timeoutRef.current !== null) return
      if (transcriptRef.current.trim()) scheduleAutoSubmit()
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        window.alert("Akses mikrofon ditolak. Izinkan mikrofon di browser untuk menggunakan input suara.")
      }
    }

    recognitionRef.current = recognition
    setIsListening(true)
    try {
      recognition.start()
    } catch {
      setIsListening(false)
      recognitionRef.current = null
    }
  }

  function toggleListening() {
    if (isListening) {
      clearPendingTimer()
      cancelledRef.current = true
      const rec = recognitionRef.current
      if (rec) {
        try {
          rec.stop()
        } catch {
          recognitionRef.current = null
        }
      }
      setIsListening(false)
      return
    }
    startListening()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || state.isLoading) return
    clearPendingTimer()
    submittedRef.current = true
    const rec = recognitionRef.current
    if (rec) {
      try {
        rec.stop()
      } catch {
        recognitionRef.current = null
      }
    }
    setIsListening(false)
    sendMessage(input)
    setInput("")
    transcriptRef.current = ""
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-zinc-200">
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Masukkan pertanyaan disini"
        disabled={state.isLoading}
        className="flex-1 px-4 py-2 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-black-500 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={toggleListening}
        disabled={!supported || state.isLoading}
        title={
          !supported
            ? "Input suara tidak didukung browser ini"
            : isListening
              ? "Klik untuk berhenti"
              : "Input suara"
        }
        className={`px-3 py-2 rounded-xl border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isListening
            ? "bg-red-500 text-white border-red-500"
            : "border-zinc-300 text-zinc-600 hover:bg-zinc-100"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      </button>
      <button
        type="submit"
        disabled={!input.trim() || state.isLoading}
        className="px-4 py-2 bg-stone-600 text-white rounded-xl hover:bg-stone-700 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {state.isLoading ? "..." : "Kirim"}
      </button>
    </form>
  )
}
