"use client"

import { useState } from "react"
import Image from "next/image"
import { bookInfo, tableOfContents } from "@/data/sumber"

export default function SumberSection() {
  const [coverMissing, setCoverMissing] = useState(false)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row gap-6 rounded-xl border-2 border-[#242424] bg-white p-6 shadow-[4px_4px_0_#242424]">
        <div className="w-full sm:w-[180px] shrink-0">
          {!coverMissing ? (
            <Image
              src={bookInfo.coverPath}
              alt={`Sampul ${bookInfo.title}`}
              width={360}
              height={480}
              onError={() => setCoverMissing(true)}
              className="w-full rounded-md border border-[#F2F2F2] object-cover"
            />
          ) : (
            <div className="w-full aspect-[3/4] rounded-md bg-zinc-100 flex items-center justify-center p-4 text-center">
              <p className="text-[13px] text-[#6B6B6B]">
                Cover menyusul — taruh file di <span className="font-mono">public/cover-buku-3.jpg</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[20px] font-bold text-[#242424]">{bookInfo.title}</h3>
          <p className="mt-1 text-[14px] text-[#6B6B6B]">{bookInfo.series}</p>
          <p className="mt-3 text-[15px] text-[#242424] leading-relaxed">
            Seluruh materi istilah dan jawaban di aplikasi ini bersumber dari buku ini
            ({bookInfo.pages} halaman, {bookInfo.chunks} chunk terindeks).
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={bookInfo.readUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#242424] text-white text-[14px] rounded-lg hover:bg-black transition-colors"
            >
              Baca Buku
            </a>
            <a
              href={bookInfo.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-zinc-300 text-[14px] rounded-lg hover:bg-zinc-100 transition-colors"
            >
              Unduh PDF
            </a>
          </div>
          <p className="mt-3 text-[13px] text-[#6B6B6B]">
            Sumber:{" "}
            <a
              href={bookInfo.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[#242424]"
            >
              {bookInfo.sourceName}
            </a>
          </p>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-[17px] text-[#242424] mb-3">Daftar Isi Buku</h3>
        <div className="divide-y divide-[#F2F2F2] border-y border-[#F2F2F2]">
          {tableOfContents.map((item) => (
            <div key={item.title} className="flex items-baseline justify-between gap-4 py-3">
              <p className="text-[15px] text-[#242424]">{item.title}</p>
              <span className="shrink-0 text-[13px] text-zinc-400">hal. {item.page}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
