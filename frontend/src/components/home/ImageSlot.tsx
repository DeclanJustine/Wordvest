"use client"

import { useState } from "react"
import Image from "next/image"

type Props = {
  src: string
  alt: string
  fileName: string
  width: number
  height: number
  className?: string
}

export default function ImageSlot({ src, alt, fileName, width, height, className }: Props) {
  const [missing, setMissing] = useState(false)

  if (missing) {
    return (
      <div
        className={`rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 flex items-center justify-center p-6 text-center ${className ?? ""}`}
      >
        <p className="text-[13px] text-[#6B6B6B]">
          Gambar menyusul — taruh file di <span className="font-mono">public/{fileName}</span>
        </p>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      onError={() => setMissing(true)}
      className={`rounded-lg object-cover ${className ?? ""}`}
    />
  )
}
