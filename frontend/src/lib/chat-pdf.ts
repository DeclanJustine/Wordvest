import type { Message } from "@/lib/types"

const FONT_REGULAR = "/fonts/calibri.ttf"
const FONT_BOLD = "/fonts/calibri-bold.ttf"
const FONT_SIZE = 11
const LINE_HEIGHT = 5.5
const MARGIN = 15

function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result)
      resolve(result.slice(result.indexOf(",") + 1))
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(new Blob([buffer], { type: "font/ttf" }))
  })
}

async function loadFont(path: string): Promise<string> {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`Gagal memuat font: ${path}`)
  return arrayBufferToBase64(await response.arrayBuffer())
}

export async function exportChatToPdf(messages: Message[]): Promise<void> {
  const [{ jsPDF }, regularFont, boldFont] = await Promise.all([
    import("jspdf"),
    loadFont(FONT_REGULAR),
    loadFont(FONT_BOLD),
  ])

  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const maxWidth = pageWidth - MARGIN * 2
  const bottomLimit = pageHeight - MARGIN - 8

  doc.addFileToVFS("calibri.ttf", regularFont)
  doc.addFileToVFS("calibri-bold.ttf", boldFont)
  doc.addFont("calibri.ttf", "Calibri", "normal")
  doc.addFont("calibri-bold.ttf", "Calibri", "bold")
  doc.setFont("Calibri", "normal")
  doc.setFontSize(FONT_SIZE)

  let y = MARGIN

  function addPageIfNeeded(requiredHeight: number) {
    if (y + requiredHeight > bottomLimit) {
      doc.addPage()
      y = MARGIN
    }
  }

  doc.setFont("Calibri", "bold")
  doc.text("Riwayat Chat - Wordvest", MARGIN, y)
  y += 6

  doc.setFont("Calibri", "normal")
  doc.text(`Tanggal: ${new Date().toLocaleString("id-ID")}`, MARGIN, y)
  y += 4

  doc.setDrawColor(180)
  doc.line(MARGIN, y, pageWidth - MARGIN, y)
  y += 7

  for (const message of messages) {
    const content = message.content.trim()
    if (!content) continue

    const label = message.role === "user" ? "Anda" : "AI"

    addPageIfNeeded(LINE_HEIGHT * 2)
    doc.setFont("Calibri", "bold")
    doc.text(`${label}:`, MARGIN, y)
    y += LINE_HEIGHT

    doc.setFont("Calibri", "normal")
    for (const paragraph of content.split(/\r?\n/)) {
      const lines = doc.splitTextToSize(paragraph || " ", maxWidth) as string[]
      for (const line of lines) {
        addPageIfNeeded(LINE_HEIGHT)
        doc.text(line, MARGIN, y)
        y += LINE_HEIGHT
      }
    }

    y += 4
  }

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFont("Calibri", "normal")
    doc.setFontSize(FONT_SIZE)
    doc.text(`${page} / ${pageCount}`, pageWidth - MARGIN, pageHeight - 8, {
      align: "right",
    })
  }

  const date = new Date().toISOString().slice(0, 10)
  doc.save(`riwayat_chat_${date}.pdf`)
}
