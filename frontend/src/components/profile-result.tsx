"use client"

import { useChat } from "@/context/chat-context"

export default function ProfileResult() {
  const { state } = useChat()
  const { profile, kuesionerData } = state

  if (!profile || !kuesionerData) return null

  return (
    <div className="w-full max-w-5xl mx-auto text-center">
      <h2 className="text-xl font-bold mb-1">Kuesioner Selesai!</h2>

      <div className="bg-stone-200 border border-bl-200 rounded-xl p-6 mb-6">
        <p className="text-sm text-zinc-500 mb-1">Profil Risiko Anda</p>
        <h3 className="text-2xl font-bold text-black-800">{profile.name}</h3>
        {profile.description && (
          <p className="mt-3 text-sm text-zinc-600">{profile.description}</p>
        )}
      </div>

      <div className="text-left mb-6">
        <p className="font-semibold mb-3">Alokasi produk yang sesuai:</p>
        <div className="space-y-2">
          {Object.entries(profile.allocation).map(([cat, alokasi]) => {
            const produk = kuesionerData.product_categories[cat]?.join(", ") || ""
            return (
              <div key={cat} className="flex justify-between items-center bg-zinc-50 rounded-lg p-3">
                <div>
                  <span className="font-medium">{cat}</span>
                  <span className="text-zinc-500 text-sm ml-2">({alokasi})</span>
                </div>
                <span className="text-sm text-zinc-500">{produk}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
