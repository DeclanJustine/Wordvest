"use client"

import { useState, useEffect } from "react"
import type { Message } from "@/lib/types"

interface Props {
  message: Message
}

function pickIndonesianVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find(v => v.lang.toLowerCase().startsWith("id")) ||
    voices.find(v => v.lang.toLowerCase() === "id-id") ||
    null
  )
}

const SpeakerIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M11 5 6 9H2v6h4l5 4z" />
    <line x1="15.5" y1="8.5" x2="18.5" y2="11.5" />
    <line x1="18.5" y1="8.5" x2="15.5" y2="11.5" />
  </svg>
)

const StopIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className={className}>
    <rect x="6" y="6" width="12" height="12" rx="1" />
  </svg>
)

export default function ChatBubble({ message }: Props) {
  const isUser = message.role === "user"
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    return () => window.speechSynthesis?.cancel()
  }, [])

  function toggleSpeak() {
    const synth = window.speechSynthesis
    if (!synth) return

    if (isSpeaking) {
      synth.cancel()
      setIsSpeaking(false)
      return
    }

    synth.cancel()
    const utter = new SpeechSynthesisUtterance(message.content)
    utter.lang = "id-ID"
    const voice = pickIndonesianVoice()
    if (voice) utter.voice = voice
    utter.onend = () => setIsSpeaking(false)
    utter.onerror = () => setIsSpeaking(false)
    synth.speak(utter)
    setIsSpeaking(true)
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isUser ? "bg-slate-600 text-white" : "bg-zinc-100 text-zinc-900"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {!isUser && message.content.trim() && (
          <button
            onClick={toggleSpeak}
            title={isSpeaking ? "Hentikan suara" : "Bacakan jawaban"}
            className={`mt-2 flex items-center gap-1 text-xs cursor-pointer transition-colors ${
              isUser ? "" : isSpeaking ? "text-blue-600" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {isSpeaking ? <StopIcon /> : <SpeakerIcon />}
            {isSpeaking ? "Berhenti" : "Bacakan"}
          </button>
        )}
      </div>
    </div>
  )
}