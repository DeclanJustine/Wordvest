"use client"

import { useRouter } from "next/navigation"
import { useChat } from "@/context/chat-context"
import ChatBubble from "@/components/chat-bubble"
import ChatInput from "@/components/chat-input"
import Sidebar from "@/components/sidebar"
import { useEffect, useRef } from "react"

export default function ChatPage() {
  const { state } = useChat()
  const router = useRouter()
  const { messages, isLoading, profile } = state
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profile) router.push("/")
  }, [profile, router])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current?.scrollHeight })
  }, [messages, isLoading])

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <header className="p-4 border-b border-zinc-200">
          <h1 className="text-lg font-bold">Asisten Edukasi Pasar Modal</h1>
          <p className="text-sm text-zinc-500">
            Tanyakan apa saja tentang pasar modal Indonesia
          </p>
        </header>

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
              Mulai percakapan dengan mengetik pertanyaan Anda
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-zinc-100 rounded-2xl px-4 py-2 text-zinc-500 text-sm">
                <span className="typing-cursor">Mengetik</span>
              </div>
            </div>
          )}
        </div>

        <ChatInput />
      </main>
    </div>
  )
}
