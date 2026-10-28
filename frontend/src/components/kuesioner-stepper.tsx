"use client"

import { useState } from "react"
import { useChat } from "@/context/chat-context"
import type { Question, Option } from "@/lib/types"

export default function KuesionerStepper({
  questions,
  onProgress,
}: {
  questions: Question[]
  onProgress?: (answered: number) => void
}) {
  const { submitAnswer, dispatch } = useChat()
  const [selected, setSelected] = useState<Record<number, Option>>({})

  const answered = Object.keys(selected).length
  const complete = answered >= questions.length

  function handleSelect(index: number, opt: Option) {
    const next = { ...selected, [index]: opt }
    setSelected(next)
    onProgress?.(Object.keys(next).length)
  }

  function handleSubmit() {
    if (!complete) return
    questions.forEach((_, i) => {
      const opt = selected[i]
      submitAnswer({ text: opt.text, score: opt.score })
    })
    dispatch({ type: "GO_TO_STEP", payload: questions.length })
    dispatch({ type: "CALCULATE_PROFILE" })
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {questions.map((question, i) => (
        <div key={i} className="rounded-xl border border-[#F2F2F2] p-5">
          <h2 className="text-[16px] font-semibold text-[#242424] mb-3">
            <span className="font-mono text-[13px] text-[#6B6B6B] mr-2">{i + 1}.</span>
            {question.text}
          </h2>
          <div className="space-y-2">
            {question.options.map((opt) => {
              const active = selected[i]?.label === opt.label
              return (
                <button
                  key={opt.label}
                  onClick={() => handleSelect(i, opt)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer text-[15px] ${
                    active
                      ? "border-[#242424] border-2 bg-zinc-50 font-medium"
                      : "border-zinc-300 hover:bg-stone-100"
                  }`}
                >
                  {opt.text}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={!complete}
        className="w-full py-3 bg-[#242424] text-white text-[15px] font-medium rounded-xl hover:bg-black transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {complete ? "Lihat Hasil Profil" : `Jawab semua pertanyaan (${answered}/${questions.length})`}
      </button>
    </div>
  )
}
