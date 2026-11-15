"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import {
  ApiError,
  getMe,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
} from "@/lib/api"
import type { User } from "@/lib/types"

interface AuthContextValue {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    getMe()
      .then((data) => {
        if (!cancelled) setUser(data.user)
      })
      .catch((e) => {
        if (cancelled) return
        if (!(e instanceof ApiError && e.status === 401)) {
          setError(e instanceof Error ? e.message : "Gagal terhubung ke server")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function login(email: string, password: string) {
    setError(null)
    const data = await apiLogin(email, password)
    setUser(data.user)
  }

  async function register(email: string, password: string) {
    setError(null)
    const data = await apiRegister(email, password)
    setUser(data.user)
  }

  async function logout() {
    try {
      await apiLogout()
    } finally {
      setUser(null)
      setError(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
