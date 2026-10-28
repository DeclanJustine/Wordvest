"use client"

import { useEffect, useState } from "react"

const items = [
  { id: "beranda", label: "Beranda" },
  { id: "chat", label: "Chat AI" },
  { id: "panduan", label: "Panduan" },
  { id: "faq", label: "FAQ" },
  { id: "sumber", label: "Sumber Data" },
  { id: "profil", label: "Profil" },
]

function Icon({ id, active }: { id: string; active: boolean }) {
  const cls = `w-5 h-5 shrink-0 ${active ? "text-white" : "text-[#6B6B6B]"}`
  const fill = active ? "currentColor" : "none"
  const stroke = active ? "none" : "currentColor"
  switch (id) {
    case "beranda":
      return (
        <svg viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.8" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5 12 4l9 7.5M5.5 10.5V20h13v-9.5" />
        </svg>
      )
    case "sumber":
      return (
        <svg viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.8" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5V4.5ZM5 19.5A1.5 1.5 0 0 1 6.5 18H19v3H6.5a1.5 1.5 0 0 1-1.5-1.5Z" />
        </svg>
      )
    case "chat":
      return (
        <svg viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.8" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v11H9l-5 4V5Z" />
        </svg>
      )
    case "panduan":
      return (
        <svg viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.8" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.5C10 5 7.5 4.5 4.5 4.5v13c3 0 5.5.5 7.5 2 2-1.5 4.5-2 7.5-2v-13c-3 0-5.5.5-7.5 2Zm0 0v13" />
        </svg>
      )
    case "faq":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.8.3-.9 1-.9 1.7M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.8" className={cls}>
          <circle cx="12" cy="8" r="3.5" />
          <path strokeLinecap="round" d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
        </svg>
      )
  }
}

export default function HomeSidebar() {
  const [active, setActive] = useState("beranda")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    )
    for (const item of items) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <nav className="hidden md:flex w-[210px] shrink-0 flex-col gap-1 sticky top-[76px] self-start py-6 pr-2 -ml-4">
        {items.map((item) => {
          const isActive = active === item.id
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActive(item.id)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] transition-all ${
                isActive
                  ? "bg-[#242424] text-white font-medium shadow-[3px_3px_0_rgba(36,36,36,0.2)]"
                  : "text-[#6B6B6B] hover:text-[#242424] hover:bg-zinc-100"
              }`}
            >
              <Icon id={item.id} active={isActive} />
              {item.label}
            </a>
          )
        })}
      </nav>
      <nav className="md:hidden sticky top-[52px] z-40 bg-white border-b border-[#F2F2F2] flex gap-1 overflow-x-auto px-4 py-2">
        {items.map((item) => {
          const isActive = active === item.id
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setActive(item.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-[14px] transition-colors ${
                isActive ? "bg-[#242424] text-white font-medium" : "text-[#6B6B6B] hover:text-[#242424]"
              }`}
            >
              {item.label}
            </a>
          )
        })}
      </nav>
    </>
  )
}
