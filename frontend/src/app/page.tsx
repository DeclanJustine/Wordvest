"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@/context/chat-context"

export default function EntryPage() {
  const { state, hydrated } = useChat()
  const router = useRouter()

  useEffect(() => {
    if (!hydrated) return
    router.replace(state.profile ? "/home" : "/kuesioner")
  }, [hydrated, state.profile, router])

  return (
    <div className="min-h-dvh flex items-center justify-center bg-white text-[#6B6B6B]">
      <p className="font-mono text-[13px] tracking-wider">Memuat...</p>
    </div>
  )
}
