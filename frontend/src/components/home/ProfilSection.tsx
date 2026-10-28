"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useChat } from "@/context/chat-context"

function parsePercent(s: string): number {
  const n = parseInt(s.replace(/[^0-9]/g, ""), 10)
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0
}

export default function ProfilSection() {
  const { state, resetQuiz, hydrated } = useChat()
  const { profile, kuesionerData, savedAnswers, savedTotalScore, error } = state
  const router = useRouter()

  function handleRetake() {
    resetQuiz()
    router.push("/")
  }

  if (!hydrated) {
    return (
      <div className="rounded-xl border border-[#F2F2F2] p-8 text-center">
        <p className="text-[15px] text-[#6B6B6B]">Memuat profil...</p>
      </div>
    )
  }

  if (!kuesionerData) {
    return (
      <div className="rounded-xl border border-[#F2F2F2] p-8 text-center">
        <p className="text-[15px] text-[#6B6B6B]">
          {error ? "Gagal memuat data profil." : "Memuat profil..."}
        </p>
        {error && <p className="mt-1 text-[13px] text-red-500">{error}</p>}
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
        <p className="font-serif text-[22px] font-bold text-[#242424]">
          Belum ada profil risiko
        </p>
        <p className="mt-2 text-[15px] text-[#6B6B6B]">
          Isi kuesioner singkat untuk mengetahui tipe investormu.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 px-6 py-2.5 bg-[#242424] text-white text-[15px] font-medium rounded-lg hover:bg-black transition-all hover:-translate-y-0.5"
        >
          Isi Kuesioner
        </Link>
      </div>
    )
  }

  const allocations = Object.entries(profile.allocation)
  const questions = kuesionerData.questions
  const hasRecap = savedAnswers.length >= questions.length && questions.length > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-2 rounded-xl border-2 border-[#242424] bg-[#242424] text-white p-6 shadow-[4px_4px_0_rgba(36,36,36,0.25)] flex flex-col justify-center">
          <p className="text-[13px] uppercase tracking-[0.15em] text-white/60">
            Tipe Investor
          </p>
          <p className="mt-1 font-serif text-[34px] font-bold leading-tight">
            {profile.name}
          </p>
          {profile.description && (
            <p className="mt-3 text-[14px] text-white/75 leading-relaxed">
              {profile.description}
            </p>
          )}
          <p className="mt-4 font-mono text-[13px] text-white/60">
            Total skor: {savedTotalScore}
          </p>
        </div>

        <div className="md:col-span-3 rounded-xl border-2 border-[#242424] bg-white p-6 shadow-[4px_4px_0_#242424]">
          <p className="font-bold text-[#242424]">Rekomendasi alokasi produk</p>
          <div className="mt-4 space-y-5">
            {allocations.map(([cat, alokasi]) => {
              const produk = kuesionerData.product_categories[cat]?.join(", ") || ""
              const pct = parsePercent(alokasi)
              return (
                <div key={cat}>
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="font-medium text-[#242424]">{cat}</p>
                    <span className="font-mono text-[13px] border border-[#242424] rounded-full px-2.5 py-0.5 bg-white shrink-0">
                      {alokasi}
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-zinc-100 overflow-hidden">
                    <div
                      className="h-full bg-[#242424] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {produk && <p className="mt-1.5 text-[14px] text-[#6B6B6B]">{produk}</p>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {hasRecap && (
        <div className="rounded-xl border border-[#F2F2F2] p-6">
          <div className="flex items-center justify-between gap-4">
            <p className="font-bold text-[#242424]">Rekap jawabanmu</p>
            <button
              onClick={handleRetake}
              className="shrink-0 px-3 py-1 text-sm bg-zinc-100 hover:bg-zinc-200 rounded transition-colors cursor-pointer"
            >
              Isi Kuesioner Ulang
            </button>
          </div>
          <div className="mt-4 divide-y divide-[#F2F2F2]">
            {questions.map((q, i) => (
              <div key={i} className="py-3">
                <p className="text-[14px] text-[#6B6B6B]">
                  <span className="font-mono text-[12px] mr-2">{i + 1}.</span>
                  {q.text}
                </p>
                <p className="mt-1 text-[15px] font-medium text-[#242424]">
                  {savedAnswers[i]?.text ?? "-"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-zinc-50 border border-[#F2F2F2] p-4">
        <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
          Catatan: profil risiko ini dibuat untuk tujuan edukasi dan bukan merupakan
          nasihat finansial. Pelajari setiap produk sebelum berinvestasi.
        </p>
      </div>
    </div>
  )
}
