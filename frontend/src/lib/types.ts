export interface Option {
  label: string
  text: string
  score: number
}

export interface Question {
  text: string
  options: Option[]
}

export interface Profile {
  name: string
  min_score: number
  max_score: number
  description: string
  allocation: Record<string, string>
}

export interface ProductCategories {
  [category: string]: string[]
}

export interface KuesionerData {
  questions: Question[]
  profiles: Profile[]
  product_categories: ProductCategories
}

export interface Message {
  id?: number
  role: "user" | "assistant"
  content: string
  created_at?: string | null
}

export interface ChatResponse {
  answer: string
}

export interface Answer {
  text: string
  score: number
}

export interface User {
  id: number
  email: string
}

export interface AuthResponse {
  user: User
}

export interface ProfileResponse {
  profile: Profile | null
  answers: Answer[]
  total_score: number
}

export interface ChatHistoryResponse {
  messages: Message[]
}
