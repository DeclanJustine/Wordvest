"use client"

import { useRouter } from "next/navigation"
import { useChat } from "@/context/chat-context"
import KuesionerStepper from "@/components/kuesioner-stepper"
import ProfileResult from "@/components/profile-result"

export default function Home() {
  const { state } = useChat()
  const router = useRouter()
  const { kuesionerData, currentStep, isLoading, error } = state

  if (isLoading && !kuesionerData) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500">Memuat kuesioner...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">Gagal memuat data</p>
          <p className="text-sm text-zinc-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!kuesionerData) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500">Memuat kuesioner...</p>
      </div>
    )
  }

  const questions = kuesionerData.questions
  const isDone = currentStep >= questions.length

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6">
      {isDone ? (
        <>
          <ProfileResult />
          <button
            onClick={() => router.push("/chat")}
            className="mt-4 px-6 py-2 bg-stone-600 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Mulai Chat
          </button>
        </>
      ) : (
        <KuesionerStepper
          question={questions[currentStep]}
          index={currentStep}
          total={questions.length}
        />
      )}
    </div>
  )
}
