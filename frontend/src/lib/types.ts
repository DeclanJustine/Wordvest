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
  role: "user" | "assistant"
  content: string
}

export interface ChatResponse {
  answer: string
}
