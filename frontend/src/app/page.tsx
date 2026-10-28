"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@/context/chat-context"
import KuesionerStepper from "@/components/kuesioner-stepper"
import ProfileResult from "@/components/profile-result"
import TopBar from "@/components/home/TopBar"

function ProgressSidebar({
  answered,
  total,
  done,
}: {
  answered: number
  total: number
  done: boolean
}) {
  return (
    <aside className="hidden md:flex w-[210px] shrink-0 flex-col gap-4 sticky top-[76px] self-start py-6 pr-2">
      <div className="rounded-xl border-2 border-[#242424] bg-white p-4 shadow-[4px_4px_0_#242424]">
        <p className="font-serif text-[17px] font-bold text-[#242424]">Kuesioner</p>
        <p className="text-[13px] text-[#6B6B6B]">Profil Risiko Investasi</p>
        <p className="mt-3 text-[13px] text-[#242424] font-medium">
          {done
            ? "Selesai, profil kamu sudah jadi!"
            : total > 0
              ? `${answered} dari ${total} terjawab`
              : "Menyiapkan..."}
        </p>
      </div>
      <p className="text-[13px] text-[#6B6B6B] leading-relaxed px-1">
        Jawab semua pertanyaan dengan jujur sesuai kondisimu agar rekomendasi profil risikonya tepat.
      </p>
    </aside>
  )
}

export default function Home() {
  const { state, hydrated } = useChat()
  const router = useRouter()
  const { kuesionerData, currentStep, isLoading, error } = state
  const [answeredCount, setAnsweredCount] = useState(0)

  function shell(content: React.ReactNode, progress?: { answered: number; total: number; done: boolean }) {
    const showSidebar = !progress?.done
    return (
      <div className="min-h-dvh bg-white text-[#242424]">
        <TopBar />
        <div className="pt-[52px]">
          <div className="mx-auto max-w-[1400px] px-6 flex gap-6">
            {showSidebar && (
              <ProgressSidebar
                answered={progress?.answered ?? 0}
                total={progress?.total ?? 0}
                done={progress?.done ?? false}
              />
            )}
            <main className="flex-1 min-w-0 py-6 pb-20 flex flex-col items-center justify-center">
              {content}
            </main>
          </div>
        </div>
      </div>
    )
  }

  if (!hydrated) {
    return shell(<p className="text-zinc-500">Memuat...</p>)
  }

  if (isLoading && !kuesionerData) {
    return shell(<p className="text-zinc-500">Memuat kuesioner...</p>)
  }

  if (error) {
    return shell(
      <div className="text-center">
        <p className="text-red-500 mb-2">Gagal memuat data</p>
        <p className="text-sm text-zinc-500">{error}</p>
      </div>
    )
  }

  if (!kuesionerData) {
    return shell(<p className="text-zinc-500">Memuat kuesioner...</p>)
  }

  const questions = kuesionerData.questions
  const isDone = currentStep >= questions.length
  const progress = { answered: answeredCount, total: questions.length, done: isDone }

  return shell(
    isDone ? (
      <>
        <ProfileResult />
        <button
          onClick={() => router.push("/home")}
          className="mt-4 px-6 py-2 bg-stone-600 text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
        >
          Lanjut ke Beranda
        </button>
      </>
    ) : (
      <KuesionerStepper questions={questions} onProgress={setAnsweredCount} />
    ),
    progress
  )
}
