"use client"

import { useChat } from "@/context/chat-context"
import type { Question } from "@/lib/types"

interface Props {
  question: Question
  index: number
  total: number
}

export default function KuesionerStepper({ question, index, total }: Props) {
  const { submitAnswer, dispatch } = useChat()

  function handleSelect(opt: (typeof question.options)[0]) {
    submitAnswer({ text: opt.text, score: opt.score })
    if (index + 1 >= total) {
      dispatch({ type: "GO_TO_STEP", payload: index + 1 })
      dispatch({ type: "CALCULATE_PROFILE" })
    } else {
      dispatch({ type: "GO_TO_STEP", payload: index + 1 })
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="mb-2 text-sm text-zinc-500">
        Pertanyaan {index + 1} dari {total}
      </div>
      <div className="w-full bg-zinc-200 rounded-full h-2 mb-6">
        <div
          className="bg-green-600 h-2 rounded-full transition-all"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <h2 className="text-lg font-semibold mb-4">{question.text}</h2>

      <div className="space-y-2">
        {question.options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => handleSelect(opt)}
            className="w-full text-left p-3 rounded-lg border border-zinc-300 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  )
}
