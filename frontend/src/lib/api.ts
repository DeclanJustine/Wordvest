const API_BASE = "http://localhost:8000"

export async function fetchKuesioner() {
  const res = await fetch(`${API_BASE}/api/kuesioner`)
  if (!res.ok) throw new Error("Gagal memuat kuesioner")
  return res.json()
}

export async function sendChat(sessionId: string, message: string) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  })
  if (!res.ok) throw new Error("Gagal mengirim pesan")
  return res.json()
}

export async function resetSession(sessionId: string) {
  await fetch(`${API_BASE}/api/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  })
}
