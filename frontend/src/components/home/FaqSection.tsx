"use client"

import { useState } from "react"
import faqChunks from "@/data/faq-chunks.json"

type FaqEntry = {
  question: string
  answer: string
  source: string | null
  page: number | null
  covered: boolean
}

const faqs = faqChunks as FaqEntry[]

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="divide-y divide-[#F2F2F2] border-y border-[#F2F2F2]">
      {faqs.map((faq, i) => {
        const isOpen = open === i
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-4 py-4 px-2 -mx-2 text-left cursor-pointer rounded-lg transition-colors hover:bg-zinc-100"
            >
              <span className={`text-[16px] ${isOpen ? "font-semibold text-[#242424]" : "text-[#242424]"}`}>
                {faq.question}
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`w-4 h-4 shrink-0 text-[#6B6B6B] transition-transform ${isOpen ? "rotate-180" : ""}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {isOpen && (
              <div className="pb-4">
                <p className="text-[15px] text-[#6B6B6B] leading-relaxed whitespace-pre-line text-justify">{faq.answer}</p>
                {faq.covered && faq.source ? (
                  <p className="mt-2 text-[13px] text-zinc-400">
                    Sumber: {faq.source}{faq.page !== null ? `, hal. ${faq.page}` : ""}
                  </p>
                ) : (
                  <p className="mt-2 text-[13px] text-zinc-400 italic">Ringkasan umum</p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
