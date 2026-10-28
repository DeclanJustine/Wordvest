"use client"

import { useChat } from "@/context/chat-context"

export default function ProfileResult() {
  const { state } = useChat()
  const { profile, kuesionerData } = state

  if (!profile || !kuesionerData) return null

  return (
    <div className="w-full max-w-3xl mx-auto text-center">
      <h2 className="font-serif text-[30px] font-bold tracking-tight text-[#242424] mb-6">
        Kuesioner Selesai!
      </h2>

      <div className="bg-white border-2 border-[#242424] rounded-xl p-6 mb-6 shadow-[4px_4px_0_#242424]">
        <p className="text-[13px] text-[#6B6B6B] mb-1">Profil Risiko Anda</p>
        <h3 className="font-serif text-[28px] font-bold text-[#242424]">{profile.name}</h3>
        {profile.description && (
          <p className="mt-3 text-[15px] text-[#6B6B6B] leading-relaxed">{profile.description}</p>
        )}
      </div>

      <div className="text-left mb-6">
        <p className="font-bold text-[#242424] mb-3">Alokasi produk yang sesuai:</p>
        <div className="space-y-2">
          {Object.entries(profile.allocation).map(([cat, alokasi]) => {
            const produk = kuesionerData.product_categories[cat]?.join(", ") || ""
            return (
              <div key={cat} className="flex justify-between items-center gap-4 bg-zinc-50 border border-[#F2F2F2] rounded-lg p-3 hover:border-zinc-300 transition-colors">
                <div>
                  <span className="font-medium text-[#242424]">{cat}</span>
                  <span className="text-[#6B6B6B] text-sm ml-2">({alokasi})</span>
                </div>
                <span className="text-sm text-[#6B6B6B] text-right">{produk}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
