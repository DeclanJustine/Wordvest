"use client"

import { useRouter } from "next/navigation"
import { useChat } from "@/context/chat-context"

export default function Sidebar() {
  const { state, resetAll } = useChat()
  const router = useRouter()
  const { profile, kuesionerData } = state

  async function handleReset() {
    await resetAll()
    router.push("/")
  }

  if (!kuesionerData) return null

  return (
    <aside className="w-64 border-r border-zinc-200 bg-zinc-50 p-4 flex flex-col gap-4">
      <div>
        {profile && (
          <div className="bg-white rounded-lg p-3 border border-zinc-200 mb-3">
            <p className="text-s text-zinc-500">Profil Risiko</p>
            <p className="font-bold text-black-800">{profile.name}</p>
            <br></br>
            <p className="text-xs text-zinc-500">Alokasi produk yang sesuai :</p>
            <div className="space-y-2">
              {Object.entries(profile.allocation).map(([cat, alokasi]) => {
                const produk = kuesionerData.product_categories[cat]?.join(", ") || ""
                return (
                  <div key={cat} className="flex justify-between items-center bg-zinc-50 rounded-lg p-3">
                    <div>
                      <span className="text-xs text-zinc-500">{cat} </span>
                      <span className="text-xs text-zinc-500">({alokasi})</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleReset}
        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
      >
        Hapus Riwayat
      </button>
    </aside>
  )
}
