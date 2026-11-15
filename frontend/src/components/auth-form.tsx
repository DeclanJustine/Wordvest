"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { ApiError } from "@/lib/api"

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login, register, error: authError } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isRegister = mode === "register"
  const message = error ?? authError

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    setError(null)
    if (isRegister && password !== confirm) {
      setError("Konfirmasi password tidak sama")
      return
    }

    setSubmitting(true)
    try {
      if (isRegister) {
        await register(email, password)
      } else {
        await login(email, password)
      }
      router.replace("/home")
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) setError("Email atau password salah")
        else if (e.status === 409) setError("Email sudah terdaftar")
        else setError(e.message)
      } else {
        setError(e instanceof Error ? e.message : "Terjadi kesalahan")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-white text-[#242424] flex flex-col">
      <header className="h-[52px] border-b-2 border-[#242424] flex items-center justify-center shrink-0">
        <span className="font-serif text-[28px] font-bold tracking-tight">Wordvest</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[430px]">
          <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#6B6B6B]">
            Akun Wordvest
          </p>
          <h1 className="mt-2 font-serif text-[42px] font-bold tracking-tight leading-none">
            {isRegister ? "Buat akun." : "Masuk."}
          </h1>
          <p className="mt-3 text-[15px] text-[#6B6B6B] leading-relaxed">
            {isRegister
              ? "Simpan profil risiko dan riwayat belajarmu di satu tempat."
              : "Lanjutkan belajar dengan profil dan riwayat chat yang tersimpan."}
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-7 rounded-xl border-2 border-[#242424] bg-white p-6 shadow-[5px_5px_0_#242424] space-y-4"
          >
            <label className="block">
              <span className="text-[13px] font-semibold">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-[15px] outline-none focus:border-[#242424] focus:ring-2 focus:ring-[#242424]/20"
                placeholder="nama@email.com"
              />
            </label>

            <label className="block">
              <span className="text-[13px] font-semibold">Password</span>
              <input
                type="password"
                required
                minLength={isRegister ? 8 : undefined}
                autoComplete={isRegister ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-[15px] outline-none focus:border-[#242424] focus:ring-2 focus:ring-[#242424]/20"
                placeholder={isRegister ? "Minimal 8 karakter" : "Password"}
              />
            </label>

            {isRegister && (
              <label className="block">
                <span className="text-[13px] font-semibold">Ulangi password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-[15px] outline-none focus:border-[#242424] focus:ring-2 focus:ring-[#242424]/20"
                  placeholder="Ulangi password"
                />
              </label>
            )}

            {message && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#242424] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Memproses..." : isRegister ? "Daftar" : "Masuk"}
            </button>
          </form>

          <p className="mt-5 text-center text-[14px] text-[#6B6B6B]">
            {isRegister ? "Sudah punya akun? " : "Belum punya akun? "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-semibold text-[#242424] underline underline-offset-4"
            >
              {isRegister ? "Masuk" : "Daftar"}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
