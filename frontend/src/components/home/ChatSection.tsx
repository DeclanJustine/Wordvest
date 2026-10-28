"use client"

import { useEffect, useRef } from "react"
import { useChat } from "@/context/chat-context"
import ChatBubble from "@/components/chat-bubble"
import ChatInput from "@/components/chat-input"

const exampleQuestions = [
  "Apa itu saham?",
  "Apa yang dimaksud dengan IPO?",
  "Apa itu dividen?",
  "Apa itu reksa dana?",
]

export default function ChatSection() {
  const { state, sendMessage, hydrated } = useChat()
  const { messages, isLoading, chatError } = state
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current?.scrollHeight })
  }, [messages, isLoading])

  function handleExportChat() {
    if (!messages.some((msg) => msg.role === "user")) {
      alert("Tidak ada percakapan untuk diekspor.")
      return
    }

    const lines = messages.map((msg) => {
      const prefix = msg.role === "user" ? "Anda" : "AI"
      return `${prefix}: ${msg.content}`
    })
    const content = lines.join("\n\n")

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `riwayat_chat_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-xl border border-[#F2F2F2] overflow-hidden">
      <div className="p-4 border-b border-[#F2F2F2] flex justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#242424]">Wordvest - AI Edukasi Dasar Pasar Modal</h3>
          <p className="text-sm text-[#6B6B6B]">Tanyakan apa saja tentang istilah pasar modal Indonesia</p>
        </div>
        <button
          onClick={handleExportChat}
          className="shrink-0 px-3 py-1 text-sm bg-zinc-100 hover:bg-zinc-200 rounded transition-colors cursor-pointer"
        >
          Ekspor
        </button>
      </div>

      <div ref={scrollRef} className="h-[420px] overflow-y-auto p-4 space-y-1 bg-white">
        {!hydrated ? (
          <p className="text-sm text-[#6B6B6B]">Memuat...</p>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}
            {!messages.some((m) => m.role === "user") && (
              <div className="flex flex-wrap gap-2 pt-1">
                {exampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1 text-sm bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded text-[#6B6B6B] hover:text-[#242424] cursor-pointer transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div
                  className="bg-zinc-100 rounded-2xl px-4 py-2 text-[#6B6B6B] text-sm"
                  role="status"
                  aria-label="Mengetik"
                >
                  <span className="typing-cursor" aria-hidden="true" />
                </div>
              </div>
            )}
            {chatError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600"
              >
                <p className="font-medium">Gagal mengirim pesan.</p>
                {chatError !== "Gagal mengirim pesan" && (
                  <p className="mt-1 text-xs text-red-500">{chatError}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-[#F2F2F2]">
        <ChatInput />
      </div>
    </div>
  )
}
