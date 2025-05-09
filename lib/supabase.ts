import { createClient } from "@supabase/supabase-js"

// Check if the required environment variables are available
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("NEXT_PUBLIC_SUPABASE_URL is not defined")
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined")
}

// Create the Supabase client with proper error handling
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
)

export type User = {
  id: string
  email: string
  role: "admin" | "staff" | "tutor" | "customer"
  created_at: string
  full_name: string
  phone: string
  address: string
  status: "active" | "inactive" | "pending"
}

export type Tutor = {
  id: string
  user_id: string
  education: string
  experience: string
  subjects: string[]
  certificates: string[]
  rating: number
  status: "active" | "inactive" | "pending"
}

export type Customer = {
  id: string
  user_id: string
  student_name?: string
  student_age?: number
  student_grade?: string
}

export type Class = {
  id: string
  customer_id: string
  tutor_id?: string
  subject: string
  grade_level: string
  schedule: string[]
  location: string
  status: "pending" | "approved" | "in_progress" | "completed" | "cancelled"
  requirements: string
  created_at: string
  fee: number
}

export type Registration = {
  id: string
  class_id: string
  tutor_id: string
  status: "pending" | "approved" | "rejected"
  created_at: string
}

export type Contract = {
  id: string
  class_id: string
  tutor_id: string
  start_date: string
  end_date: string
  terms: string
  status: "active" | "completed" | "cancelled"
  created_at: string
}

export type Payment = {
  id: string
  class_id: string
  customer_id: string
  amount: number
  status: "pending" | "completed" | "refunded"
  payment_date: string
  payment_method: string
}

export type Salary = {
  id: string
  tutor_id: string
  class_id: string
  amount: number
  commission_fee: number
  status: "pending" | "paid"
  payment_date: string
}

export type Feedback = {
  id: string
  class_id: string
  customer_id: string
  tutor_id: string
  rating: number
  comment: string
  created_at: string
}

export type Incident = {
  id: string
  class_id: string
  reported_by: string
  description: string
  status: "pending" | "in_progress" | "resolved"
  created_at: string
  resolved_at?: string
}
