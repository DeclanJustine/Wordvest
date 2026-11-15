import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/auth-context"
import AuthGuard from "@/components/auth-guard"
import { ChatProvider } from "@/context/chat-context"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Asisten Pasar Modal",
  description: "Asisten Edukasi Pasar Modal Indonesia",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <AuthGuard>
            <ChatProvider>{children}</ChatProvider>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  )
}
