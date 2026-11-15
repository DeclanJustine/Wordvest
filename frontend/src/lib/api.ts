import type {
  Answer,
  AuthResponse,
  ChatHistoryResponse,
  ChatResponse,
  KuesionerData,
  Profile,
  ProfileResponse,
} from "@/lib/types"

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json")

  let res: Response
  try {
    res = await fetch(path, {
      ...options,
      credentials: "include",
      headers,
    })
  } catch {
    throw new ApiError("Tidak dapat terhubung ke server. Pastikan backend berjalan.", 0)
  }

  if (!res.ok) {
    const body = await res.text()
    let detail = `HTTP ${res.status} ${res.statusText}`.trim()
    try {
      const data = JSON.parse(body)
      if (typeof data?.detail === "string") detail = data.detail
    } catch {
      const text = body.trim()
      if (text === "Internal Server Error") {
        detail = `Terjadi kesalahan server (HTTP ${res.status}). Coba lagi.`
      } else if (text) {
        detail = `HTTP ${res.status}: ${text.slice(0, 300)}`
      }
    }
    throw new ApiError(detail, res.status)
  }

  return res.json()
}

export async function fetchKuesioner(): Promise<KuesionerData> {
  return apiFetch<KuesionerData>("/api/kuesioner")
}

export async function getMe(): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/me")
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" })
}

export async function getProfile(): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>("/api/profile")
}

export async function saveProfile(
  profile: Profile,
  answers: Answer[],
  totalScore: number
): Promise<void> {
  await apiFetch("/api/profile", {
    method: "PUT",
    body: JSON.stringify({
      profile,
      answers,
      total_score: totalScore,
    }),
  })
}

export async function getChatHistory(): Promise<ChatHistoryResponse> {
  return apiFetch<ChatHistoryResponse>("/api/chat/history")
}

export async function sendChat(message: string): Promise<ChatResponse> {
  return apiFetch<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  })
}

export async function resetChat(): Promise<void> {
  await apiFetch("/api/chat/reset", { method: "POST" })
}
