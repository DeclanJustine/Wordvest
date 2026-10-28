"use client"

import Link from "next/link"
import { useChat } from "@/context/chat-context"
import TopBar from "@/components/home/TopBar"
import HomeSidebar from "@/components/home/HomeSidebar"
import ImageSlot from "@/components/home/ImageSlot"
import ChatSection from "@/components/home/ChatSection"
import GuideSection from "@/components/home/GuideSection"
import FaqSection from "@/components/home/FaqSection"
import SumberSection from "@/components/home/SumberSection"
import ProfilSection from "@/components/home/ProfilSection"

type SectionIconId = "chat" | "panduan" | "faq" | "sumber" | "profil"

function SectionIcon({ id }: { id: SectionIconId }) {
  const cls = "w-7 h-7 shrink-0 text-[#242424]"
  switch (id) {
    case "chat":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v11H9l-5 4V5Z" />
        </svg>
      )
    case "panduan":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.5C10 5 7.5 4.5 4.5 4.5v13c3 0 5.5.5 7.5 2 2-1.5 4.5-2 7.5-2v-13c-3 0-5.5.5-7.5 2Zm0 0v13" />
        </svg>
      )
    case "faq":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.8.3-.9 1-.9 1.7M12 17h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
        </svg>
      )
    case "sumber":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={cls}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2Zm0 0v14c0 1.1 3.6 2 8 2s8-.9 8-2V5M4 12c0 1.1 3.6 2 8 2s8-.9 8-2" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={cls}>
          <circle cx="12" cy="8" r="3.5" />
          <path strokeLinecap="round" d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" />
        </svg>
      )
  }
}

function SectionTitle({ icon, children }: { icon: SectionIconId; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <SectionIcon id={icon} />
      <h2 className="font-serif text-[30px] font-bold tracking-tight text-[#242424]">
        {children}
      </h2>
    </div>
  )
}

const heroStats = ["1073 chunk", "1 sumber resmi"]

