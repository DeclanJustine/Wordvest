"use client"

import { useState, useRef } from "react"
import { useChat } from "@/context/chat-context"

export default function ChatInput() {
  const [input, setInput] = useState("")
  const { sendMessage, state } = useChat()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || state.isLoading) return
    sendMessage(input)
    setInput("")
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
        type="submit"
        disabled={!input.trim() || state.isLoading}
        className="px-4 py-2 bg-stone-600 text-white rounded-xl hover:bg-stone-700 disabled:opacity-50 transition-colors cursor-pointer"
      >
        {state.isLoading ? "..." : "Kirim"}
      </button>
    </form>
  )
}
