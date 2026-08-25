"use client"

import type { Message } from "@/lib/types"

interface Props {
  message: Message
}

export default function ChatBubble({ message }: Props) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isUser ? "bg-slate-600 text-white" : "bg-zinc-100 text-zinc-900"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}
