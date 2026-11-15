"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export default function TopBar() {
  const { user, logout } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.replace("/login")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[52px] bg-white border-b-2 border-[#242424]">
      <div className="h-full px-6 flex items-center justify-between gap-4">
        <span className="font-serif text-[28px] font-bold tracking-tight text-[#242424]">
          Wordvest
        </span>
        {user && (
          <div className="flex items-center gap-3 min-w-0">
            <span className="hidden sm:block truncate max-w-[280px] text-[13px] text-[#6B6B6B]">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="shrink-0 rounded-lg border border-[#242424] px-3 py-1.5 text-[13px] font-medium text-[#242424] hover:bg-[#242424] hover:text-white transition-colors cursor-pointer"
            >
              Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
