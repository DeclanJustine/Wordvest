"use client"

import { useEffect, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

const PUBLIC_PATHS = ["/login", "/register"]

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isPublic = PUBLIC_PATHS.includes(pathname)

  useEffect(() => {
    if (loading) return
    if (!user && !isPublic) router.replace("/login")
    if (user && isPublic) router.replace("/")
  }, [loading, user, isPublic, router])

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white text-[#6B6B6B]">
        <p className="font-mono text-[13px] tracking-wider">Memuat...</p>
      </div>
    )
  }

  if (!user && !isPublic) return null
  if (user && isPublic) return null

  return <>{children}</>
}
