export interface ClassRequest {
  id: string
  name: string
  subject: string
  description?: string
  status: "active" | "completed" | "cancelled" | "pending" | "approved" | "matched" | "rejected" // Class status
  created_at: string
  updated_at: string
  customer_id: string
  level: string
  province: string
  district: string
  address: string
  schedule: string
  tutor_requirements?: string
  special_requirements?: string
  selected_tutor_id?: string
  selected_tutor?: {
    id: string
    profiles: {
      full_name: string
      email: string
      phone_number?: string
    }
  }
  profiles?: {
    full_name: string
    email?: string
    phone_number?: string
  }
}