export default function HomePage() {
  const { state, hydrated } = useChat()

  return (
    <div className="min-h-dvh bg-white text-[#242424]">
      <TopBar />
      <div className="pt-[52px]">
        <div className="mx-auto max-w-[1600px] px-6 flex gap-10">
          <HomeSidebar />

          <main className="flex-1 min-w-0 py-6 space-y-14 pb-20">
            <section id="beranda" className="scroll-mt-24">
              <div className="pt-4 pb-10 grid gap-8 md:grid-cols-2 md:items-center">
                <div>
                  <h2 className="font-serif text-[38px] sm:text-[56px] font-bold tracking-tight text-balance text-[#242424] leading-[1.05]">
                    Kenali <em>Istilah</em> Pasar Modal.
                  </h2>
                  <p className="mt-3 text-[16px] text-[#6B6B6B]">
                    Asisten edukasi untuk memahami istilah-istilah pasar modal Indonesia
                    bersumber resmi, bernomor halaman, siap ditanya kapan saja.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <a
                      href="#chat"
                      className="px-5 py-2.5 bg-[#242424] text-white text-[15px] font-medium rounded-lg hover:bg-black transition-all hover:-translate-y-0.5"
                    >
                      Tanya Chat AI
                    </a>
                    {heroStats.map((s) => (
                      <span
                        key={s}
                        className="font-mono text-[12px] tracking-wider border border-[#242424] rounded-full px-3 py-1 bg-white"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <ImageSlot
                  src="/hero.svg"
                  alt="Ilustrasi Wordvest"
                  fileName="hero.svg"
                  width={800}
                  height={600}
                  className="w-full max-w-[420px] aspect-[4/3] justify-self-center"
                />
              </div>


              <div className="mt-8 space-y-5 text-[17px] text-[#242424] leading-[1.8] text-justify">
                <p className="first-letter:font-serif first-letter:text-[56px] first-letter:font-bold first-letter:float-left first-letter:leading-[0.9] first-letter:mr-2 first-letter:mt-1">
                  Wordvest adalah asisten edukasi berbasis kecerdasan buatan yang
                  membantu masyarakat Indonesia memahami istilah-istilah pasar modal.
                  Program ini dibangun untuk menjembatani kesenjangan antara materi
                  resmi yang kaku dan kebutuhan pemula akan penjelasan yang mudah
                  dipahami. Fungsinya adalah menjawab pertanyaan seputar istilah
                  seperti saham, obligasi, reksa dana, hingga IPO dengan merujuk pada
                  sumber yang jelas. Dengan begitu, pengguna tidak hanya mendapat
                  jawaban, tetapi juga tahu dari mana jawaban itu berasal.
                </p>
                <p>
                  Literasi pasar modal di Indonesia masih tergolong rendah, dan salah
                  satu penyebabnya adalah banyaknya istilah asing yang membingungkan
                  bagi pemula. Buku dan dokumen resmi memang lengkap, tetapi bahasanya
                  sering terlalu teknis untuk dibaca langsung. Akibatnya, banyak calon
                  investor menunda belajar atau justru mengambil keputusan tanpa
                  pemahaman yang cukup. Wordvest hadir untuk memecah hambatan itu
                  dengan menjadi teman bertanya yang selalu siap dan berbahasa santai.
                </p>
                <p>
                  Cara kerja program ini menggabungkan pencarian dokumen dan model
                  bahasa, yang dikenal sebagai retrieval-augmented generation. Setiap
                  pertanyaan akan dicarikan potongan materi yang paling relevan dari
                  Buku 3 - Pasar Modal, Seri Literasi Keuangan OJK, yang telah dipecah
                  menjadi 1073 chunk terindeks. Model bahasa kemudian menyusun jawaban
                  hanya berdasarkan potongan tersebut, lengkap dengan nomor halaman
                  sumbernya. Pendekatan ini membuat jawaban lebih akurat dan dapat
                  diverifikasi, bukan sekadar karangan model.
                </p>
                <p>
                  Website ini memiliki empat fitur utama yang saling melengkapi.
                  Pertama, kuesioner profil risiko untuk mengetahui tipe investormu,
                  apakah konservatif, moderat, atau agresif. Kedua, Chat AI untuk
                  bertanya bebas tentang istilah kapan saja, lengkap dengan fitur
                  ekspor percakapan. Ketiga, FAQ berisi pertanyaan umum yang jawabannya
                  diambil langsung dari materi. Keempat, halaman Sumber Data yang
                  transparan berisi sampul buku, daftar isi, dan tautan resmi OJK.
                </p>
                <p>
                  Wordvest paling cocok untuk mahasiswa dan investor pemula yang ingin
                  mulai dari pemahaman, bukan dari ikut-ikutan. Mulailah dengan mengisi
                  kuesioner profil risiko, lalu jelajahi dan tanyakan istilah yang
                  belum kamu pahami. Semakin sering bertanya, semakin akrab kamu
                  dengan bahasa pasar modal. Selamat belajar dan berinvestasi dengan
                  cerdas.
                </p>
              </div>
            </section>

            <section id="chat" className="scroll-mt-24 border-t border-[#F2F2F2] pt-10">
              <SectionTitle icon="chat">Chat AI</SectionTitle>
              <ChatSection />
            </section>

            <section id="panduan" className="scroll-mt-24 border-t border-[#F2F2F2] pt-10">
              <SectionTitle icon="panduan">Panduan</SectionTitle>
              <GuideSection />
            </section>

            <section id="faq" className="scroll-mt-24 border-t border-[#F2F2F2] pt-10">
              <SectionTitle icon="faq">FAQ - Frequently Asked Questions</SectionTitle>
              <FaqSection />
            </section>

            <section id="sumber" className="scroll-mt-24 border-t border-[#F2F2F2] pt-10">
              <SectionTitle icon="sumber">Sumber Data</SectionTitle>
              <SumberSection />
            </section>

            <section id="profil" className="scroll-mt-24 border-t border-[#F2F2F2] pt-10">
              <SectionTitle icon="profil">Profil</SectionTitle>
              {!hydrated ? (
                <div className="rounded-xl border border-[#F2F2F2] p-6 text-center">
                  <p className="text-[15px] text-[#6B6B6B]">Memuat profil...</p>
                </div>
              ) : state.profile ? (
                <ProfilSection />
              ) : (
                <div className="rounded-xl border border-[#F2F2F2] p-6 text-center">
                  <p className="text-[15px] text-[#6B6B6B]">
                    Kamu belum mengisi kuesioner profil risiko.
                  </p>
                  <Link
                    href="/"
                    className="inline-block mt-3 px-6 py-2 bg-stone-600 text-white rounded-lg hover:bg-stone-800 transition-colors text-[15px]"
                  >
                    Isi Kuesioner
                  </Link>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
